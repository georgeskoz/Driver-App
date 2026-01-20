import { mutation, query } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";

// NOTE: This is a DEV-ONLY shared secret for dispatching from the client.
// In production, do NOT ship a secret in the mobile app. Instead:
// - authenticate users properly (ctx.auth), and/or
// - expose an HTTP endpoint protected by a server-side key.
const DEV_DISPATCH_SECRET = "dev-dispatch-secret";

const mapServiceToOrderMode = (service: "taxi" | "courier" | "food") => {
  switch (service) {
    case "courier":
      return "delivery" as const;
    case "food":
      return "food" as const;
    default:
      return "ride" as const;
  }
};

/**
* "Trips" is a clearer domain name for what this project stores in the `orders` table.
*
* We keep `orders` as the underlying table for backwards compatibility (food/delivery later),
* but expose trip-centric APIs for the rider + driver apps.
*/

const TRIP_ACTIVE_STATUSES = [
"pending",
"searching",
"queued",
"matched",
"driver_arrived",
"picked_up",
"in_transit",
] as const;

type TripActiveStatus = (typeof TRIP_ACTIVE_STATUSES)[number];

export const requestTrip = mutation({
args: {
userId: v.id("users"),
mode: v.union(v.literal("ride"), v.literal("delivery")),
pickupAddress: v.string(),
pickupLat: v.number(),
pickupLng: v.number(),
dropoffAddress: v.string(),
dropoffLat: v.number(),
dropoffLng: v.number(),
vehicleType: v.optional(
v.union(
v.literal("sedan"),
v.literal("van"),
v.literal("economy"),
v.literal("comfort"),
v.literal("premium"),
v.literal("xl"),
),
),
paymentMethod: v.union(
v.literal("card"),
v.literal("cash"),
v.literal("apple_pay"),
v.literal("google_pay"),
),
estimatedFare: v.number(),

// Optional: schedule for later. When present, no matching loop starts yet.
scheduledAt: v.optional(v.number()),
},
returns: v.object({ tripId: v.id("orders"), matchingStarted: v.boolean() }),
handler: async (ctx: any, args: any) => {
const now = Date.now();

const tripId = await ctx.db.insert("orders", {
userId: args.userId,
mode: args.mode,
status: "pending",

pickupAddress: args.pickupAddress,
pickupLat: args.pickupLat,
pickupLng: args.pickupLng,
dropoffAddress: args.dropoffAddress,
dropoffLat: args.dropoffLat,
dropoffLng: args.dropoffLng,

vehicleType: args.vehicleType,
paymentMethod: args.paymentMethod,
estimatedFare: args.estimatedFare,

scheduledAt: args.scheduledAt,
createdAt: now,
updatedAt: now,

matchingAttemptCount: 0,
lastMatchAttemptAt: undefined,
nextMatchAttemptAt: undefined,
});

const matchingStarted = !args.scheduledAt;

if (matchingStarted) {
  await ctx.scheduler.runAfter(0, internal.matching.attemptMatchInternal, {
    orderId: tripId,
  });

  // Ensure the rider app UI immediately reflects "searching".
  await ctx.db.patch(tripId, {
    status: "searching",
    nextMatchAttemptAt: now + 15_000,
    updatedAt: now,
  });
}

return { tripId, matchingStarted };
},
});

