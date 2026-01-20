import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// IMPORTANT (PCI / security):
// We never store full PAN (card number) or CVV in Convex.
// This table stores only non-sensitive metadata (brand/last4/expiry) so the UI can list cards.
// When you integrate Stripe, replace `provider` + `providerPaymentMethodId` and tokenize cards client-side.

export const getUserPaymentMethods = query({
  args: {
    userId: v.id("users"),
  },
  handler: async (ctx, args) => {
    const methods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    // Default first, then most recent.
    return methods.sort((a, b) => {
      if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
      return (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt);
    });
  },
});

export const addCardPaymentMethod = mutation({
  args: {
    userId: v.id("users"),
    cardSubtype: v.union(v.literal("credit"), v.literal("debit")),
    brand: v.string(),
    last4: v.string(),
    expMonth: v.number(),
    expYear: v.number(),
    nickname: v.optional(v.string()),
    billingPostalCode: v.optional(v.string()),
    setAsDefault: v.optional(v.boolean()),

    // For future Stripe integration
    provider: v.optional(v.union(v.literal("manual_test"), v.literal("stripe"))),
    providerPaymentMethodId: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const existing = await ctx.db
      .query("paymentMethods")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    const shouldBeDefault = args.setAsDefault ?? existing.length === 0;

    if (shouldBeDefault) {
      for (const method of existing) {
        if (method.isDefault) {
          await ctx.db.patch(method._id, { isDefault: false, updatedAt: now });
        }
      }
    }

    const paymentMethodId = await ctx.db.insert("paymentMethods", {
      userId: args.userId,
      type: "card",
      cardSubtype: args.cardSubtype,
      brand: args.brand,
      last4: args.last4,
      expMonth: args.expMonth,
      expYear: args.expYear,
      nickname: args.nickname,
      billingPostalCode: args.billingPostalCode,
      isDefault: shouldBeDefault,
      provider: args.provider ?? "manual_test",
      providerPaymentMethodId: args.providerPaymentMethodId,
      createdAt: now,
      updatedAt: now,
    });

    return { paymentMethodId };
  },
});

export const setDefaultPaymentMethod = mutation({
  args: {
    userId: v.id("users"),
    paymentMethodId: v.id("paymentMethods"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const target = await ctx.db.get(args.paymentMethodId);
    if (!target) throw new Error("Payment method not found");
    if (target.userId !== args.userId) throw new Error("Forbidden");

    const methods = await ctx.db
      .query("paymentMethods")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    for (const method of methods) {
      const nextDefault = method._id === args.paymentMethodId;
      if (method.isDefault !== nextDefault) {
        await ctx.db.patch(method._id, { isDefault: nextDefault, updatedAt: now });
      }
    }

    return true;
  },
});

export const deletePaymentMethod = mutation({
  args: {
    userId: v.id("users"),
    paymentMethodId: v.id("paymentMethods"),
  },
  handler: async (ctx, args) => {
    const now = Date.now();

    const target = await ctx.db.get(args.paymentMethodId);
    if (!target) return true;
    if (target.userId !== args.userId) throw new Error("Forbidden");

    const wasDefault = target.isDefault;
    await ctx.db.delete(args.paymentMethodId);

    if (!wasDefault) return true;

    // If the default method was deleted, promote the most recently updated remaining method.
    const remaining = await ctx.db
      .query("paymentMethods")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    if (remaining.length === 0) return true;

    remaining.sort((a, b) => (b.updatedAt ?? b.createdAt) - (a.updatedAt ?? a.createdAt));
    await ctx.db.patch(remaining[0]._id, { isDefault: true, updatedAt: now });

    return true;
  },
});