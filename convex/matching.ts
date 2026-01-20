import { internalMutation, mutation } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

const OFFER_DURATION_MS = 15_000;

// If there are zero online drivers, we don't want to hammer retries; we back off.
const NO_DRIVER_RETRY_INTERVAL_MS = 30_000;

// Scheduler timing isn't guaranteed to run at the exact millisecond.
// A small grace prevents "expire" running a hair early and leaving stale offers.
const EXPIRE_JOB_GRACE_MS = 250;

const MAX_OFFERS_PER_ATTEMPT = 3;

// If a driver explicitly rejects an order, we still want to be able to re-offer them later
// (business requirement: closest driver gets priority). This cooldown prevents immediate spam.
const REOFFER_AFTER_REJECTION_COOLDOWN_MS = 30_000;

// Driver location is considered "fresh" for matching if it's recent.
// If drivers don't send locations yet, we fall back to the legacy ordering.
const DRIVER_LOCATION_FRESH_MS = 2 * 60_000;

function toRadians(deg: number) {
  return (deg * Math.PI) / 180;
}

function haversineDistanceMeters(aLat: number, aLng: number, bLat: number, bLng: number) {
  // Earth radius (meters)
  const R = 6_371_000;
  const dLat = toRadians(bLat - aLat);
  const dLng = toRadians(bLng - aLng);
  const lat1 = toRadians(aLat);
  const lat2 = toRadians(bLat);

  const sinDLat = Math.sin(dLat / 2);
  const sinDLng = Math.sin(dLng / 2);

  const h = sinDLat * sinDLat + Math.cos(lat1) * Math.cos(lat2) * sinDLng * sinDLng;
  const c = 2 * Math.atan2(Math.sqrt(h), Math.sqrt(1 - h));
  return R * c;
}

const getOfferDurationMsForOrder = (order: any) => {
  const candidate = order?.offerTtlMs;
  if (typeof candidate !== "number") return OFFER_DURATION_MS;
  // Protect backend from extreme values.
  return Math.max(5_000, Math.min(candidate, 5 * 60_000));
};

const getMaxDriversToOfferForOrder = (order: any) => {
  const candidate = order?.maxDriversToOffer;
  if (typeof candidate !== "number") return MAX_OFFERS_PER_ATTEMPT;
  return Math.max(1, Math.min(candidate, 25));
};

/**
 * Starts the matching loop for an ASAP ride.
 *
 * Dispatch behavior (product requirement):
 * - "Ring" drivers by creating `assignments` with `status: "offered"`.
 * - Each offer window lasts ~offerTtlMs (default 15s).
 * - If nobody accepts within the window, immediately offer the next driver (or re-offer the same driver
 *   if they're the only eligible driver).
 * - Only go into `queued` when there are no online drivers.
 */
export const startRideMatching = mutation({
  args: {
    orderId: v.id("orders"),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    // Only ASAP rides should call this.
    if (order.scheduledAt) {
      return null;
    }

    if (order.status === "cancelled" || order.status === "matched") {
      return null;
    }

    const now = Date.now();

    await ctx.db.patch(order._id, {
      status: "searching",
      matchingAttemptCount: order.matchingAttemptCount ?? 0,
      lastMatchAttemptAt: order.lastMatchAttemptAt,
      // NOTE: this is informational; the authoritative retry scheduling happens inside the matching loop.
      nextMatchAttemptAt: now + getOfferDurationMsForOrder(order),
      updatedAt: now,
    });

    await ctx.scheduler.runAfter(0, internal.matching.attemptMatchInternal, {
      orderId: order._id,
    });

    return null;
  },
});