export const dispatchCreateTrip = mutation({
  args: {
    dispatchSecret: v.string(),
    userId: v.id("users"),

    // Labels (human-readable addresses)
    pickupLabel: v.string(),
    dropoffLabel: v.string(),

    // Service selection (used for driver filtering in later iterations)
    service: v.union(v.literal("taxi"), v.literal("courier"), v.literal("food")),

    // Dispatch config
    offerTtlMs: v.number(),
    maxDriversToOffer: v.number(),

    // Optional extra info (lets the rider app keep using its existing pricing/UI)
    pickupLat: v.optional(v.number()),
    pickupLng: v.optional(v.number()),
    dropoffLat: v.optional(v.number()),
    dropoffLng: v.optional(v.number()),
    estimatedFare: v.optional(v.number()),
    vehicleType: v.optional(
      v.union(
        v.literal("sedan"),
        v.literal("van"),
        v.literal("economy"),
        v.literal("comfort"),
        v.literal("premium"),
        v.literal("xl"),
      ),
    ),
    paymentMethod: v.optional(
      v.union(v.literal("card"), v.literal("cash"), v.literal("apple_pay"), v.literal("google_pay")),
    ),

    // Optional: schedule for later
    scheduledAt: v.optional(v.number()),
  },
  returns: v.object({ tripId: v.id("orders") }),
  handler: async (ctx: any, args: any) => {
    if (args.dispatchSecret !== DEV_DISPATCH_SECRET) {
      throw new Error("Invalid dispatch secret");
    }

    console.log('[trips.dispatchCreateTrip] called', {
      pickupLabel: args.pickupLabel,
      dropoffLabel: args.dropoffLabel,
      service: args.service,
      offerTtlMs: args.offerTtlMs,
      maxDriversToOffer: args.maxDriversToOffer,
    });

    const now = Date.now();
    const mode = mapServiceToOrderMode(args.service);

    const tripId = await ctx.db.insert("orders", {
      userId: args.userId,
      mode,
      status: "pending",

      pickupAddress: args.pickupLabel,
      pickupLat: args.pickupLat ?? 0,
      pickupLng: args.pickupLng ?? 0,
      dropoffAddress: args.dropoffLabel,
      dropoffLat: args.dropoffLat ?? 0,
      dropoffLng: args.dropoffLng ?? 0,

      vehicleType: args.vehicleType,
      paymentMethod: args.paymentMethod ?? "card",
      estimatedFare: args.estimatedFare ?? 0,

      scheduledAt: args.scheduledAt,
      createdAt: now,
      updatedAt: now,

      matchingAttemptCount: 0,
      lastMatchAttemptAt: undefined,
      nextMatchAttemptAt: undefined,

      // Per-trip matching config
      offerTtlMs: args.offerTtlMs,
      maxDriversToOffer: args.maxDriversToOffer,
    });

    // For later trips, we create the trip but do not start dispatch.
    if (args.scheduledAt) {
      console.log('[trips.dispatchCreateTrip] created order', { tripId });
      return { tripId };
    }

    // Start dispatch immediately.
    await ctx.scheduler.runAfter(0, internal.matching.attemptMatchInternal, {
      orderId: tripId,
    });

    await ctx.db.patch(tripId, {
      status: "searching",
      nextMatchAttemptAt: now + args.offerTtlMs,
      updatedAt: now,
    });

    return { tripId };
  },
});

export const getTrip = query({
args: { tripId: v.id("orders") },
returns: v.object({
_id: v.id("orders"),
status: v.string(),
mode: v.string(),
pickupAddress: v.string(),
dropoffAddress: v.string(),
pickupLat: v.number(),
pickupLng: v.number(),
dropoffLat: v.number(),
dropoffLng: v.number(),
estimatedFare: v.number(),
driverId: v.optional(v.id("drivers")),
createdAt: v.number(),
}),
handler: async (ctx: any, args: any) => {
const trip = await ctx.db.get(args.tripId);
if (!trip) throw new Error("Trip not found");

return {
_id: trip._id,
status: trip.status,
mode: trip.mode,
pickupAddress: trip.pickupAddress,
dropoffAddress: trip.dropoffAddress,
pickupLat: trip.pickupLat,
pickupLng: trip.pickupLng,
dropoffLat: trip.dropoffLat,
dropoffLng: trip.dropoffLng,
estimatedFare: trip.estimatedFare,
driverId: trip.driverId,
createdAt: trip.createdAt,
};
},
});

export const getMyActiveTripAsRider = query({
args: { userId: v.id("users") },
returns: v.union(
v.null(),
v.object({
tripId: v.id("orders"),
status: v.string(),
pickupAddress: v.string(),
dropoffAddress: v.string(),
createdAt: v.number(),
}),
),
handler: async (ctx: any, args: any) => {
const recent = await ctx.db
.query("orders")
.withIndex("by_user_id", (q: any) => q.eq("userId", args.userId))
.order("desc")
.take(25);

const active = recent.find((o: any) =>
(TRIP_ACTIVE_STATUSES as ReadonlyArray<TripActiveStatus>).includes(
o.status as TripActiveStatus,
),
);

if (!active) return null;

return {
tripId: active._id,
status: active.status,
pickupAddress: active.pickupAddress,
dropoffAddress: active.dropoffAddress,
createdAt: active.createdAt,
};
},
});

export const cancelTrip = mutation({
args: {
userId: v.id("users"),
tripId: v.id("orders"),
},
returns: v.null(),
handler: async (ctx: any, args: any) => {
const trip = await ctx.db.get(args.tripId);
if (!trip) throw new Error("Trip not found");
if (trip.userId !== args.userId) throw new Error("Not authorized");

if (trip.status === "completed" || trip.status === "cancelled") {
return null;
}

await ctx.db.patch(args.tripId, {
status: "cancelled",
updatedAt: Date.now(),
});

return null;
},
});