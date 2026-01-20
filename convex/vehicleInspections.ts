import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function assertDriverAccess(user: any) {
if (!user) throw new Error("User not found");
if (user.role !== "driver" && user.role !== "admin") {
throw new Error("Not authorized");
}
}

async function getDriverByUserId(ctx: any, userId: any) {
const user = await ctx.db.get(userId);
assertDriverAccess(user);

const driver = await ctx.db
.query("drivers")
.withIndex("by_email", (q: any) => q.eq("email", user.email))
.first();

if (!driver) {
throw new Error("Driver profile not found");
}

return { user, driver };
}

/**
* Drivers submit a vehicle inspection periodically.
* In early stage, this is mainly a compliance + safety checklist placeholder.
*/
export const submitMyVehicleInspection = mutation({
args: {
userId: v.id("users"),
odometerKm: v.optional(v.number()),
notes: v.optional(v.string()),
photoUrls: v.optional(v.array(v.string())),
},
returns: v.object({ inspectionId: v.id("vehicleInspections"), status: v.string() }),
handler: async (ctx: any, args: any) => {
const { driver } = await getDriverByUserId(ctx, args.userId);

const now = Date.now();

const inspectionId = await ctx.db.insert("vehicleInspections", {
driverId: driver._id,
submittedByUserId: args.userId,
status: "pending",
odometerKm: args.odometerKm,
notes: args.notes,
photoUrls: args.photoUrls ?? [],
createdAt: now,
updatedAt: now,
});

return { inspectionId, status: "pending" };
},
});

export const getMyLatestVehicleInspection = query({
args: { userId: v.id("users") },
returns: v.union(
v.null(),
v.object({
inspectionId: v.id("vehicleInspections"),
status: v.string(),
createdAt: v.number(),
updatedAt: v.number(),
odometerKm: v.optional(v.number()),
notes: v.optional(v.string()),
}),
),
handler: async (ctx: any, args: any) => {
const { driver } = await getDriverByUserId(ctx, args.userId);

const latest = await ctx.db
.query("vehicleInspections")
.withIndex("by_driver_id", (q: any) => q.eq("driverId", driver._id))
.order("desc")
.first();

if (!latest) return null;

return {
inspectionId: latest._id,
status: latest.status,
createdAt: latest.createdAt,
updatedAt: latest.updatedAt,
odometerKm: latest.odometerKm,
notes: latest.notes,
};
},
});

export const adminReviewVehicleInspection = mutation({
args: {
adminUserId: v.id("users"),
inspectionId: v.id("vehicleInspections"),
status: v.union(v.literal("approved"), v.literal("rejected")),
reviewNote: v.optional(v.string()),
},
returns: v.null(),
handler: async (ctx: any, args: any) => {
const admin = await ctx.db.get(args.adminUserId);
if (!admin) throw new Error("User not found");
if (admin.role !== "admin") throw new Error("Not authorized");

const inspection = await ctx.db.get(args.inspectionId);
if (!inspection) throw new Error("Inspection not found");

const now = Date.now();

await ctx.db.patch(args.inspectionId, {
status: args.status,
reviewNote: args.reviewNote,
reviewedAt: now,
updatedAt: now,
});

return null;
},
});
