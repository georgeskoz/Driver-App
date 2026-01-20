import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// ===== AUTHENTICATION =====

export const signup = mutation({
  args: {
    email: v.string(),
    password: v.string(), // This will be hashed on a backend service
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    role: v.optional(v.union(v.literal("user"), v.literal("driver"), v.literal("restaurant"))),
    language: v.union(v.literal("en"), v.literal("fr")),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    // Check if user already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (existing) {
      throw new Error("User already exists with this email");
    }

    const userId = await ctx.db.insert("users", {
      clerkId: "", // Will be set during Clerk integration
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      role: args.role ?? "user",
      language: args.language,
      country: args.country,
      state: args.state,
      city: args.city,
      address: args.address,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const user = await ctx.db.get(userId);
    return {
      _id: user?._id,
      email: user?.email,
      firstName: user?.firstName,
      lastName: user?.lastName,
      phone: user?.phone,
      profileImage:
        user?.profileImageStorageId && user.profileImageStorageId !== null
          ? (await ctx.storage.getUrl(user.profileImageStorageId)) ?? undefined
          : user?.profileImage,
      language: user?.language,
      role: user?.role,
    };
  },
});

// Admin bootstrap
// There are no hardcoded admin credentials in this app.
// Instead, we provide a one-time, safe bootstrap mechanism:
// - If NO admin users exist yet, the first signed-in user can promote their own account to admin.
// - Once an admin exists, this is disabled.
export const canBootstrapAdmin = query({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;

    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();

    return !existingAdmin;
  },
});

export const bootstrapMakeUserAdmin = mutation({
  args: { userId: v.id("users") },
  returns: v.object({ role: v.literal("admin") }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const existingAdmin = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "admin"))
      .first();

    if (existingAdmin) {
      throw new Error("An admin account already exists");
    }

    await ctx.db.patch(args.userId, {
      role: "admin",
      updatedAt: Date.now(),
    });

    return { role: "admin" };
  },
});

// ===== DRIVER BOOTSTRAP (TESTING / EARLY STAGE) =====
// Similar to admin bootstrap: if NO driver users exist yet, allow a signed-in user to promote
// their own account to "driver" so you can test end-to-end dispatch.
// In production you will likely replace this with an admin approval flow.
export const canBootstrapDriver = query({
  args: { userId: v.id("users") },
  returns: v.boolean(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) return false;

    const existingDriver = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "driver"))
      .first();

    return !existingDriver;
  },
});

export const bootstrapMakeUserDriver = mutation({
  args: { userId: v.id("users") },
  returns: v.object({ role: v.literal("driver") }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const existingDriver = await ctx.db
      .query("users")
      .withIndex("by_role", (q) => q.eq("role", "driver"))
      .first();

    if (existingDriver) {
      throw new Error("A driver account already exists");
    }

    await ctx.db.patch(args.userId, {
      role: "driver",
      updatedAt: Date.now(),
    });

    return { role: "driver" };
  },
});

export const login = mutation({
  args: {
    email: v.string(),
    password: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", args.email))
      .first();

    if (!user) {
      throw new Error("User not found");
    }

    // NOTE: Password validation will be added later (e.g., via Clerk, custom hashing, etc.)
    // For now this mutation is a lightweight identity lookup.

    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage:
        user.profileImageStorageId && user.profileImageStorageId !== null
          ? (await ctx.storage.getUrl(user.profileImageStorageId)) ?? undefined
          : user.profileImage,
      language: user.language,
      role: user.role,
    };
  },
});

export const updateLanguage = mutation({
  args: {
    userId: v.id("users"),
    language: v.union(v.literal("en"), v.literal("fr")),
  },
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      language: args.language,
      updatedAt: Date.now(),
    });

    return { language: args.language };
  },
});

