import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertDriverAccess(user: any) {
if (!user) throw new Error("User not found");
if (user.role !== "driver" && user.role !== "admin") {
throw new Error("Not authorized");
}
}

// NOTE:
// We intentionally link Users <-> Drivers by email for now.
// Later we can add a `userId` field on the drivers table for a stronger relationship.
async function getDriverByUser(ctx: any, userId: any) {
const user = await ctx.db.get(userId);
if (!user) throw new Error("User not found");

const driver = await ctx.db
.query("drivers")
.withIndex("by_email", (q: any) => q.eq("email", user.email))
.first();

// Backwards-compatible access:
// - In production we want `user.role` to be "driver".
// - In dev/testing, older driver accounts may have `role: "user"`.
//   If they *own* the driver profile (clerkId match), allow access so offers still work.
if (driver) {
  const expectedClerkId = user.clerkId || user._id;
  const ownsDriverProfile = driver.clerkId === expectedClerkId;

  if (!ownsDriverProfile && user.role !== "driver" && user.role !== "admin") {
    throw new Error("Not authorized");
  }
} else {
  // If no driver profile exists, keep strict role enforcement.
  assertDriverAccess(user);
}

return { user, driver };
}

export const getMyDriverProfile = query({
  args: { userId: v.id("users") },
  returns: v.object({
    exists: v.boolean(),
    driverId: v.optional(v.id("drivers")),
    status: v.optional(v.string()),
    onlineStatus: v.optional(v.string()),
    fullName: v.optional(v.string()),
    licensePlate: v.optional(v.string()),
    vehicleSummary: v.optional(v.string()),
    approvedServices: v.optional(v.array(v.string())),
  }),
  handler: async (ctx: any, args: any) => {
    const { user, driver } = await getDriverByUser(ctx, args.userId);

    if (!driver) {
      return { exists: false };
    }

    const fullName = `${driver.firstName} ${driver.lastName}`.trim();
    const vehicleSummary = [driver.vehicleYear, driver.vehicleMake, driver.vehicleModel]
      .filter(Boolean)
      .join(" ");

    return {
      exists: true,
      driverId: driver._id,
      status: driver.status,
      onlineStatus: driver.onlineStatus,
      fullName: fullName || `${user.firstName} ${user.lastName}`.trim(),
      licensePlate: driver.licensePlate,
      vehicleSummary: vehicleSummary || driver.vehicleType,
      approvedServices: driver.approvedServices as any,
    };
  },
});

export const createOrUpdateMyDriverProfile = mutation({
  args: {
    userId: v.id("users"),
    licenseNumber: v.string(),
    licenseExpiry: v.number(),
    licensePlate: v.string(),
    vehicleType: v.union(
      v.literal("sedan"),
      v.literal("suv"),
      v.literal("van"),
      v.literal("truck"),
      v.literal("motorcycle")
    ),
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    vehicleYear: v.optional(v.number()),
    vehicleColor: v.optional(v.string()),
  },
  returns: v.object({ driverId: v.id("drivers") }),
  handler: async (ctx: any, args: any) => {
    const { user, driver } = await getDriverByUser(ctx, args.userId);

    const now = Date.now();

    // IMPORTANT:
    // To make the driver app testable end-to-end, we default `status` to "active".
    // In production you will likely set this to "pending" and require admin verification.
    const baseDoc = {
      clerkId: user.clerkId || user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage: user.profileImage,
      status: "active" as const,
      onlineStatus: "offline" as const,

      licenseNumber: args.licenseNumber.trim(),
      licenseExpiry: args.licenseExpiry,
      licensePlate: args.licensePlate.trim(),

      vehicleType: args.vehicleType,
      vehicleMake: args.vehicleMake,
      vehicleModel: args.vehicleModel,
      vehicleYear: args.vehicleYear,
      vehicleColor: args.vehicleColor,

      approvedServices: ["taxi"],

      updatedAt: now,
    };

    if (driver) {
      await ctx.db.patch(driver._id, baseDoc);
      return { driverId: driver._id };
    }

    const driverId = await ctx.db.insert("drivers", {
      ...baseDoc,
      createdAt: now,
    });

    return { driverId };
  },
});

export const setMyOnlineStatus = mutation({
  args: {
    userId: v.id("users"),
    onlineStatus: v.union(v.literal("offline"), v.literal("online")),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const { driver } = await getDriverByUser(ctx, args.userId);
    if (!driver) throw new Error("Driver profile not found");

    if (driver.status !== "active") {
      throw new Error("Driver is not active");
    }

    await ctx.db.patch(driver._id, {
      onlineStatus: args.onlineStatus,
      updatedAt: Date.now(),
    });

    return null;
  },
});

export const upsertMyLocation = mutation({
  args: {
    userId: v.id("users"),
    latitude: v.number(),
    longitude: v.number(),
    heading: v.optional(v.number()),
    speed: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const { driver } = await getDriverByUser(ctx, args.userId);
    if (!driver) throw new Error("Driver profile not found");

    const now = Date.now();

    // We append locations (instead of patching a single row) so we can replay/debug
    // and build more advanced features later (ETAs, heatmaps, fraud review).
    await ctx.db.insert("driverLocations", {
      driverId: driver._id,
      latitude: args.latitude,
      longitude: args.longitude,
      heading: args.heading,
      speed: args.speed,
      createdAt: now,
    });

    return null;
  },
});

