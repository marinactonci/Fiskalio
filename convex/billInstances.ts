import { v } from "convex/values";
import { mutation, query } from "./_generated/server";

export const createBillInstance = mutation({
  args: {
    billId: v.id("bills"),
    month: v.string(),
    amount: v.number(),
    dueDate: v.string(),
    description: v.optional(v.string()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated");
    }

    const billInstance = {
      billId: args.billId,
      month: args.month,
      amount: args.amount,
      dueDate: args.dueDate,
      description: args.description,
      isPaid: false,
      userId: identity.tokenIdentifier,
    };

    const instanceId = await ctx.db.insert("billInstances", billInstance);
    return instanceId;
  },
});

export const updateBillInstance = mutation({
  args: {
    id: v.id("billInstances"),
    month: v.optional(v.string()),
    amount: v.optional(v.number()),
    dueDate: v.optional(v.string()),
    description: v.optional(v.string()),
    isPaid: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated");
    }

    const billInstance = await ctx.db.get(args.id);

    if (!billInstance) {
      throw new Error("Bill instance not found");
    }

    if (billInstance.userId !== identity.tokenIdentifier) {
      throw new Error("Unauthorized to update this bill instance");
    }

    const updates: Partial<{
      month: string;
      amount: number;
      dueDate: string;
      description: string;
      isPaid: boolean;
    }> = {};
    if (args.month !== undefined) {
      updates.month = args.month;
    }
    if (args.amount !== undefined) {
      updates.amount = args.amount;
    }
    if (args.dueDate !== undefined) {
      updates.dueDate = args.dueDate;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }
    if (args.isPaid !== undefined) {
      updates.isPaid = args.isPaid;
    }

    await ctx.db.patch(args.id, updates);
    return args.id;
  },
});

export const toggleBillInstancePaidStatus = mutation({
  args: {
    id: v.id("billInstances"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated");
    }

    const billInstance = await ctx.db.get(args.id);

    if (!billInstance) {
      throw new Error("Bill instance not found");
    }

    if (billInstance.userId !== identity.tokenIdentifier) {
      throw new Error("Unauthorized to update this bill instance");
    }

    await ctx.db.patch(args.id, { isPaid: !billInstance.isPaid });
    return args.id;
  },
});

export const deleteBillInstance = mutation({
  args: {
    id: v.id("billInstances"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated");
    }

    const billInstance = await ctx.db.get(args.id);

    if (!billInstance) {
      throw new Error("Bill instance not found");
    }

    if (billInstance.userId !== identity.tokenIdentifier) {
      throw new Error("Unauthorized to delete this bill instance");
    }

    await ctx.db.delete(args.id);
    return args.id;
  },
});

export const getBillInstancesForBill = query({
  args: {
    billId: v.id("bills"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      throw new Error("User not authenticated");
    }

    const billInstances = await ctx.db
      .query("billInstances")
      .withIndex("by_bill", (q) => q.eq("billId", args.billId))
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    return billInstances;
  },
});
