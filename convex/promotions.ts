import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

function normalizeCode(raw: string) {
return raw.trim().toUpperCase();
}

function clampCurrency(amount: number) {
// Keep values stable for UI and storage.
return Math.round(amount * 100) / 100;
}

function computeDiscountedFare(params: {
baseFare: number;
discountType: "percent" | "amount";
discountValue: number;
}) {
const { baseFare, discountType, discountValue } = params;

if (baseFare <= 0) {
return { discountAmount: 0, discountedFare: 0 };
}

let discountAmount = 0;
if (discountType === "percent") {
discountAmount = (baseFare * discountValue) / 100;
} else {
discountAmount = discountValue;
}

discountAmount = clampCurrency(Math.max(0, Math.min(baseFare, discountAmount)));
const discountedFare = clampCurrency(Math.max(0, baseFare - discountAmount));

return { discountAmount, discountedFare };
}

export const upsertPromotion = mutation({
args: {
// If provided, update existing promotion.
promotionId: v.optional(v.id("promotions")),

code: v.string(),
titleEn: v.string(),
titleFr: v.string(),
descriptionEn: v.optional(v.string()),
descriptionFr: v.optional(v.string()),

discountType: v.union(v.literal("percent"), v.literal("amount")),
discountValue: v.number(),

isActive: v.boolean(),
startsAt: v.optional(v.number()),
endsAt: v.optional(v.number()),
maxUsesTotal: v.optional(v.number()),
maxUsesPerUser: v.optional(v.number()),
},
returns: v.id("promotions"),
handler: async (ctx, args) => {
// NOTE: Admin auth will be added later. For now, this is used by the admin panel.

const now = Date.now();
const normalized = normalizeCode(args.code);

const patch = {
code: normalized,
titleEn: args.titleEn,
titleFr: args.titleFr,
descriptionEn: args.descriptionEn,
descriptionFr: args.descriptionFr,
discountType: args.discountType,
discountValue: args.discountValue,
isActive: args.isActive,
startsAt: args.startsAt,
endsAt: args.endsAt,
maxUsesTotal: args.maxUsesTotal,
maxUsesPerUser: args.maxUsesPerUser,
updatedAt: now,
};

if (args.promotionId) {
await ctx.db.patch(args.promotionId, patch);
return args.promotionId;
}

const existing = await ctx.db
.query("promotions")
.withIndex("by_code", (q) => q.eq("code", normalized))
.first();

if (existing) {
await ctx.db.patch(existing._id, patch);
return existing._id;
}

const id = await ctx.db.insert("promotions", {
...patch,
createdAt: now,
});

return id;
},
});

export const listActivePromotions = query({
args: {
now: v.optional(v.number()),
limit: v.optional(v.number()),
},
returns: v.array(
v.object({
_id: v.id("promotions"),
code: v.string(),
titleEn: v.string(),
titleFr: v.string(),
descriptionEn: v.optional(v.string()),
descriptionFr: v.optional(v.string()),
discountType: v.union(v.literal("percent"), v.literal("amount")),
discountValue: v.number(),
})
),
handler: async (ctx, args) => {
const now = args.now ?? Date.now();
const limit = Math.max(1, Math.min(args.limit ?? 20, 50));

// We don't have an index for time windows yet; for now we filter in memory.
const items = await ctx.db
.query("promotions")
.withIndex("by_active", (q) => q.eq("isActive", true))
.order("desc")
.take(200);

const visible = items
.filter((p) => {
if (p.startsAt !== undefined && p.startsAt > now) return false;
if (p.endsAt !== undefined && p.endsAt < now) return false;
return true;
})
.slice(0, limit);

return visible.map((p) => ({
_id: p._id,
code: p.code,
titleEn: p.titleEn,
titleFr: p.titleFr,
descriptionEn: p.descriptionEn,
descriptionFr: p.descriptionFr,
discountType: p.discountType,
discountValue: p.discountValue,
}));
},
});

export const validatePromotionCode = mutation({
args: {
userId: v.id("users"),
code: v.string(),
baseFare: v.number(),
},
returns: v.object({
valid: v.boolean(),
reason: v.optional(v.string()),

// Filled only when valid
promotionId: v.optional(v.id("promotions")),
code: v.optional(v.string()),
discountAmount: v.optional(v.number()),
discountedFare: v.optional(v.number()),
discountType: v.optional(v.union(v.literal("percent"), v.literal("amount"))),
discountValue: v.optional(v.number()),
}),
handler: async (ctx, args) => {
return await validatePromotionCodeCore(ctx, args);
},
});