export const getMyOfferedAssignments = query({
  args: { userId: v.id("users") },
  returns: v.array(
    v.object({
      assignmentId: v.id("assignments"),
      expiresAt: v.number(),
      orderId: v.id("orders"),
      pickupAddress: v.string(),
      dropoffAddress: v.string(),
      estimatedFare: v.number(),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx: any, args: any) => {
    const { driver } = await getDriverByUser(ctx, args.userId);
    if (!driver) return [];

    const now = Date.now();

    const assignments = await ctx.db
      .query("assignments")
      .withIndex("by_driver_id", (q: any) => q.eq("driverId", driver._id))
      .order("desc")
      .take(30);

    const offered = assignments.filter((a: any) => a.status === "offered" && a.expiresAt > now);

    const results: Array<any> = [];

    for (const a of offered) {
      const order = await ctx.db.get(a.orderId);
      if (!order) continue;
      // Only surface jobs that still need a driver.
      if (order.status !== "searching" && order.status !== "queued") continue;

      results.push({
        assignmentId: a._id,
        expiresAt: a.expiresAt,
        orderId: order._id,
        pickupAddress: order.pickupAddress,
        dropoffAddress: order.dropoffAddress,
        estimatedFare: order.estimatedFare,
        createdAt: order.createdAt,
      });
    }

    // Dev-only visibility: helps us confirm the driver app is polling successfully.
    console.log("[drivers.getMyOfferedAssignments]", {
      userId: args.userId,
      driverId: driver._id,
      resultsCount: results.length,
    });

    return results;
  },
});

export const rejectAssignment = mutation({
  args: {
    userId: v.id("users"),
    assignmentId: v.id("assignments"),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const { driver } = await getDriverByUser(ctx, args.userId);
    if (!driver) throw new Error("Driver profile not found");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");
    if (assignment.driverId !== driver._id) throw new Error("Not authorized");

    if (assignment.status !== "offered") {
      return null;
    }

    await ctx.db.patch(assignment._id, {
      status: "rejected",
      rejectedAt: Date.now(),
    });

    return null;
  },
});

export const acceptAssignmentAsDriver = mutation({
  args: {
    userId: v.id("users"),
    assignmentId: v.id("assignments"),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const { driver } = await getDriverByUser(ctx, args.userId);
    if (!driver) throw new Error("Driver profile not found");

    const assignment = await ctx.db.get(args.assignmentId);
    if (!assignment) throw new Error("Assignment not found");

    if (assignment.driverId !== driver._id) {
      throw new Error("Not authorized");
    }

    const now = Date.now();

    if (assignment.status !== "offered") {
      throw new Error("Assignment is no longer available");
    }

    if (assignment.expiresAt <= now) {
      await ctx.db.patch(assignment._id, { status: "expired" });
      throw new Error("Assignment expired");
    }

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
      throw new Error("Order was cancelled");
    }

    await ctx.db.patch(order._id, {
      status: "matched",
      driverId: assignment.driverId,
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

export const getMyActiveOrder = query({
  args: { userId: v.id("users") },
  returns: v.union(
    v.null(),
    v.object({
      orderId: v.id("orders"),
      status: v.string(),
      pickupAddress: v.string(),
      dropoffAddress: v.string(),
      estimatedFare: v.number(),
      customerId: v.id("users"),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx: any, args: any) => {
    const { driver } = await getDriverByUser(ctx, args.userId);
    if (!driver) return null;

    const orders = await ctx.db
      .query("orders")
      .withIndex("by_driver_id", (q: any) => q.eq("driverId", driver._id))
      .order("desc")
      .take(20);

    const active = orders.find((o: any) =>
      ["matched", "driver_arrived", "picked_up", "in_transit"].includes(o.status)
    );

    if (!active) return null;

    return {
      orderId: active._id,
      status: active.status,
      pickupAddress: active.pickupAddress,
      dropoffAddress: active.dropoffAddress,
      estimatedFare: active.estimatedFare,
      customerId: active.userId,
      createdAt: active.createdAt,
    };
  },
});

export const updateOrderStatusAsDriver = mutation({
  args: {
    userId: v.id("users"),
    orderId: v.id("orders"),
    status: v.union(
      v.literal("driver_arrived"),
      v.literal("picked_up"),
      v.literal("in_transit"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const { driver } = await getDriverByUser(ctx, args.userId);
    if (!driver) throw new Error("Driver profile not found");

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.driverId !== driver._id) throw new Error("Not authorized");

    const now = Date.now();
    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "picked_up") {
      patch.startedAt = order.startedAt ?? now;
    }

    if (args.status === "completed") {
      patch.completedAt = now;
      // NOTE: `completeOrderPayment` should be preferred when payment is confirmed.
      // But keeping this resilient for testing.
      patch.paidAt = order.paidAt ?? now;

      // Driver goes back online/offline based on last state; simplest is offline.
      await ctx.db.patch(driver._id, {
        onlineStatus: "offline",
        updatedAt: now,
      });
    }

    await ctx.db.patch(order._id, patch);

    return null;
  },
});