import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const list = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false as const, error: "User not authenticated" };
    }
    const views = await ctx.db
      .query("savedViews")
      .withIndex("by_userId", (q) => q.eq("userId", identity.tokenIdentifier))
      .collect();
    return { success: true as const, data: views };
  },
});

export const create = mutation({
  args: { name: v.string(), query: v.string() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false as const, error: "User not authenticated" };
    }
    const name = args.name.trim();
    if (!name) {
      return { success: false as const, error: "Name is required" };
    }
    const id = await ctx.db.insert("savedViews", {
      userId: identity.tokenIdentifier,
      name: name.slice(0, 60),
      query: args.query,
    });
    return { success: true as const, data: id };
  },
});

export const remove = mutation({
  args: { id: v.id("savedViews") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) {
      return { success: false as const, error: "User not authenticated" };
    }
    const view = await ctx.db.get(args.id);
    if (!view || view.userId !== identity.tokenIdentifier) {
      return { success: false as const, error: "View not found" };
    }
    await ctx.db.delete(args.id);
    return { success: true as const, data: args.id };
  },
});