async function validatePromotionCodeCore(
ctx: any,
args: {
userId: any;
code: string;
baseFare: number;
}
) {
const code = normalizeCode(args.code);

if (!code) {
return { valid: false, reason: "empty_code" };
}

if (args.baseFare <= 0) {
return { valid: false, reason: "invalid_amount" };
}

// 1) Admin-defined promotions first.
const promotion = await ctx.db
.query("promotions")
.withIndex("by_code", (q: any) => q.eq("code", code))
.first();

// 2) Built-in fallback promo for testing/demos.
// If the admin later creates a promo with this code, it will override this fallback.
if (!promotion && code === "BIENVENUE") {
const discountType: "percent" = "percent";
const discountValue = 20;
const { discountAmount, discountedFare } = computeDiscountedFare({
baseFare: args.baseFare,
discountType,
discountValue,
});

// Enforce 1-use-per-user by checking previous orders with promoCode.
const past = await ctx.db
.query("orders")
.withIndex("by_user_id", (q: any) => q.eq("userId", args.userId))
.order("desc")
.take(200);

const alreadyUsed = past.some((o: any) => (o.promoCode ?? "").toUpperCase() === code);
if (alreadyUsed) {
return { valid: false, reason: "max_uses_per_user" };
}

return {
valid: true,
promotionId: undefined,
code,
discountAmount,
discountedFare,
discountType,
discountValue,
};
}

if (!promotion) {
return { valid: false, reason: "not_found" };
}

const now = Date.now();

if (!promotion.isActive) {
return { valid: false, reason: "inactive" };
}

if (promotion.startsAt !== undefined && promotion.startsAt > now) {
return { valid: false, reason: "not_started" };
}

if (promotion.endsAt !== undefined && promotion.endsAt < now) {
return { valid: false, reason: "expired" };
}

// Usage limits
if (promotion.maxUsesTotal !== undefined) {
const totalRedemptions = await ctx.db
.query("promotionRedemptions")
.withIndex("by_promotion_id", (q: any) => q.eq("promotionId", promotion._id))
.collect();

if (totalRedemptions.length >= promotion.maxUsesTotal) {
return { valid: false, reason: "max_uses_total" };
}
}

if (promotion.maxUsesPerUser !== undefined) {
const userRedemptions = await ctx.db
.query("promotionRedemptions")
.withIndex("by_user_id_and_promotion_id", (q: any) =>
q.eq("userId", args.userId).eq("promotionId", promotion._id)
)
.collect();

if (userRedemptions.length >= promotion.maxUsesPerUser) {
return { valid: false, reason: "max_uses_per_user" };
}
}

const { discountAmount, discountedFare } = computeDiscountedFare({
baseFare: args.baseFare,
discountType: promotion.discountType,
discountValue: promotion.discountValue,
});

return {
valid: true,
promotionId: promotion._id,
code: promotion.code,
discountAmount,
discountedFare,
discountType: promotion.discountType,
discountValue: promotion.discountValue,
};
}

export const redeemPromotionForOrder = mutation({
args: {
orderId: v.id("orders"),
userId: v.id("users"),
code: v.string(),
baseFare: v.number(),
},
returns: v.object({
promoCode: v.optional(v.string()),
promoDiscountAmount: v.optional(v.number()),
discountedFare: v.optional(v.number()),
promotionId: v.optional(v.id("promotions")),
}),
handler: async (ctx, args) => {
const order = await ctx.db.get(args.orderId);
if (!order) throw new Error("Order not found");
if (order.userId !== args.userId) throw new Error("Not authorized");

const validation = await validatePromotionCodeCore(ctx, {
userId: args.userId,
code: args.code,
baseFare: args.baseFare,
});

if (!validation.valid || !validation.code || validation.discountAmount === undefined || validation.discountedFare === undefined) {
throw new Error(validation.reason ?? "invalid_promo");
}

// IMPORTANT:
// For now we count a promo as "used" when a booking is created.
// Later we can improve this by reserving usage and releasing on cancellation.
if (validation.promotionId) {
await ctx.db.insert("promotionRedemptions", {
promotionId: validation.promotionId,
userId: args.userId,
orderId: args.orderId,
createdAt: Date.now(),
});
}

await ctx.db.patch(args.orderId, {
promotionId: validation.promotionId,
promoCode: validation.code,
promoDiscountAmount: validation.discountAmount,
originalEstimatedFare: args.baseFare,
estimatedFare: validation.discountedFare,
updatedAt: Date.now(),
});

return {
promotionId: validation.promotionId,
promoCode: validation.code,
promoDiscountAmount: validation.discountAmount,
discountedFare: validation.discountedFare,
};
},
});