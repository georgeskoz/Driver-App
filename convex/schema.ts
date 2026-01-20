import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  // User profiles
  users: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    role: v.union(v.literal("user"), v.literal("driver"), v.literal("restaurant"), v.literal("admin")),
    profileImage: v.optional(v.string()),
    profileImageStorageId: v.optional(v.union(v.id("_storage"), v.null())),
    isPhoneVerified: v.optional(v.boolean()),
    country: v.optional(v.string()),
    state: v.optional(v.string()),
    city: v.optional(v.string()),
    address: v.optional(v.string()),
    language: v.union(v.literal("en"), v.literal("fr")),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_role", ["role"]),

  // Orders (rides, deliveries, food orders)
  orders: defineTable({
    userId: v.id("users"),
    mode: v.union(v.literal("ride"), v.literal("delivery"), v.literal("food")),
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

    // Location info
    pickupAddress: v.string(),
    pickupLat: v.number(),
    pickupLng: v.number(),
    dropoffAddress: v.string(),
    dropoffLat: v.number(),
    dropoffLng: v.number(),

    // Delivery specific
    packageSize: v.optional(v.union(
      v.literal("small"),
      v.literal("medium"),
      v.literal("large"),
      v.literal("extra-large")
    )),
    weightKg: v.optional(v.number()),
    packageLength: v.optional(v.number()),
    packageWidth: v.optional(v.number()),
    packageHeight: v.optional(v.number()),
    packageContents: v.optional(v.string()),
    shareable: v.optional(v.boolean()),

    // Ride specific
    vehicleType: v.optional(v.union(
      v.literal("sedan"),
      v.literal("van"),
      v.literal("economy"),
      v.literal("comfort"),
      v.literal("premium"),
      v.literal("xl")
    )),

    // Payment & pricing
    paymentMethod: v.union(v.literal("card"), v.literal("cash"), v.literal("apple_pay"), v.literal("google_pay")),
    paymentBrand: v.optional(v.string()),
    paymentLast4: v.optional(v.string()),
    paidAt: v.optional(v.number()),

    // Promotions (optional)
    promotionId: v.optional(v.id("promotions")),
    promoCode: v.optional(v.string()),
    promoDiscountAmount: v.optional(v.number()),
    originalEstimatedFare: v.optional(v.number()),

    estimatedFare: v.number(),
    actualFare: v.optional(v.number()),
    taxAmount: v.optional(v.number()),
    tipAmount: v.optional(v.number()),

    // Quebec receipt/tax fields (optional; snapshot at payment time)
    regulatoryFeeAmount: v.optional(v.number()),
    gstAmount: v.optional(v.number()),
    qstAmount: v.optional(v.number()),
    gstRatePercent: v.optional(v.number()),
    qstRatePercent: v.optional(v.number()),

    // Receipt fields (optional now; the driver app will populate these over time)
    receiptNumber: v.optional(v.string()),
    driverNameSnapshot: v.optional(v.string()),
    vehicleIdSnapshot: v.optional(v.string()),
    durationMins: v.optional(v.number()),
    distanceKm: v.optional(v.number()),

    // Professional fare breakdown (optional)
    fareBase: v.optional(v.number()),
    fareDistanceTime: v.optional(v.number()),
    fareTolls: v.optional(v.number()),
    taxRatePercent: v.optional(v.number()),

    transactionStatus: v.optional(
      v.union(v.literal("approved"), v.literal("pending"), v.literal("declined"))
    ),

    // Driver assignment
    driverId: v.optional(v.id("drivers")),
    assignedAt: v.optional(v.number()),
    pickupPhotoUrl: v.optional(v.string()),
    deliveryPhotoUrl: v.optional(v.string()),

    // Timestamps
    createdAt: v.number(),
    startedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
    scheduledAt: v.optional(v.number()),
    updatedAt: v.optional(v.number()),

    // Matching / dispatch
    matchingAttemptCount: v.optional(v.number()),
    lastMatchAttemptAt: v.optional(v.number()),
    nextMatchAttemptAt: v.optional(v.number()),

    // Optional per-trip matching config (used by trips.dispatchCreateTrip)
    offerTtlMs: v.optional(v.number()),
    maxDriversToOffer: v.optional(v.number()),

    // Rating
    rating: v.optional(v.number()),
    review: v.optional(v.string()),
  })
    .index("by_user_id", ["userId"])
    .index("by_driver_id", ["driverId"])
    .index("by_status", ["status"])
    .index("by_mode", ["mode"]),

  // Driver profiles
  drivers: defineTable({
    clerkId: v.string(),
    email: v.string(),
    firstName: v.string(),
    lastName: v.string(),
    phone: v.string(),
    profileImage: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("active"), v.literal("suspended"), v.literal("rejected")),
    onlineStatus: v.union(v.literal("offline"), v.literal("online"), v.literal("on_trip")),
    
    // Documents
    licenseNumber: v.string(),
    licenseExpiry: v.number(),
    licensePhotoUrl: v.optional(v.string()),
    licenseVerified: v.optional(v.boolean()),
    
    // Vehicle
    vehicleType: v.union(v.literal("sedan"), v.literal("suv"), v.literal("van"), v.literal("truck"), v.literal("motorcycle")),
    vehicleMake: v.optional(v.string()),
    vehicleModel: v.optional(v.string()),
    vehicleYear: v.optional(v.number()),
    vehicleColor: v.optional(v.string()),
    licensePlate: v.string(),
    vehicleRegistrationUrl: v.optional(v.string()),
    vehicleRegistrationVerified: v.optional(v.boolean()),
    insuranceUrl: v.optional(v.string()),
    insuranceVerified: v.optional(v.boolean()),
    
    // Services
    approvedServices: v.array(v.union(v.literal("taxi"), v.literal("courier"), v.literal("food"))),
    
    // Bank account
    bankName: v.optional(v.string()),
    accountHolder: v.optional(v.string()),
    accountNumber: v.optional(v.string()),
    routingNumber: v.optional(v.string()),
    accountType: v.optional(v.union(v.literal("checking"), v.literal("savings"))),
    
    // Tax info (Canada)
    gstNumber: v.optional(v.string()),
    qstNumber: v.optional(v.string()),
    billingNumber: v.optional(v.string()),
    
    // Stats
    rating: v.optional(v.number()),
    totalTrips: v.optional(v.number()),
    totalEarnings: v.optional(v.number()),
    acceptanceRate: v.optional(v.number()),
    
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_clerk_id", ["clerkId"])
    .index("by_email", ["email"])
    .index("by_status", ["status"])
    .index("by_status_and_online_status", ["status", "onlineStatus"]),

  // Vehicle inspections
  vehicleInspections: defineTable({
    driverId: v.id("drivers"),
    submittedByUserId: v.id("users"),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    odometerKm: v.optional(v.number()),
    notes: v.optional(v.string()),
    photoUrls: v.array(v.string()),
    reviewNote: v.optional(v.string()),
    reviewedAt: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_driver_id", ["driverId"])
    .index("by_status", ["status"])
    .index("by_driver_id_and_status", ["driverId", "status"]),

  // Driver locations (real-time)
  driverLocations: defineTable({
    driverId: v.id("drivers"),
    latitude: v.number(),
    longitude: v.number(),
    heading: v.optional(v.number()),
    speed: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_driver_id", ["driverId"])
    .index("by_driver_id_and_created_at", ["driverId", "createdAt"]),

  // Order assignments
  assignments: defineTable({
    orderId: v.id("orders"),
    driverId: v.id("drivers"),
    status: v.union(v.literal("offered"), v.literal("accepted"), v.literal("rejected"), v.literal("expired")),
    offeredAt: v.number(),
    acceptedAt: v.optional(v.number()),
    rejectedAt: v.optional(v.number()),
    expiresAt: v.number(),
  })
    .index("by_driver_id", ["driverId"])
    .index("by_order_id", ["orderId"])
    .index("by_status", ["status"]),

  // Order messages (chat)
  orderMessages: defineTable({
    orderId: v.id("orders"),
    senderId: v.id("users"),
    senderType: v.union(v.literal("customer"), v.literal("driver")),
    message: v.string(),
    createdAt: v.number(),
  })
    .index("by_order_id", ["orderId"]),

  // Restaurants
  restaurants: defineTable({
    ownerId: v.id("users"),
    name: v.string(),
    description: v.optional(v.string()),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    phone: v.string(),
    email: v.string(),
    cuisineTypes: v.array(v.string()),
    logoUrl: v.optional(v.string()),
    status: v.union(v.literal("pending"), v.literal("approved"), v.literal("rejected")),
    isActive: v.boolean(),
    rating: v.optional(v.number()),
    totalOrders: v.optional(v.number()),
    commissionRate: v.optional(v.number()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_owner_id", ["ownerId"])
    .index("by_status", ["status"]),

  // Menu categories
  menuCategories: defineTable({
    restaurantId: v.id("restaurants"),
    name: v.string(),
    displayOrder: v.number(),
    createdAt: v.number(),
  })
    .index("by_restaurant_id", ["restaurantId"]),

  // Menu items
  menuItems: defineTable({
    restaurantId: v.id("restaurants"),
    categoryId: v.id("menuCategories"),
    name: v.string(),
    description: v.optional(v.string()),
    price: v.number(),
    imageUrl: v.optional(v.string()),
    isAvailable: v.boolean(),
    isVegetarian: v.optional(v.boolean()),
    isGlutenFree: v.optional(v.boolean()),
    calories: v.optional(v.number()),
    allergens: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_restaurant_id", ["restaurantId"])
    .index("by_category_id", ["categoryId"]),

  // Food orders
  foodOrders: defineTable({
    restaurantId: v.id("restaurants"),
    customerId: v.id("users"),
    status: v.union(
      v.literal("pending"),
      v.literal("accepted"),
      v.literal("preparing"),
      v.literal("ready"),
      v.literal("picked_up"),
      v.literal("delivered"),
      v.literal("cancelled")
    ),
    subtotal: v.number(),
    deliveryFee: v.number(),
    taxAmount: v.number(),
    totalAmount: v.number(),
    orderType: v.union(v.literal("delivery"), v.literal("pickup")),
    driverId: v.optional(v.id("drivers")),
    specialInstructions: v.optional(v.string()),
    createdAt: v.number(),
    acceptedAt: v.optional(v.number()),
    completedAt: v.optional(v.number()),
  })
    .index("by_restaurant_id", ["restaurantId"])
    .index("by_customer_id", ["customerId"])
    .index("by_driver_id", ["driverId"])
    .index("by_status", ["status"]),

  // Food order items
  foodOrderItems: defineTable({
    foodOrderId: v.id("foodOrders"),
    menuItemId: v.id("menuItems"),
    name: v.string(),
    quantity: v.number(),
    unitPrice: v.number(),
    totalPrice: v.number(),
    specialInstructions: v.optional(v.string()),
    modifiers: v.optional(v.array(v.object({
      name: v.string(),
      price: v.number(),
    }))),
  })
    .index("by_food_order_id", ["foodOrderId"]),

  // Favorite locations
  favoriteLocations: defineTable({
    userId: v.id("users"),
    label: v.union(v.literal("home"), v.literal("work"), v.literal("other")),
    address: v.string(),
    latitude: v.number(),
    longitude: v.number(),
    createdAt: v.number(),
  })
    .index("by_user_id", ["userId"]),

  // Saved addresses (multi pickup/dropoff address book)
  savedAddresses: defineTable({
    userId: v.id("users"),
    kind: v.union(v.literal("pickup"), v.literal("dropoff")),
    label: v.string(),
    address: v.string(),
    latitude: v.optional(v.number()),
    longitude: v.optional(v.number()),
    notes: v.optional(v.string()),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_kind", ["userId", "kind"]),

  // Payment methods (non-sensitive metadata only; no full card numbers/CVV stored)
  paymentMethods: defineTable({
    userId: v.id("users"),
    type: v.literal("card"),
    cardSubtype: v.union(v.literal("credit"), v.literal("debit")),
    brand: v.string(),
    last4: v.string(),
    expMonth: v.number(),
    expYear: v.number(),
    nickname: v.optional(v.string()),
    billingPostalCode: v.optional(v.string()),
    isDefault: v.boolean(),

    // For future payment provider integration (e.g., Stripe)
    provider: v.optional(v.union(v.literal("manual_test"), v.literal("stripe"))),
    providerPaymentMethodId: v.optional(v.string()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_default", ["userId", "isDefault"]),

  // Payouts
  payouts: defineTable({
    driverId: v.id("drivers"),
    period: v.string(), // "2024-01-01_2024-01-07"
    grossAmount: v.number(),
    commission: v.number(),
    tax: v.number(),
    netAmount: v.number(),
    status: v.union(v.literal("pending"), v.literal("processed")),
    processedAt: v.optional(v.number()),
    createdAt: v.number(),
  })
    .index("by_driver_id", ["driverId"])
    .index("by_status", ["status"]),

  // Ratings & reviews
  ratings: defineTable({
    orderId: v.id("orders"),
    driverId: v.id("drivers"),
    customerId: v.id("users"),
    rating: v.number(), // 1-5
    review: v.optional(v.string()),
    issueTagCodes: v.optional(v.array(v.string())),
    createdAt: v.number(),
  })
    .index("by_driver_id", ["driverId"])
    .index("by_order_id", ["orderId"]),

  // Customer (rider) ratings (typically left by drivers).
  // This powers the customer's "rider rating" badge in Account settings.
  customerRatings: defineTable({
    orderId: v.id("orders"),
    driverId: v.id("drivers"),
    customerId: v.id("users"),
    rating: v.number(), // 1-5
    note: v.optional(v.string()),
    createdAt: v.number(),
  })
    .index("by_customer_id", ["customerId"])
    .index("by_order_id", ["orderId"])
    .index("by_driver_id", ["driverId"]),

  // Configurable rating issue tags (admin-managed)
  ratingIssueTags: defineTable({
    code: v.string(),
    labelEn: v.string(),
    labelFr: v.string(),
    active: v.boolean(),
    sortOrder: v.number(),
    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_active", ["active"]) 
    .index("by_active_and_sort", ["active", "sortOrder"]),

  // Promotions (admin-managed)
  promotions: defineTable({
    code: v.string(),
    titleEn: v.string(),
    titleFr: v.string(),
    descriptionEn: v.optional(v.string()),
    descriptionFr: v.optional(v.string()),

    // Discount type
    discountType: v.union(v.literal("percent"), v.literal("amount")),
    discountValue: v.number(),

    // Constraints
    isActive: v.boolean(),
    startsAt: v.optional(v.number()),
    endsAt: v.optional(v.number()),
    maxUsesTotal: v.optional(v.number()),
    maxUsesPerUser: v.optional(v.number()),

    createdAt: v.number(),
    updatedAt: v.number(),
  })
    .index("by_code", ["code"])
    .index("by_active", ["isActive"])
    .index("by_active_and_starts_at", ["isActive", "startsAt"]),

  // Promotion redemptions (one row per usage)
  promotionRedemptions: defineTable({
    promotionId: v.id("promotions"),
    userId: v.id("users"),
    orderId: v.id("orders"),
    createdAt: v.number(),
  })
    .index("by_promotion_id", ["promotionId"])
    .index("by_user_id", ["userId"])
    .index("by_user_id_and_promotion_id", ["userId", "promotionId"])
    .index("by_order_id", ["orderId"]),

  // Billing settings (admin-managed; used for receipts/taxes)
  billingSettings: defineTable({
    key: v.string(), // e.g. "default"
    currency: v.string(), // e.g. "CAD"

    // Rates are stored as decimals (e.g. 0.05 == 5%)
    gstRate: v.number(),
    qstRate: v.number(),

    // Quebec "Redevance" (non-taxable). Stored as dollars.
    regulatoryFeeAmount: v.number(),

    // Feature flags
    applyRegulatoryFeeToRides: v.boolean(),

    updatedAt: v.number(),
  })
    .index("by_key", ["key"]),

});