export const attemptMatchInternal = internalMutation({
  args: {
    orderId: v.id("orders"),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    if (order.status === "cancelled" || order.status === "matched") {
      return null;
    }

    const now = Date.now();

    const offerDurationMs = getOfferDurationMsForOrder(order);
    const maxOffersThisAttempt = getMaxDriversToOfferForOrder(order);

    // If someone accepted already, close the loop.
    const existingAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_order_id", (q: any) => q.eq("orderId", args.orderId))
      .collect();

    const accepted = existingAssignments.find((a: any) => a.status === "accepted");
    if (accepted) {
      await ctx.db.patch(order._id, {
        status: "matched",
        driverId: accepted.driverId,
        assignedAt: accepted.acceptedAt ?? now,
        updatedAt: now,
      });
      return null;
    }

    // Defensive cleanup: any "offered" assignment past its expiresAt should not block new offers.
    for (const assignment of existingAssignments) {
      if (assignment.status !== "offered") continue;
      if (assignment.expiresAt > now) continue;
      await ctx.db.patch(assignment._id, { status: "expired" });
    }

    const attemptCount = (order.matchingAttemptCount ?? 0) + 1;

    // Prefer drivers who haven't been offered recently for this order.
    const lastOfferByDriverId = new Map<string, number>();
    for (const a of existingAssignments) {
      const driverKey = String(a.driverId);
      const offeredAt = typeof a.offeredAt === "number" ? a.offeredAt : 0;
      const prev = lastOfferByDriverId.get(driverKey) ?? 0;
      if (offeredAt > prev) lastOfferByDriverId.set(driverKey, offeredAt);
    }

    const lastRejectionByDriverId = new Map<string, number>();
    for (const a of existingAssignments) {
      if (a.status !== "rejected") continue;
      const driverKey = String(a.driverId);
      const rejectedAt = typeof a.rejectedAt === "number" ? a.rejectedAt : a.offeredAt;
      const prev = lastRejectionByDriverId.get(driverKey) ?? 0;
      if (rejectedAt > prev) lastRejectionByDriverId.set(driverKey, rejectedAt);
    }

    // Fetch online, active drivers.
    // NOTE: Later we'll filter by approved services.
    const candidateFetchLimit = Math.max(25, Math.min(100, maxOffersThisAttempt * 10));
    const candidates = await ctx.db
      .query("drivers")
      .withIndex("by_status_and_online_status", (q: any) =>
        q.eq("status", "active").eq("onlineStatus", "online"),
      )
      .take(candidateFetchLimit);

    // If we have pickup coordinates, try to prioritize closest drivers based on `driverLocations`.
    // If no location data exists yet, fall back to "least recently offered".
    const candidateMetaByDriverId = new Map<string, { distanceMeters: number; hasFreshLocation: boolean }>();

    const hasPickupCoords =
      typeof order.pickupLat === "number" &&
      typeof order.pickupLng === "number" &&
      !Number.isNaN(order.pickupLat) &&
      !Number.isNaN(order.pickupLng);

    if (hasPickupCoords) {
      for (const driver of candidates) {
        const latestLocation = await ctx.db
          .query("driverLocations")
          .withIndex("by_driver_id_and_created_at", (q: any) => q.eq("driverId", driver._id))
          .order("desc")
          .first();

        if (!latestLocation) {
          candidateMetaByDriverId.set(String(driver._id), {
            distanceMeters: Number.POSITIVE_INFINITY,
            hasFreshLocation: false,
          });
          continue;
        }

        const isFresh = now - latestLocation.createdAt <= DRIVER_LOCATION_FRESH_MS;
        if (!isFresh) {
          candidateMetaByDriverId.set(String(driver._id), {
            distanceMeters: Number.POSITIVE_INFINITY,
            hasFreshLocation: false,
          });
          continue;
        }

        candidateMetaByDriverId.set(String(driver._id), {
          distanceMeters: haversineDistanceMeters(
            order.pickupLat,
            order.pickupLng,
            latestLocation.latitude,
            latestLocation.longitude,
          ),
          hasFreshLocation: true,
        });
      }
    }

    const sortedCandidates = [...candidates].sort((a: any, b: any) => {
      const aMeta = candidateMetaByDriverId.get(String(a._id));
      const bMeta = candidateMetaByDriverId.get(String(b._id));

      // Closest-first when we have fresh locations.
      if (aMeta?.hasFreshLocation || bMeta?.hasFreshLocation) {
        const aDist = aMeta?.distanceMeters ?? Number.POSITIVE_INFINITY;
        const bDist = bMeta?.distanceMeters ?? Number.POSITIVE_INFINITY;
        if (aDist !== bDist) return aDist - bDist;
      }

      // Tie-breaker: prefer drivers not offered recently for this order.
      const aLast = lastOfferByDriverId.get(String(a._id));
      const bLast = lastOfferByDriverId.get(String(b._id));
      const aScore = typeof aLast === "number" ? aLast : -1;
      const bScore = typeof bLast === "number" ? bLast : -1;
      return aScore - bScore;
    });

    let offersCreated = 0;

    for (const driver of sortedCandidates) {
      if (offersCreated >= maxOffersThisAttempt) break;

      const alreadyBlockedForThisOrder = existingAssignments.some((a: any) => {
        if (a.driverId !== driver._id) return false;
        if (a.status === "accepted") return true;

        // A rejected driver is only blocked temporarily.
        // After the cooldown, they become eligible again and (if closest) will be prioritized.
        if (a.status === "rejected") {
          const rejectedAt = typeof a.rejectedAt === "number" ? a.rejectedAt : a.offeredAt;
          return now - rejectedAt < REOFFER_AFTER_REJECTION_COOLDOWN_MS;
        }

        // Active offer still valid.
        if (a.status === "offered" && a.expiresAt > now) return true;

        return false;
      });

      if (alreadyBlockedForThisOrder) continue;

      await ctx.db.insert("assignments", {
        orderId: order._id,
        driverId: driver._id,
        status: "offered",
        offeredAt: now,
        expiresAt: now + offerDurationMs,
      });

      offersCreated += 1;
    }

    console.log("[matching.attemptMatchInternal]", {
      orderId: String(order._id),
      attemptCount,
      offerDurationMs,
      maxOffersThisAttempt,
      candidatesFound: candidates.length,
      offersCreated,
      hasPickupCoords,
    });

    if (offersCreated === 0) {
      // No online drivers right now.
      await ctx.db.patch(order._id, {
        status: "queued",
        matchingAttemptCount: attemptCount,
        lastMatchAttemptAt: now,
        nextMatchAttemptAt: now + NO_DRIVER_RETRY_INTERVAL_MS,
        updatedAt: now,
      });

      await ctx.scheduler.runAfter(NO_DRIVER_RETRY_INTERVAL_MS, internal.matching.attemptMatchInternal, {
        orderId: order._id,
      });

      return null;
    }

    // We are actively ringing drivers.
    await ctx.db.patch(order._id, {
      status: "searching",
      matchingAttemptCount: attemptCount,
      lastMatchAttemptAt: now,
      nextMatchAttemptAt: now + offerDurationMs,
      updatedAt: now,
    });

    // Wait for drivers to accept, then expire offers and immediately re-attempt.
    await ctx.scheduler.runAfter(
      offerDurationMs + EXPIRE_JOB_GRACE_MS,
      internal.matching.expireOffersInternal,
      {
        orderId: order._id,
      },
    );

    return null;
  },
});

