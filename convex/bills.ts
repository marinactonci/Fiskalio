import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createBillForProfile = mutation({
  args: {
    profileId: v.id("profiles"),
    name: v.string(),
    eBill: v.optional(
      v.object({
        link: v.string(),
        username: v.string(),
        password: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const bill = {
      profileId: args.profileId,
      name: args.name,
      eBill: args.eBill,
      userId: identity.tokenIdentifier,
      billInstanceCount: 0, // Will be computed dynamically in queries
    };

    const billId = await ctx.db.insert("bills", bill);

    return { success: true, data: billId };
  },
});

export const getBillsForProfile = query({
  args: { profileId: v.id("profiles") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const bills = await ctx.db
      .query("bills")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    // For each bill, get the actual count of bill instances
    const billsWithCount = await Promise.all(
      bills.map(async (bill) => {
        const instances = await ctx.db
          .query("billInstances")
          .withIndex("by_bill", (q) => q.eq("billId", bill._id))
          .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
          .collect();

        return {
          ...bill,
          billInstanceCount: instances.length,
        };
      })
    );

    return { success: true, data: billsWithCount };
  },
});

export const getBill = query({
  args: { id: v.id("bills") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const bill = await ctx.db.get(args.id);

    if (!bill) {
      return { success: false, error: "Bill not found" };
    }

    if (bill.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Unauthorized to access this bill" };
    }

    // Get the actual count of bill instances
    const instances = await ctx.db
      .query("billInstances")
      .withIndex("by_bill", (q) => q.eq("billId", args.id))
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    return {
      success: true,
      data: {
        ...bill,
        billInstanceCount: instances.length,
      },
    };
  },
});

export const deleteBill = mutation({
  args: { id: v.id("bills") },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const bill = await ctx.db.get(args.id);

    if (!bill) {
      return { success: false, error: "Bill not found" };
    }

    if (bill.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Unauthorized to delete this bill" };
    }

    // Delete all associated bill instances first
    const billInstances = await ctx.db
      .query("billInstances")
      .withIndex("by_bill", (q) => q.eq("billId", args.id))
      .collect();

    for (const instance of billInstances) {
      ctx.db.delete(instance._id);
    }

    await ctx.db.delete(args.id);

    return { success: true, data: args.id };
  },
});

export const updateBill = mutation({
  args: {
    id: v.id("bills"),
    name: v.optional(v.string()),
    eBill: v.optional(
      v.object({
        link: v.string(),
        username: v.string(),
        password: v.string(),
      }),
    ),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const bill = await ctx.db.get(args.id);

    if (!bill) {
      return { success: false, error: "Bill not found" };
    }

    if (bill.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Unauthorized to update this bill" };
    }

    const updates: {
      name?: string;
      eBill?: { link: string; username: string; password: string };
    } = {};
    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.eBill !== undefined) {
      updates.eBill = args.eBill;
    }

    await ctx.db.patch(args.id, updates);
    return { success: true, data: args.id };
  },
});
