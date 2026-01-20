import { mutation } from "./_generated/server";
import { v } from "convex/values";

/**
* Driver + Rider apps sometimes prefer a dedicated "authActions" module.
*
* This project already has auth-ish mutations in `convex/users.ts` (signup/login),
* but we expose a thin, stable surface here so either app can depend on it without
* importing `users.ts` directly.
*
* NOTE: This is NOT production-grade authentication (passwords are not validated here).
* Treat this as an early-stage identity layer until Clerk/@convex-dev/auth is integrated.
*/

export const signUp = mutation({
args: {
email: v.string(),
password: v.optional(v.string()),
firstName: v.string(),
lastName: v.string(),
phone: v.string(),
role: v.optional(v.union(v.literal("user"), v.literal("driver"), v.literal("restaurant"))),
language: v.union(v.literal("en"), v.literal("fr")),
},
returns: v.object({
userId: v.id("users"),
role: v.union(v.literal("user"), v.literal("driver"), v.literal("restaurant"), v.literal("admin")),
email: v.string(),
firstName: v.string(),
lastName: v.string(),
}),
handler: async (ctx, args) => {
const existing = await ctx.db
.query("users")
.withIndex("by_email", (q) => q.eq("email", args.email))
.first();

if (existing) {
throw new Error("User already exists with this email");
}

const now = Date.now();

const userId = await ctx.db.insert("users", {
clerkId: "",
email: args.email,
firstName: args.firstName,
lastName: args.lastName,
phone: args.phone,
role: args.role ?? "user",
language: args.language,
createdAt: now,
updatedAt: now,
});

const user = await ctx.db.get(userId);
if (!user) throw new Error("Failed to create user");

return {
userId: user._id,
role: user.role,
email: user.email,
firstName: user.firstName,
lastName: user.lastName,
};
},
});

export const signIn = mutation({
args: {
email: v.string(),
password: v.optional(v.string()),
},
returns: v.object({
userId: v.id("users"),
role: v.union(v.literal("user"), v.literal("driver"), v.literal("restaurant"), v.literal("admin")),
email: v.string(),
firstName: v.string(),
lastName: v.string(),
}),
handler: async (ctx, args) => {
const user = await ctx.db
.query("users")
.withIndex("by_email", (q) => q.eq("email", args.email))
.first();

if (!user) {
throw new Error("User not found");
}

// NOTE: Password validation intentionally not implemented yet.
// This mirrors `users.login` which is currently a lightweight identity lookup.

return {
userId: user._id,
role: user.role,
email: user.email,
firstName: user.firstName,
lastName: user.lastName,
};
},
});

export const signOut = mutation({
args: {},
returns: v.null(),
handler: async () => {
// Client-side session storage handles sign-out in this project.
return null;
},
});
