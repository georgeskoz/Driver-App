import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

const DEFAULT_KEY = "default";

const DEFAULT_SETTINGS = {
  key: DEFAULT_KEY,
  currency: "CAD",
  // Rates stored as decimals (0.05 == 5%)
  gstRate: 0.05,
  qstRate: 0.09975,
  // Quebec "Redevance" (non-taxable)
  regulatoryFeeAmount: 0.9,
  applyRegulatoryFeeToRides: true,
  updatedAt: 0,
};

export const getBillingSettings = query({
  args: {
    key: v.optional(v.string()),
  },
  returns: v.object({
    key: v.string(),
    currency: v.string(),
    gstRate: v.number(),
    qstRate: v.number(),
    regulatoryFeeAmount: v.number(),
    applyRegulatoryFeeToRides: v.boolean(),
    updatedAt: v.number(),
  }),
  handler: async (ctx: any, args: any) => {
    const key = (args.key ?? DEFAULT_KEY).trim() || DEFAULT_KEY;

    const doc = await ctx.db
      .query("billingSettings")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .first();

    if (!doc) {
      return { ...DEFAULT_SETTINGS, key };
    }

    return {
      key: doc.key,
      currency: doc.currency,
      gstRate: doc.gstRate,
      qstRate: doc.qstRate,
      regulatoryFeeAmount: doc.regulatoryFeeAmount,
      applyRegulatoryFeeToRides: doc.applyRegulatoryFeeToRides,
      updatedAt: doc.updatedAt,
    };
  },
});

// Admin-facing. The in-app admin screen + admin panel will call this to control taxes/fees.
export const upsertBillingSettings = mutation({
  args: {
    adminUserId: v.id("users"),
    key: v.optional(v.string()),
    currency: v.optional(v.string()),
    gstRate: v.optional(v.number()),
    qstRate: v.optional(v.number()),
    regulatoryFeeAmount: v.optional(v.number()),
    applyRegulatoryFeeToRides: v.optional(v.boolean()),
  },
  returns: v.null(),
  handler: async (ctx: any, args: any) => {
    const admin = await ctx.db.get(args.adminUserId);
    if (!admin) throw new Error("User not found");
    if (admin.role !== "admin") throw new Error("Not authorized");

    const now = Date.now();
    const key = (args.key ?? DEFAULT_KEY).trim() || DEFAULT_KEY;

    const existing = await ctx.db
      .query("billingSettings")
      .withIndex("by_key", (q: any) => q.eq("key", key))
      .first();

    const next = {
      key,
      currency: (args.currency ?? existing?.currency ?? DEFAULT_SETTINGS.currency).trim() ||
        DEFAULT_SETTINGS.currency,
      gstRate: args.gstRate ?? existing?.gstRate ?? DEFAULT_SETTINGS.gstRate,
      qstRate: args.qstRate ?? existing?.qstRate ?? DEFAULT_SETTINGS.qstRate,
      regulatoryFeeAmount:
        args.regulatoryFeeAmount ??
        existing?.regulatoryFeeAmount ??
        DEFAULT_SETTINGS.regulatoryFeeAmount,
      applyRegulatoryFeeToRides:
        args.applyRegulatoryFeeToRides ??
        existing?.applyRegulatoryFeeToRides ??
        DEFAULT_SETTINGS.applyRegulatoryFeeToRides,
      updatedAt: now,
    };

    if (!existing) {
      await ctx.db.insert("billingSettings", next);
      return null;
    }

    await ctx.db.patch(existing._id, next);
    return null;
  },
});