export const getOrCreateUser = mutation({
  args: {
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    language: v.optional(v.union(v.literal("en"), v.literal("fr"))),
    role: v.optional(v.union(v.literal("user"), v.literal("driver"), v.literal("restaurant"))),
  },
  returns: v.object({
    _id: v.id("users"),
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    role: v.union(v.literal("user"), v.literal("driver"), v.literal("restaurant"), v.literal("admin")),
    language: v.union(v.literal("en"), v.literal("fr")),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (existing) {
      return {
        _id: existing._id,
        clerkId: existing.clerkId,
        email: existing.email,
        firstName: existing.firstName,
        lastName: existing.lastName,
        phone: existing.phone,
        role: existing.role,
        language: existing.language,
      };
    }

    const userId = await ctx.db.insert("users", {
      clerkId: args.clerkId,
      email: args.email,
      firstName: args.firstName,
      lastName: args.lastName,
      phone: args.phone,
      role: args.role ?? "user",
      language: args.language ?? "en",
      createdAt: Date.now(),
      updatedAt: Date.now(),
    });

    const user = await ctx.db.get(userId);
    if (!user) throw new Error("Failed to create user");
    return {
      _id: user._id,
      clerkId: user.clerkId,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      role: user.role,
      language: user.language,
    };
  },
});

export const getCurrentUser = query({
  args: { clerkId: v.string() },
  handler: async (ctx, args) => {
    return await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();
  },
});

export const updateUserProfile = mutation({
  args: {
    clerkId: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    profileImage: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
  },
  returns: v.object({
    _id: v.id("users"),
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    role: v.union(v.literal("user"), v.literal("driver"), v.literal("restaurant"), v.literal("admin")),
    language: v.union(v.literal("en"), v.literal("fr")),
    profileImage: v.optional(v.string()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db
      .query("users")
      .withIndex("by_clerk_id", (q) => q.eq("clerkId", args.clerkId))
      .first();

    if (!user) throw new Error("User not found");

    const updateData: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.firstName !== undefined) updateData.firstName = args.firstName;
    if (args.lastName !== undefined) updateData.lastName = args.lastName;
    if (args.phone !== undefined) updateData.phone = args.phone;
    if (args.profileImage !== undefined) updateData.profileImage = args.profileImage;
    if (args.country !== undefined) updateData.country = args.country;
    if (args.state !== undefined) updateData.state = args.state;
    if (args.city !== undefined) updateData.city = args.city;
    if (args.address !== undefined) updateData.address = args.address;

    await ctx.db.patch(user._id, updateData);
    const updated = await ctx.db.get(user._id);
    if (!updated) throw new Error("User not found");

    return {
      _id: updated._id,
      clerkId: updated.clerkId,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      role: updated.role,
      language: updated.language,
      profileImage: updated.profileImage,
      country: updated.country,
      state: updated.state,
      city: updated.city,
      address: updated.address,
    };
  },
});

// Mobile-friendly profile APIs (the app stores `userId` in session, not Clerk IDs).
export const getUserProfile = query({
  args: { userId: v.id("users") },
  returns: v.object({
    _id: v.id("users"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    profileImage: v.optional(v.string()),
    language: v.union(v.literal("en"), v.literal("fr")),
  }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const profileImage =
      user.profileImageStorageId && user.profileImageStorageId !== null
        ? (await ctx.storage.getUrl(user.profileImageStorageId)) ?? undefined
        : user.profileImage;

    return {
      _id: user._id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage,
      language: user.language,
    };
  },
});

export const updateUserProfileById = mutation({
  args: {
    userId: v.id("users"),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
    profileImage: v.optional(v.string()),
  },
  returns: v.object({
    _id: v.id("users"),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    profileImage: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const existing = await ctx.db.get(args.userId);
    if (!existing) throw new Error("User not found");

    const patch: Record<string, unknown> = { updatedAt: Date.now() };
    if (args.firstName !== undefined) patch.firstName = args.firstName;
    if (args.lastName !== undefined) patch.lastName = args.lastName;
    if (args.phone !== undefined) patch.phone = args.phone;
    if (args.profileImage !== undefined) patch.profileImage = args.profileImage;

    await ctx.db.patch(args.userId, patch);

    const updated = await ctx.db.get(args.userId);
    if (!updated) throw new Error("User not found");

    return {
      _id: updated._id,
      email: updated.email,
      firstName: updated.firstName,
      lastName: updated.lastName,
      phone: updated.phone,
      profileImage: updated.profileImage,
    };
  },
});

export const generateProfileImageUploadUrl = mutation({
  args: { userId: v.id("users") },
  returns: v.string(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");
    return await ctx.storage.generateUploadUrl();
  },
});

export const setUserProfileImageFromUpload = mutation({
  args: { userId: v.id("users"), storageId: v.id("_storage") },
  returns: v.object({ profileImage: v.optional(v.string()) }),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    const url = await ctx.storage.getUrl(args.storageId);

    await ctx.db.patch(args.userId, {
      profileImageStorageId: args.storageId,
      // Keep `profileImage` for backwards compatibility, but clear any URL-based value.
      profileImage: "",
      updatedAt: Date.now(),
    });

    return { profileImage: url ?? undefined };
  },
});

export const removeUserProfileImage = mutation({
  args: { userId: v.id("users") },
  returns: v.null(),
  handler: async (ctx, args) => {
    const user = await ctx.db.get(args.userId);
    if (!user) throw new Error("User not found");

    await ctx.db.patch(args.userId, {
      profileImageStorageId: null,
      profileImage: "",
      updatedAt: Date.now(),
    });

    return null;
  },
});

// Legacy bookings API removed (this project uses `orders` and the schema has no `bookings` table).

// ===== ORDER MANAGEMENT =====

export const createOrder = mutation({
  args: {
    userId: v.id("users"),
    mode: v.union(v.literal("ride"), v.literal("delivery")),
    pickupAddress: v.string(),
    pickupLat: v.number(),
    pickupLng: v.number(),
    dropoffAddress: v.string(),
    dropoffLat: v.number(),
    dropoffLng: v.number(),
    packageSize: v.optional(v.string()),
    weightKg: v.optional(v.number()),
    packageContents: v.optional(v.string()),
    shareable: v.optional(v.boolean()),
    vehicleType: v.optional(
      v.union(
        v.literal("sedan"),
        v.literal("van"),
        v.literal("economy"),
        v.literal("comfort"),
        v.literal("premium"),
        v.literal("xl")
      )
    ),
    paymentMethod: v.union(v.literal("card"), v.literal("cash"), v.literal("apple_pay"), v.literal("google_pay")),
    estimatedFare: v.number(),
    // Promotion (optional)
    promotionId: v.optional(v.id("promotions")),
    promoCode: v.optional(v.string()),
    promoDiscountAmount: v.optional(v.number()),
    originalEstimatedFare: v.optional(v.number()),

    scheduledAt: v.optional(v.number()),
  },
  returns: v.id("orders"),
  handler: async (ctx, args) => {
    const orderId = await ctx.db.insert("orders", {
      userId: args.userId,
      mode: args.mode,
      status: "pending",
      pickupAddress: args.pickupAddress,
      pickupLat: args.pickupLat,
      pickupLng: args.pickupLng,
      dropoffAddress: args.dropoffAddress,
      dropoffLat: args.dropoffLat,
      dropoffLng: args.dropoffLng,
      packageSize: args.packageSize,
      weightKg: args.weightKg,
      packageContents: args.packageContents,
      shareable: args.shareable,
      vehicleType: args.vehicleType,
      paymentMethod: args.paymentMethod,
      estimatedFare: args.estimatedFare,

      // Promo fields are stored so pricing is consistent across customer + driver apps.
      promotionId: args.promotionId,
      promoCode: args.promoCode,
      promoDiscountAmount: args.promoDiscountAmount,
      originalEstimatedFare: args.originalEstimatedFare,

      scheduledAt: args.scheduledAt,
      createdAt: Date.now(),
      matchingAttemptCount: 0,
      lastMatchAttemptAt: undefined,
      nextMatchAttemptAt: undefined,
    });
    return orderId;
  },
});

export const getOrder = query({
  args: { orderId: v.id("orders") },
  returns: v.object({
    _id: v.id("orders"),
    userId: v.id("users"),
    mode: v.string(),
    status: v.string(),
    pickupAddress: v.string(),
    dropoffAddress: v.string(),
    estimatedFare: v.number(),
    driverId: v.optional(v.id("drivers")),
    actualFare: v.optional(v.number()),
    createdAt: v.number(),
    matchingAttemptCount: v.optional(v.number()),
    nextMatchAttemptAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    return {
      _id: order._id,
      userId: order.userId,
      mode: order.mode,
      status: order.status,
      pickupAddress: order.pickupAddress,
      dropoffAddress: order.dropoffAddress,
      estimatedFare: order.estimatedFare,
      driverId: order.driverId,
      actualFare: order.actualFare,
      createdAt: order.createdAt,
      matchingAttemptCount: order.matchingAttemptCount,
      nextMatchAttemptAt: order.nextMatchAttemptAt,
    };
  },
});

export const getRideTrackingDetails = query({
  args: { orderId: v.id("orders") },
  returns: v.object({
    order: v.object({
      _id: v.id("orders"),
      status: v.string(),
      pickupAddress: v.string(),
      dropoffAddress: v.string(),
      estimatedFare: v.number(),
      vehicleType: v.optional(v.string()),
      driverId: v.optional(v.id("drivers")),
      createdAt: v.number(),
    }),
    driver: v.union(
      v.null(),
      v.object({
        _id: v.id("drivers"),
        fullName: v.string(),
        phone: v.string(),
        rating: v.number(),
        totalTrips: v.number(),
        vehicleMake: v.string(),
        vehicleModel: v.string(),
        vehicleColor: v.string(),
        licensePlate: v.string(),
        permitNumber: v.string(),
      })
    ),
  }),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const baseOrder = {
      _id: order._id,
      status: order.status,
      pickupAddress: order.pickupAddress,
      dropoffAddress: order.dropoffAddress,
      estimatedFare: order.estimatedFare,
      vehicleType: order.vehicleType,
      driverId: order.driverId,
      createdAt: order.createdAt,
    };

    if (!order.driverId) {
      return { order: baseOrder, driver: null };
    }

    const driver = await ctx.db.get(order.driverId);
    if (!driver) {
      // Order references a driverId that doesn't exist (shouldn't happen, but keep it resilient).
      return { order: baseOrder, driver: null };
    }

    const fullName = `${driver.firstName} ${driver.lastName}`.trim();

    return {
      order: baseOrder,
      driver: {
        _id: driver._id,
        fullName: fullName || "Driver",
        phone: driver.phone,
        rating: driver.rating ?? 4.9,
        totalTrips: driver.totalTrips ?? 0,
        vehicleMake: driver.vehicleMake ?? "",
        vehicleModel: driver.vehicleModel ?? "",
        vehicleColor: driver.vehicleColor ?? "",
        licensePlate: driver.licensePlate,
        // We don't have a dedicated MTQ permit field yet; using licenseNumber as a stable stand-in.
        permitNumber: driver.licenseNumber,
      },
    };
  },
});

export const getTripReceiptDetails = query({
  args: { orderId: v.id("orders") },
  returns: v.object({
    _id: v.id("orders"),
    status: v.string(),
    estimatedFare: v.number(),
    actualFare: v.optional(v.number()),
    paymentMethod: v.string(),
    paymentBrand: v.optional(v.string()),
    paymentLast4: v.optional(v.string()),
    tipAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  }),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    return {
      _id: order._id,
      status: order.status,
      estimatedFare: order.estimatedFare,
      actualFare: order.actualFare,
      paymentMethod: order.paymentMethod,
      paymentBrand: order.paymentBrand,
      paymentLast4: order.paymentLast4,
      tipAmount: order.tipAmount,
      taxAmount: order.taxAmount,
      paidAt: order.paidAt,
      completedAt: order.completedAt,
    };
  },
});

const DEFAULT_BILLING_SETTINGS = {
  currency: "CAD",
  gstRate: 0.05,
  qstRate: 0.09975,
  regulatoryFeeAmount: 0.9,
  applyRegulatoryFeeToRides: true,
};

async function getBillingSettingsForReceipts(ctx: any) {
  const doc = await ctx.db
    .query("billingSettings")
    .withIndex("by_key", (q: any) => q.eq("key", "default"))
    .first();

  if (!doc) {
    return DEFAULT_BILLING_SETTINGS;
  }

  return {
    currency: doc.currency,
    gstRate: doc.gstRate,
    qstRate: doc.qstRate,
    regulatoryFeeAmount: doc.regulatoryFeeAmount,
    applyRegulatoryFeeToRides: doc.applyRegulatoryFeeToRides,
  };
}

function roundMoney(amount: number) {
  return Math.round(amount * 100) / 100;
}

function deriveOrderSubtotal(order: any) {
  const baseFare = order.fareBase;
  const distanceTimeFare = order.fareDistanceTime;
  const tolls = order.fareTolls;

  const hasDetailedBreakdown =
    baseFare !== undefined || distanceTimeFare !== undefined || tolls !== undefined;

  if (hasDetailedBreakdown) {
    return roundMoney(Math.max(0, (baseFare ?? 0) + (distanceTimeFare ?? 0) + (tolls ?? 0)));
  }

  const fallback = order.actualFare ?? order.estimatedFare ?? 0;
  return roundMoney(Math.max(0, fallback));
}

function computeQuebecReceiptTotals(args: {
  mode: string;
  subtotal: number;
  promoDiscountAmount: number;
  tipAmount: number;
  billingSettings: {
    gstRate: number;
    qstRate: number;
    regulatoryFeeAmount: number;
    applyRegulatoryFeeToRides: boolean;
  };
  // Stored snapshots on the order (preferred if present).
  regulatoryFeeAmount?: number;
  gstAmount?: number;
  qstAmount?: number;
}) {
  const promoDiscountAmount = Math.max(0, args.promoDiscountAmount ?? 0);
  const subtotalAfterPromo = roundMoney(Math.max(0, args.subtotal - promoDiscountAmount));

  // Quebec $0.90 fee applies to taxi rides (mode === "ride") and is non-taxable.
  const computedRegulatoryFee =
    args.mode === "ride" && args.billingSettings.applyRegulatoryFeeToRides
      ? args.billingSettings.regulatoryFeeAmount
      : 0;

  const regulatoryFeeAmount = roundMoney(args.regulatoryFeeAmount ?? computedRegulatoryFee);

  // Taxes are calculated on the taxable subtotal (NOT including the regulatory fee).
  const gstAmount = roundMoney(args.gstAmount ?? subtotalAfterPromo * args.billingSettings.gstRate);
  const qstAmount = roundMoney(args.qstAmount ?? subtotalAfterPromo * args.billingSettings.qstRate);

  const totalTax = roundMoney(gstAmount + qstAmount);
  const tipAmount = roundMoney(Math.max(0, args.tipAmount ?? 0));

  const totalPaid = roundMoney(subtotalAfterPromo + regulatoryFeeAmount + totalTax + tipAmount);

  return {
    promoDiscountAmount,
    subtotal: roundMoney(args.subtotal),
    subtotalAfterPromo,
    regulatoryFeeAmount,
    gstAmount,
    qstAmount,
    totalTax,
    tipAmount,
    totalPaid,
  };
}

export const getReceiptsForUser = query({
  args: {
    userId: v.id("users"),
    mode: v.optional(v.union(v.literal("ride"), v.literal("delivery"), v.literal("food"))),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      orderId: v.string(),
      mode: v.string(),
      paidAt: v.number(),
      total: v.number(),
      paymentLabel: v.string(),
      primaryLine: v.string(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 50, 100));

    const billingSettings = await getBillingSettingsForReceipts(ctx);

    // Pull more than we need so we can filter by mode/status/paidAt and still return a full list.
    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(200);

    const results: Array<{
      orderId: string;
      mode: string;
      paidAt: number;
      total: number;
      paymentLabel: string;
      primaryLine: string;
    }> = [];

    for (const order of recentOrders) {
      if (order.status !== "completed") continue;
      if (!order.paidAt) continue;
      if (args.mode && order.mode !== args.mode) continue;

      const receiptTotals = computeQuebecReceiptTotals({
        mode: order.mode,
        subtotal: deriveOrderSubtotal(order),
        promoDiscountAmount: order.promoDiscountAmount ?? 0,
        tipAmount: order.tipAmount ?? 0,
        billingSettings,
        // Prefer snapshots saved at payment time (stable for receipts)
        regulatoryFeeAmount: order.regulatoryFeeAmount,
        gstAmount: order.gstAmount,
        qstAmount: order.qstAmount,
      });

      const paymentLabel =
        order.paymentMethod === "cash"
          ? "Cash"
          : order.paymentMethod === "apple_pay"
          ? "Apple Pay"
          : order.paymentMethod === "google_pay"
          ? "Google Pay"
          : order.paymentBrand && order.paymentLast4
          ? `${order.paymentBrand} •••• ${order.paymentLast4}`
          : "Card";

      results.push({
        orderId: order._id,
        mode: order.mode,
        paidAt: order.paidAt,
        total: receiptTotals.totalPaid,
        paymentLabel,
        primaryLine: `${order.pickupAddress} → ${order.dropoffAddress}`,
      });

      if (results.length >= limit) {
        return results;
      }
    }

    return results;
  },
});

export const getReceiptDetails = query({
  args: { orderId: v.id("orders") },
  returns: v.object({
    _id: v.id("orders"),
    mode: v.string(),
    status: v.string(),
    pickupAddress: v.string(),
    dropoffAddress: v.string(),
    estimatedFare: v.number(),
    actualFare: v.optional(v.number()),
    promoDiscountAmount: v.optional(v.number()),
    paymentMethod: v.string(),
    paymentBrand: v.optional(v.string()),
    paymentLast4: v.optional(v.string()),
    tipAmount: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    paidAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),

    // Quebec-specific receipt/taxes
    regulatoryFeeAmount: v.optional(v.number()),
    gstAmount: v.optional(v.number()),
    qstAmount: v.optional(v.number()),
    gstRatePercent: v.optional(v.number()),
    qstRatePercent: v.optional(v.number()),

    // Professional receipt fields
    receiptNumber: v.optional(v.string()),
    driverName: v.optional(v.string()),
    vehicleId: v.optional(v.string()),
    durationMins: v.optional(v.number()),
    distanceKm: v.optional(v.number()),
    fareBase: v.optional(v.number()),
    fareDistanceTime: v.optional(v.number()),
    fareTolls: v.optional(v.number()),
    taxRatePercent: v.optional(v.number()),
    transactionStatus: v.optional(v.string()),
  }),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const billingSettings = await getBillingSettingsForReceipts(ctx);

    const driver = order.driverId ? await ctx.db.get(order.driverId) : null;
    const driverNameFromDriver = driver ? `${driver.firstName} ${driver.lastName}`.trim() : undefined;

    // Prefer snapshot fields (stable for expense reports), fallback to current driver profile.
    const driverName = order.driverNameSnapshot || driverNameFromDriver;
    const vehicleId = order.vehicleIdSnapshot || (driver ? driver.licensePlate : undefined);

    const receiptTotals = computeQuebecReceiptTotals({
      mode: order.mode,
      subtotal: deriveOrderSubtotal(order),
      promoDiscountAmount: order.promoDiscountAmount ?? 0,
      tipAmount: order.tipAmount ?? 0,
      billingSettings,
      regulatoryFeeAmount: order.regulatoryFeeAmount,
      gstAmount: order.gstAmount,
      qstAmount: order.qstAmount,
    });

    return {
      _id: order._id,
      mode: order.mode,
      status: order.status,
      pickupAddress: order.pickupAddress,
      dropoffAddress: order.dropoffAddress,
      estimatedFare: order.estimatedFare,
      actualFare: order.actualFare,
      promoDiscountAmount: order.promoDiscountAmount,
      paymentMethod: order.paymentMethod,
      paymentBrand: order.paymentBrand,
      paymentLast4: order.paymentLast4,
      tipAmount: order.tipAmount,
      // Backwards compatible aggregate tax field.
      taxAmount: receiptTotals.totalTax,
      paidAt: order.paidAt,
      completedAt: order.completedAt,

      regulatoryFeeAmount: receiptTotals.regulatoryFeeAmount,
      gstAmount: receiptTotals.gstAmount,
      qstAmount: receiptTotals.qstAmount,
      gstRatePercent:
        order.gstRatePercent ?? roundMoney(billingSettings.gstRate * 100),
      qstRatePercent:
        order.qstRatePercent ?? roundMoney(billingSettings.qstRate * 100),

      receiptNumber: order.receiptNumber,
      driverName,
      vehicleId,
      durationMins: order.durationMins,
      distanceKm: order.distanceKm,
      fareBase: order.fareBase,
      fareDistanceTime: order.fareDistanceTime,
      fareTolls: order.fareTolls,
      taxRatePercent: order.taxRatePercent,
      transactionStatus: order.transactionStatus,
    };
  },
});

