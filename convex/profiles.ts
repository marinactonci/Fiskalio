import { query, mutation } from "./_generated/server";
import { v } from "convex/values";

export const createProfile = mutation({
  args: {
    name: v.string(),
    address: v.object({
      street: v.string(),
      city: v.string(),
      country: v.string(),
    }),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const profile = {
      name: args.name,
      address: args.address,
      color: args.color,
      userId: identity.tokenIdentifier,
      billCount: 0, // Will be computed dynamically in queries
    };

    const profileId = await ctx.db.insert("profiles", profile);

    return { success: true, data: profileId };
  },
});

export const getProfilesForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();

    // For each profile, get the actual count of bills
    const profilesWithCount = await Promise.all(
      profiles.map(async (profile) => {
        const bills = await ctx.db
          .query("bills")
          .withIndex("by_profile", (q) => q.eq("profileId", profile._id))
          .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
          .collect();

        return {
          ...profile,
          billCount: bills.length,
        };
      })
    );

    return { success: true, data: profilesWithCount };
  },
});

export const getProfile = query({
  args: {
    id: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const profile = await ctx.db.get(args.id);

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    // Get the actual count of bills for this profile
    const bills = await ctx.db
      .query("bills")
      .withIndex("by_profile", (q) => q.eq("profileId", args.id))
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    return {
      success: true,
      data: {
        ...profile,
        billCount: bills.length,
      },
    };
  },
});

export const updateProfile = mutation({
  args: {
    id: v.id("profiles"),
    name: v.optional(v.string()),
    address: v.optional(
      v.object({
        street: v.string(),
        city: v.string(),
        country: v.string(),
      }),
    ),
    color: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const profile = await ctx.db.get(args.id);

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    if (profile.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Unauthorized to update this profile" };
    }

    const updatedProfile = await ctx.db.patch(args.id, {
      ...profile,
      name: args.name ?? profile.name,
      address: args.address ?? profile.address,
      color: args.color ?? profile.color,
    });

    return { success: true, data: updatedProfile };
  },
});

export const updateProfileColor = mutation({
  args: {
    id: v.id("profiles"),
    color: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const profile = await ctx.db.get(args.id);

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    if (profile.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Unauthorized to update this profile" };
    }

    const updatedProfile = await ctx.db.patch(args.id, {
      color: args.color,
    });

    return { success: true, data: updatedProfile };
  },
});

export const deleteProfile = mutation({
  args: {
    id: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const profile = await ctx.db.get(args.id);

    if (!profile) {
      return { success: false, error: "Profile not found" };
    }

    if (profile.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Unauthorized to delete this profile" };
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
