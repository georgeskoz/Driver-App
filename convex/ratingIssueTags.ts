import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// NOTE:
// This table is meant to be managed by your future Admin Panel.
// For now we expose a simple upsert mutation so an admin UI can update the list.

const defaultIssueTags = [
{ code: "unsafe_driving", labelEn: "Unsafe driving", labelFr: "Conduite dangereuse" },
{ code: "late_pickup", labelEn: "Late pickup", labelFr: "Ramassage en retard" },
{ code: "rude_driver", labelEn: "Rude / unprofessional", labelFr: "Impolitesse / non professionnel" },
{ code: "dirty_vehicle", labelEn: "Vehicle not clean", labelFr: "Véhicule pas propre" },
{ code: "wrong_route", labelEn: "Took a wrong route", labelFr: "A pris un mauvais trajet" },
{ code: "overcharged", labelEn: "Charged incorrectly", labelFr: "Facturation incorrecte" },
{ code: "music_too_loud", labelEn: "Music too loud", labelFr: "Musique trop forte" },
{ code: "other", labelEn: "Other", labelFr: "Autre" },
];

export const getActiveRatingIssueTags = query({
args: {},
returns: v.array(
v.object({
code: v.string(),
labelEn: v.string(),
labelFr: v.string(),
})
),
handler: async (ctx) => {
const tags = await ctx.db
.query("ratingIssueTags")
.withIndex("by_active_and_sort", (q) => q.eq("active", true))
.order("asc")
.collect();

if (tags.length === 0) {
// No admin-configured tags yet — return sensible defaults for the app to use.
return defaultIssueTags;
}

return tags.map((tag) => ({
code: tag.code,
labelEn: tag.labelEn,
labelFr: tag.labelFr,
}));
},
});

export const upsertRatingIssueTag = mutation({
args: {
code: v.string(),
labelEn: v.string(),
labelFr: v.string(),
active: v.optional(v.boolean()),
sortOrder: v.optional(v.number()),
},
returns: v.null(),
handler: async (ctx, args) => {
const now = Date.now();

const existing = await ctx.db
.query("ratingIssueTags")
.withIndex("by_code", (q) => q.eq("code", args.code))
.first();

if (!existing) {
await ctx.db.insert("ratingIssueTags", {
code: args.code,
labelEn: args.labelEn,
labelFr: args.labelFr,
active: args.active ?? true,
sortOrder: args.sortOrder ?? 0,
createdAt: now,
updatedAt: now,
});
return;
}

await ctx.db.patch(existing._id, {
labelEn: args.labelEn,
labelFr: args.labelFr,
active: args.active ?? existing.active,
sortOrder: args.sortOrder ?? existing.sortOrder,
updatedAt: now,
});
},
});