export const expireOffersInternal = internalMutation({
  args: {
    orderId: v.id("orders"),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) return null;

    if (order.status === "cancelled" || order.status === "matched") {
      return null;
    }

    const now = Date.now();

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_order_id", (q: any) => q.eq("orderId", args.orderId))
      .collect();

    // If accepted, match immediately.
    const accepted = assignments.find((a: any) => a.status === "accepted");
    if (accepted) {
      await ctx.db.patch(order._id, {
        status: "matched",
        driverId: accepted.driverId,
        assignedAt: accepted.acceptedAt ?? now,
        updatedAt: now,
      });
      return null;
    }

    let expiredCount = 0;

    // Expire any offered assignments that have passed the window.
    for (const assignment of assignments) {
      if (assignment.status !== "offered") continue;
      if (assignment.expiresAt > now) continue;

      await ctx.db.patch(assignment._id, {
        status: "expired",
      });
      expiredCount += 1;
    }

    // If there are online drivers, re-initiate immediately (no extra pause).
    const anyOnlineDriver = await ctx.db
      .query("drivers")
      .withIndex("by_status_and_online_status", (q: any) =>
        q.eq("status", "active").eq("onlineStatus", "online"),
      )
      .first();

    if (anyOnlineDriver) {
      console.log("[matching.expireOffersInternal]", {
        orderId: String(order._id),
        expiredCount,
        action: "retry_immediately",
      });

      await ctx.scheduler.runAfter(0, internal.matching.attemptMatchInternal, {
        orderId: order._id,
      });

      return null;
    }

    // Otherwise, queue it and retry later.
    await ctx.db.patch(order._id, {
      status: "queued",
      nextMatchAttemptAt: now + NO_DRIVER_RETRY_INTERVAL_MS,
      updatedAt: now,
    });

    console.log("[matching.expireOffersInternal]", {
      orderId: String(order._id),
      expiredCount,
      action: "no_drivers_backoff",
      nextMatchAttemptAt: now + NO_DRIVER_RETRY_INTERVAL_MS,
    });

    await ctx.scheduler.runAfter(NO_DRIVER_RETRY_INTERVAL_MS, internal.matching.attemptMatchInternal, {
      orderId: order._id,
    });

    return null;
  },
});

