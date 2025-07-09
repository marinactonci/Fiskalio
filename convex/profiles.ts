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
      throw new Error("User not authenticated");
    }

    const profile = {
      name: args.name,
      address: args.address,
      color: args.color,
      userId: identity.tokenIdentifier,
      billCount: 0,
    };

    const profileId = await ctx.db.insert("profiles", profile);

    return profileId;
  },
});

export const getProfilesForUser = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated");
    }

    const profiles = await ctx.db
      .query("profiles")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();

    return profiles;
  },
});

export const getProfile = query({
  args: {
    id: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db.get(args.id);

    if (!profile) {
      throw new Error("Profile not found");
    }

    return profile;
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
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db.get(args.id);

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.userId !== identity.tokenIdentifier) {
      throw new Error("Unauthorized to update this profile");
    }

    const updatedProfile = await ctx.db.patch(args.id, {
      ...profile,
      name: args.name ?? profile.name,
      address: args.address ?? profile.address,
      color: args.color ?? profile.color,
    });

    return updatedProfile;
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
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db.get(args.id);

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.userId !== identity.tokenIdentifier) {
      throw new Error("Unauthorized to update this profile");
    }

    const updatedProfile = await ctx.db.patch(args.id, {
      color: args.color,
    });

    return updatedProfile;
  },
});

export const deleteProfile = mutation({
  args: {
    id: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated");
    }

    const profile = await ctx.db.get(args.id);

    if (!profile) {
      throw new Error("Profile not found");
    }

    if (profile.userId !== identity.tokenIdentifier) {
      throw new Error("Unauthorized to delete this profile");
    }

    await ctx.db.delete(args.id);
    return { success: true };
  },
});
