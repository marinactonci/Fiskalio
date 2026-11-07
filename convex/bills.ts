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
    dueDay: v.optional(v.number()),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const profile = await ctx.db.get(args.profileId);
    if (!profile || profile.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Profile not found" };
    }

    const bill = {
      profileId: args.profileId,
      name: args.name,
      eBill: args.eBill,
      dueDay: args.dueDay,
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
      await ctx.db.delete(instance._id);
    }

    await ctx.db.delete(args.id);

    return { success: true, data: args.id };
  },
});

/**
 * Archive or restore a bill. An archived bill keeps all of its instances
 * (calendar, stats, history) but the monthly cron stops opening new ones.
 */
export const setBillArchived = mutation({
  args: { id: v.id("bills"), archived: v.boolean() },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const bill = await ctx.db.get(args.id);

    if (!bill || bill.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Bill not found" };
    }

    await ctx.db.patch(args.id, {
      archivedAt: args.archived ? Date.now() : undefined,
    });
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
    // When true (and no eBill is given), the e-bill details are removed.
    removeEBill: v.optional(v.boolean()),
    dueDay: v.optional(v.number()),
    profileId: v.optional(v.id("profiles")),
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
      eBill?: { link: string; username: string; password: string } | undefined;
      dueDay?: number;
      profileId?: typeof bill.profileId;
    } = {};
    if (args.name !== undefined) {
      updates.name = args.name;
    }
    if (args.eBill !== undefined) {
      updates.eBill = args.eBill;
    } else if (args.removeEBill) {
      updates.eBill = undefined;
    }
    if (args.dueDay !== undefined) {
      updates.dueDay = args.dueDay;
    }
    if (args.profileId !== undefined && args.profileId !== bill.profileId) {
      const profile = await ctx.db.get(args.profileId);
      if (!profile || profile.userId !== identity.tokenIdentifier) {
        return { success: false, error: "Profile not found" };
      }
      updates.profileId = args.profileId;
    }

    await ctx.db.patch(args.id, updates);
    return { success: true, data: args.id };
  },
});