/**
* Driver-side: accept the offered assignment.
*
* We're adding this now so the backend flow is complete; the Driver app/UI will call it.
*/
export const acceptAssignment = mutation({
  args: {
    assignmentId: v.id("assignments"),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    if (assignment.status !== "offered") {
      throw new Error("Assignment is no longer available");
    }

    const now = Date.now();

    await ctx.db.patch(assignment._id, {
      status: "accepted",
      acceptedAt: now,
    });

    const order = await ctx.db.get(assignment.orderId);
    if (!order) throw new Error("Order not found");

    if (order.status === "cancelled") {
      // Order cancelled while driver accepted. Mark assignment expired.
      await ctx.db.patch(assignment._id, {
        status: "expired",
      });
      return null;
    }

    await ctx.db.patch(order._id, {
      status: "matched",
      driverId: assignment.driverId,
      assignedAt: now,
      updatedAt: now,
    });

    // Put driver into on_trip so they don't keep receiving offers.
    await ctx.db.patch(assignment.driverId, {
      onlineStatus: "on_trip",
      updatedAt: now,
    });

    return null;
  },
});

// Dev/testing helper: instantly match an order to a test driver so QA can bypass
// the Finding Driver flow and jump straight to RideTracking.
export const simulateDriverAcceptForTesting = mutation({
  args: {
    orderId: v.id("orders"),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    if (order.status === "cancelled") {
      throw new Error("Order is cancelled");
    }

    const now = Date.now();

    // Prefer an existing active driver. If none exist, create a deterministic test driver.
    let driver = await ctx.db
      .query("drivers")
      .withIndex("by_status", (q: any) => q.eq("status", "active"))
      .first();

    if (!driver) {
      const testEmail = "test-driver@transpo.local";
      const existingByEmail = await ctx.db
        .query("drivers")
        .withIndex("by_email", (q: any) => q.eq("email", testEmail))
        .first();

      if (existingByEmail) {
        driver = existingByEmail;
        // Ensure it's usable.
        await ctx.db.patch(driver._id, {
          status: "active",
          onlineStatus: "online",
          updatedAt: now,
        });
      } else {
        const driverId = await ctx.db.insert("drivers", {
          clerkId: "test-driver",
          email: testEmail,
          firstName: "Test",
          lastName: "Driver",
          phone: "+1 (555) 010-2000",
          status: "active",
          onlineStatus: "online",
          licenseNumber: "MTQ-TEST-0000",
          licenseExpiry: now + 1000 * 60 * 60 * 24 * 365,
          vehicleType: "sedan",
          vehicleMake: "Toyota",
          vehicleModel: "Camry",
          vehicleYear: 2020,
          vehicleColor: "Grey",
          licensePlate: "QC 456 ABC",
          approvedServices: ["taxi"],
          rating: 4.95,
          totalTrips: 2847,
          createdAt: now,
          updatedAt: now,
        });
        driver = await ctx.db.get(driverId);
      }
    }

    if (!driver) throw new Error("Failed to prepare test driver");

    // Mark any existing offers as expired so we have a clean accepted assignment.
    const existingAssignments = await ctx.db
      .query("assignments")
      .withIndex("by_order_id", (q: any) => q.eq("orderId", order._id))
      .collect();

    for (const a of existingAssignments) {
      if (a.status === "accepted") {
        // Already accepted by someone; just ensure order is matched.
        await ctx.db.patch(order._id, {
          status: "matched",
          driverId: a.driverId,
          assignedAt: a.acceptedAt ?? now,
          updatedAt: now,
        });
        return null;
      }

      if (a.status === "offered") {
        await ctx.db.patch(a._id, { status: "expired" });
      }
    }

    // Create an accepted assignment for this driver.
    await ctx.db.insert("assignments", {
      orderId: order._id,
      driverId: driver._id,
      status: "accepted",
      offeredAt: now,
      acceptedAt: now,
      expiresAt: now,
    });

    await ctx.db.patch(order._id, {
      status: "matched",
      driverId: driver._id,
      assignedAt: now,
      updatedAt: now,
    });

    // Put driver into on_trip so they don't keep receiving offers.
    await ctx.db.patch(driver._id, {
      onlineStatus: "on_trip",
      updatedAt: now,
    });

    return null;
  },
});