export const getUserOrders = query({
  args: { userId: v.id("users") },
  returns: v.array(v.object({
    _id: v.id("orders"),
    mode: v.string(),
    status: v.string(),
    pickupAddress: v.string(),
    dropoffAddress: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const orders = await ctx.db
      .query("orders")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return orders.map(order => ({
      _id: order._id,
      mode: order.mode,
      status: order.status,
      pickupAddress: order.pickupAddress,
      dropoffAddress: order.dropoffAddress,
      createdAt: order.createdAt,
    }));
  },
});

export const getRecentPlaces = query({
  args: {
    userId: v.id("users"),
    limit: v.optional(v.number()),
  },
  returns: v.array(
    v.object({
      kind: v.union(v.literal("pickup"), v.literal("dropoff")),
      address: v.string(),
      lastUsedAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    const limit = Math.max(1, Math.min(args.limit ?? 10, 20));

    // Pull a bit more than needed so we can de-dupe addresses.
    const recentOrders = await ctx.db
      .query("orders")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .take(30);

    const seen = new Set<string>();
    const places: Array<{ kind: "pickup" | "dropoff"; address: string; lastUsedAt: number }> = [];

    for (const order of recentOrders) {
      const candidates: Array<{ kind: "pickup" | "dropoff"; address: string }> = [
        { kind: "pickup", address: order.pickupAddress },
        { kind: "dropoff", address: order.dropoffAddress },
      ];

      for (const candidate of candidates) {
        const normalizedAddress = candidate.address.trim();
        if (!normalizedAddress) continue;

        const key = `${candidate.kind}:${normalizedAddress.toLowerCase()}`;
        if (seen.has(key)) continue;

        seen.add(key);
        places.push({
          kind: candidate.kind,
          address: normalizedAddress,
          lastUsedAt: order.createdAt,
        });

        if (places.length >= limit) {
          return places;
        }
      }
    }

    return places;
  },
});

export const updateOrderStatus = mutation({
  args: {
    orderId: v.id("orders"),
    status: v.union(
      v.literal("pending"),
      v.literal("searching"),
      v.literal("queued"),
      v.literal("matched"),
      v.literal("driver_arrived"),
      v.literal("picked_up"),
      v.literal("in_transit"),
      v.literal("delivered"),
      v.literal("completed"),
      v.literal("cancelled")
    ),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const now = Date.now();
    const patch: Record<string, unknown> = {
      status: args.status,
      updatedAt: now,
    };

    if (args.status === "completed") {
      patch.completedAt = now;
      // If the driver app didn't explicitly mark paidAt, we assume payment happened at completion.
      patch.paidAt = now;
    }

    await ctx.db.patch(args.orderId, patch);
  },
});

// Driver-side: finalize payment and complete the order.
// This will be called from the driver app when the trip is finished and payment is confirmed.
export const completeOrderPayment = mutation({
  args: {
    orderId: v.id("orders"),
    actualFare: v.number(),
    paymentMethod: v.union(
      v.literal("card"),
      v.literal("cash"),
      v.literal("apple_pay"),
      v.literal("google_pay")
    ),
    paymentBrand: v.optional(v.string()),
    paymentLast4: v.optional(v.string()),
    taxAmount: v.optional(v.number()),
    tipAmount: v.optional(v.number()),

    // Optional Quebec tax breakdown (if a payment provider supplies exact values)
    regulatoryFeeAmount: v.optional(v.number()),
    gstAmount: v.optional(v.number()),
    qstAmount: v.optional(v.number()),

    // Optional receipt + trip metrics (driver app will provide later)
    distanceKm: v.optional(v.number()),
    durationMins: v.optional(v.number()),

    // Optional detailed fare breakdown
    fareBase: v.optional(v.number()),
    fareDistanceTime: v.optional(v.number()),
    fareTolls: v.optional(v.number()),
    taxRatePercent: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.actualFare < 0) {
      throw new Error("actualFare must be >= 0");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");

    const billingSettings = await getBillingSettingsForReceipts(ctx);

    const now = Date.now();

    // Generate a stable receipt number if missing.
    // We keep this simple and deterministic; you can later replace it with a true sequence generator.
    const receiptNumber = order.receiptNumber || `TRP-${order._id.slice(-8).toUpperCase()}`;

    // Snapshot driver + vehicle for a stable receipt (expense reports need stability).
    let driverNameSnapshot: string | undefined = order.driverNameSnapshot;
    let vehicleIdSnapshot: string | undefined = order.vehicleIdSnapshot;

    if ((!driverNameSnapshot || !vehicleIdSnapshot) && order.driverId) {
      const driver = await ctx.db.get(order.driverId);
      if (driver) {
        if (!driverNameSnapshot) {
          const fullName = `${driver.firstName} ${driver.lastName}`.trim();
          driverNameSnapshot = fullName || "Driver";
        }
        if (!vehicleIdSnapshot) {
          vehicleIdSnapshot = driver.licensePlate;
        }
      }
    }

    // If the driver doesn't send duration, derive a reasonable default from timestamps.
    // Note: this is not perfect (only works if startedAt exists), but it's better than empty.
    let durationMins = args.durationMins;
    if (durationMins === undefined && order.startedAt) {
      durationMins = Math.max(0, Math.round((now - order.startedAt) / 60000));
    }

    // Compute Quebec totals (Redevance + GST + QST).
    // For maximum consistency, we snapshot the computed values on the order at payment time.
    const receiptTotals = computeQuebecReceiptTotals({
      mode: order.mode,
      subtotal: deriveOrderSubtotal({
        ...order,
        actualFare: args.actualFare,
        fareBase: args.fareBase,
        fareDistanceTime: args.fareDistanceTime,
        fareTolls: args.fareTolls,
      } as any),
      promoDiscountAmount: order.promoDiscountAmount ?? 0,
      tipAmount: args.tipAmount ?? 0,
      billingSettings,
      regulatoryFeeAmount: args.regulatoryFeeAmount,
      gstAmount: args.gstAmount,
      qstAmount: args.qstAmount,
    });

    await ctx.db.patch(args.orderId, {
      status: "completed",
      actualFare: args.actualFare,
      paymentMethod: args.paymentMethod,
      paymentBrand: args.paymentBrand,
      paymentLast4: args.paymentLast4,
      // Backwards compatible aggregate. We always snapshot the computed GST+QST.
      taxAmount: receiptTotals.totalTax,
      tipAmount: args.tipAmount,
      paidAt: now,
      completedAt: now,
      updatedAt: now,

      receiptNumber,
      driverNameSnapshot,
      vehicleIdSnapshot,
      durationMins,
      distanceKm: args.distanceKm,

      fareBase: args.fareBase,
      fareDistanceTime: args.fareDistanceTime,
      fareTolls: args.fareTolls,
      taxRatePercent: args.taxRatePercent,

      regulatoryFeeAmount: receiptTotals.regulatoryFeeAmount,
      gstAmount: receiptTotals.gstAmount,
      qstAmount: receiptTotals.qstAmount,
      gstRatePercent: roundMoney(billingSettings.gstRate * 100),
      qstRatePercent: roundMoney(billingSettings.qstRate * 100),

      transactionStatus: "approved",
    });
  },
});

// Customer-side: submit trip rating and optional issue tags.
export const submitRideRating = mutation({
  args: {
    orderId: v.id("orders"),
    customerId: v.id("users"),
    rating: v.number(),
    review: v.optional(v.string()),
    issueTagCodes: v.optional(v.array(v.string())),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }

    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    if (order.userId !== args.customerId) throw new Error("Not authorized");
    if (!order.driverId) throw new Error("Order has no driver yet");

    // Store a normalized rating record for analytics.
    await ctx.db.insert("ratings", {
      orderId: args.orderId,
      driverId: order.driverId,
      customerId: args.customerId,
      rating: args.rating,
      review: args.review,
      issueTagCodes: args.issueTagCodes,
      createdAt: Date.now(),
    });

    // Also patch the order for quick access.
    await ctx.db.patch(args.orderId, {
      rating: args.rating,
      review: args.review,
      updatedAt: Date.now(),
    });
  },
});

// Customer (rider) rating summary (ratings left by drivers).
export const getCustomerRatingSummary = query({
  args: {
    customerId: v.id("users"),
  },
  returns: v.object({
    average: v.union(v.null(), v.number()),
    count: v.number(),
  }),
  handler: async (ctx, args) => {
    // Pull a bounded set for now (keeps reads predictable). We can add a materialized aggregate later.
    const recent = await ctx.db
      .query("customerRatings")
      .withIndex("by_customer_id", (q) => q.eq("customerId", args.customerId))
      .order("desc")
      .take(200);

    if (recent.length === 0) {
      return { average: null, count: 0 };
    }

    const sum = recent.reduce((acc, r) => acc + r.rating, 0);
    const avg = sum / recent.length;

    // Keep it stable for UI: 1 decimal is plenty for a small badge.
    const rounded = Math.round(avg * 10) / 10;

    return {
      average: rounded,
      count: recent.length,
    };
  },
});

export const rateOrder = mutation({
  args: {
    orderId: v.id("orders"),
    rating: v.number(),
    review: v.optional(v.string()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    if (args.rating < 1 || args.rating > 5) {
      throw new Error("Rating must be between 1 and 5");
    }
    
    await ctx.db.patch(args.orderId, {
      rating: args.rating,
      review: args.review,
      updatedAt: Date.now(),
    });
  },
});

export const addTip = mutation({
  args: {
    orderId: v.id("orders"),
    tipAmount: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const order = await ctx.db.get(args.orderId);
    if (!order) throw new Error("Order not found");
    
    await ctx.db.patch(args.orderId, {
      tipAmount: args.tipAmount,
      updatedAt: Date.now(),
    });
  },
});

// ===== MESSAGES (ORDER CHAT) =====

export const sendMessage = mutation({
  args: {
    orderId: v.id("orders"),
    senderId: v.id("users"),
    senderType: v.union(v.literal("customer"), v.literal("driver")),
    message: v.string(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("orderMessages", {
      orderId: args.orderId,
      senderId: args.senderId,
      senderType: args.senderType,
      message: args.message,
      createdAt: Date.now(),
    });
  },
});

export const getOrderMessages = query({
  args: { orderId: v.id("orders") },
  returns: v.array(v.object({
    _id: v.id("orderMessages"),
    message: v.string(),
    senderType: v.string(),
    createdAt: v.number(),
  })),
  handler: async (ctx, args) => {
    const messages = await ctx.db
      .query("orderMessages")
      .withIndex("by_order_id", (q) => q.eq("orderId", args.orderId))
      .order("desc")
      .collect();

    return messages.map(msg => ({
      _id: msg._id,
      message: msg.message,
      senderType: msg.senderType,
      createdAt: msg.createdAt,
    }));
  },
});

// ===== FAVORITE LOCATIONS =====

export const getSavedAddresses = query({
  args: {
    userId: v.id("users"),
    kind: v.optional(v.union(v.literal("pickup"), v.literal("dropoff"))),
  },
  returns: v.array(
    v.object({
      _id: v.id("savedAddresses"),
      kind: v.union(v.literal("pickup"), v.literal("dropoff")),
      label: v.string(),
      address: v.string(),
      notes: v.optional(v.string()),
      createdAt: v.number(),
    })
  ),
  handler: async (ctx, args) => {
    if (args.kind) {
      const items = await ctx.db
        .query("savedAddresses")
        .withIndex("by_user_id_and_kind", (q) =>
          q.eq("userId", args.userId).eq("kind", args.kind!)
        )
        .order("desc")
        .collect();

      return items.map((i) => ({
        _id: i._id,
        kind: i.kind,
        label: i.label,
        address: i.address,
        notes: i.notes,
        createdAt: i.createdAt,
      }));
    }

    const items = await ctx.db
      .query("savedAddresses")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .order("desc")
      .collect();

    return items.map((i) => ({
      _id: i._id,
      kind: i.kind,
      label: i.label,
      address: i.address,
      notes: i.notes,
      createdAt: i.createdAt,
    }));
  },
});

export const addSavedAddress = mutation({
  args: {
    userId: v.id("users"),
    kind: v.union(v.literal("pickup"), v.literal("dropoff")),
    label: v.string(),
    address: v.string(),
    notes: v.optional(v.string()),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
  },
  returns: v.id("savedAddresses"),
  handler: async (ctx, args) => {
    const now = Date.now();
    const docId = await ctx.db.insert("savedAddresses", {
      userId: args.userId,
      kind: args.kind,
      label: args.label,
      address: args.address,
      notes: args.notes,
      latitude: args.latitude,
      longitude: args.longitude,
      createdAt: now,
      updatedAt: now,
    });
    return docId;
  },
});

export const deleteSavedAddress = mutation({
  args: {
    savedAddressId: v.id("savedAddresses"),
    userId: v.id("users"),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const doc = await ctx.db.get(args.savedAddressId);
    if (!doc) throw new Error("Saved address not found");
    if (doc.userId !== args.userId) throw new Error("Not authorized");
    await ctx.db.delete(args.savedAddressId);
  },
});

export const addFavoriteLocation = mutation({
  args: {
    userId: v.id("users"),
    label: v.union(v.literal("home"), v.literal("work"), v.literal("other")),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    await ctx.db.insert("favoriteLocations", {
      userId: args.userId,
      label: args.label,
      address: args.address,
      latitude: args.latitude,
      longitude: args.longitude,
      createdAt: Date.now(),
    });
  },
});

export const getFavoriteLocations = query({
  args: { userId: v.id("users") },
  returns: v.array(v.object({
    _id: v.id("favoriteLocations"),
    label: v.string(),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
  })),
  handler: async (ctx, args) => {
    const favorites = await ctx.db
      .query("favoriteLocations")
      .withIndex("by_user_id", (q) => q.eq("userId", args.userId))
      .collect();

    return favorites.map(fav => ({
      _id: fav._id,
      label: fav.label,
      address: fav.address,
      latitude: fav.latitude,
      longitude: fav.longitude,
    }));
  },
});

// ===== DEV UTILITIES (REMOVE/LOCK DOWN BEFORE PRODUCTION) =====

// This solves the most common early-stage testing deadlock:
// - Matching only offers to drivers who are { status: "active", onlineStatus: "online" }
// - Driver APIs require a user record with role "driver"
// If you have a fresh DB with no driver users, riders can request trips but no driver will ever receive offers.
//
// This helper creates (or updates) a deterministic test driver user + driver profile and puts them online.
export const devEnsureTestDriverOnline = mutation({
  args: {},
  returns: v.object({
    userId: v.id("users"),
    driverId: v.id("drivers"),
    email: v.string(),
  }),
  handler: async (ctx) => {
    const now = Date.now();

    const testEmail = "test-driver@transpo.local";

    // 1) Ensure a DRIVER USER exists.
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", testEmail))
      .first();

    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: "",
        email: testEmail,
        firstName: "Test",
        lastName: "Driver",
        phone: "+1 (555) 010-2000",
        role: "driver",
        language: "en",
        createdAt: now,
        updatedAt: now,
      });
      user = await ctx.db.get(userId);
    } else if (user.role !== "driver") {
      await ctx.db.patch(user._id, { role: "driver", updatedAt: now });
      user = await ctx.db.get(user._id);
    }

    if (!user) {
      throw new Error("Failed to create test driver user");
    }

    // 2) Ensure a DRIVER PROFILE exists and is online.
    let driver = await ctx.db
      .query("drivers")
      .withIndex("by_email", (q) => q.eq("email", testEmail))
      .first();

    const baseProfile = {
      clerkId: user.clerkId || user._id,
      email: testEmail,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage: user.profileImage,
      status: "active" as const,
      onlineStatus: "online" as const,

      licenseNumber: "MTQ-TEST-0000",
      licenseExpiry: now + 1000 * 60 * 60 * 24 * 365,
      licensePlate: "QC 456 ABC",

      vehicleType: "sedan" as const,
      vehicleMake: "Toyota",
      vehicleModel: "Camry",
      vehicleYear: 2020,
      vehicleColor: "Grey",

      approvedServices: ["taxi"],

      updatedAt: now,
    };

    if (!driver) {
      const driverId = await ctx.db.insert("drivers", {
        ...baseProfile,
        createdAt: now,
      });
      driver = await ctx.db.get(driverId);
    } else {
      await ctx.db.patch(driver._id, baseProfile);
      driver = await ctx.db.get(driver._id);
    }

    if (!driver) {
      throw new Error("Failed to create test driver profile");
    }

    return { userId: user._id, driverId: driver._id, email: testEmail };
  },
});

export const devEnsureDriverOnlineByEmail = mutation({
  args: {
    email: v.string(),
    firstName: v.optional(v.string()),
    lastName: v.optional(v.string()),
    phone: v.optional(v.string()),
  },
  returns: v.object({
    userId: v.id("users"),
    driverId: v.id("drivers"),
    email: v.string(),
  }),
  handler: async (ctx, args) => {
    const now = Date.now();
    const email = args.email.trim().toLowerCase();

    if (!email) {
      throw new Error("email is required");
    }

    // 1) Ensure a DRIVER USER exists.
    let user = await ctx.db
      .query("users")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    const fallbackPhone = "+1 (555) 010-0000";

    if (!user) {
      const userId = await ctx.db.insert("users", {
        clerkId: "",
        email,
        firstName: (args.firstName ?? "Driver").trim(),
        lastName: (args.lastName ?? "Account").trim(),
        phone: (args.phone ?? fallbackPhone).trim(),
        role: "driver",
        language: "en",
        createdAt: now,
        updatedAt: now,
      });
      user = await ctx.db.get(userId);
    } else {
      const patch: Record<string, unknown> = { updatedAt: now };
      if (user.role !== "driver") patch.role = "driver";
      if (args.firstName && args.firstName.trim()) patch.firstName = args.firstName.trim();
      if (args.lastName && args.lastName.trim()) patch.lastName = args.lastName.trim();
      if (args.phone && args.phone.trim()) patch.phone = args.phone.trim();

      if (Object.keys(patch).length > 1) {
        await ctx.db.patch(user._id, patch);
        user = await ctx.db.get(user._id);
      }
    }

    if (!user) {
      throw new Error("Failed to create driver user");
    }

    // 2) Ensure a DRIVER PROFILE exists and is online.
    let driver = await ctx.db
      .query("drivers")
      .withIndex("by_email", (q) => q.eq("email", email))
      .first();

    const safeKey = (email.split("@")[0] ?? "driver")
      .replace(/[^a-z0-9]/gi, "")
      .slice(0, 8)
      .toUpperCase();

    const baseProfile = {
      clerkId: user.clerkId || user._id,
      email,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone,
      profileImage: user.profileImage,
      status: "active" as const,
      onlineStatus: "online" as const,

      licenseNumber: `MTQ-DEV-${safeKey || "DRIVER"}`,
      licenseExpiry: now + 1000 * 60 * 60 * 24 * 365,
      licensePlate: `DEV ${safeKey.slice(0, 3) || "AAA"} 001`,

      vehicleType: "sedan" as const,
      vehicleMake: "Toyota",
      vehicleModel: "Corolla",
      vehicleYear: 2019,
      vehicleColor: "Black",

      approvedServices: ["taxi"],

      updatedAt: now,
    };

    if (!driver) {
      const driverId = await ctx.db.insert("drivers", {
        ...baseProfile,
        createdAt: now,
      });
      driver = await ctx.db.get(driverId);
    } else {
      await ctx.db.patch(driver._id, baseProfile);
      driver = await ctx.db.get(driver._id);
    }

    if (!driver) {
      throw new Error("Failed to create driver profile");
    }

    return { userId: user._id, driverId: driver._id, email };
  },
});