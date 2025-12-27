import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { format } from "date-fns";

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
      return { success: false, error: "User not authenticated" };
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
    return { success: true, data: instanceId };
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
      return { success: false, error: "User not authenticated" };
    }

    const billInstance = await ctx.db.get(args.id);

    if (!billInstance) {
      return { success: false, error: "Bill instance not found" };
    }

    if (billInstance.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Unauthorized to update this bill instance" };
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
    return { success: true, data: args.id };
  },
});

export const toggleBillInstancePaidStatus = mutation({
  args: {
    id: v.id("billInstances"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const billInstance = await ctx.db.get(args.id);

    if (!billInstance) {
      return { success: false, error: "Bill instance not found" };
    }

    if (billInstance.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Unauthorized to update this bill instance" };
    }

    await ctx.db.patch(args.id, { isPaid: !billInstance.isPaid });
    return { success: true, data: args.id };
  },
});

export const deleteBillInstance = mutation({
  args: {
    id: v.id("billInstances"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const billInstance = await ctx.db.get(args.id);

    if (!billInstance) {
      return { success: false, error: "Bill instance not found" };
    }

    if (billInstance.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Unauthorized to delete this bill instance" };
    }

    await ctx.db.delete(args.id);
    return { success: true, data: args.id };
  },
});

export const getBillInstancesForBill = query({
  args: {
    billId: v.id("bills"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const billInstances = await ctx.db
      .query("billInstances")
      .withIndex("by_bill", (q) => q.eq("billId", args.billId))
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    return { success: true, data: billInstances };
  },
});

export const getAllBillInstancesWithBillNames = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    // Get all bill instances for the user
    const billInstances = await ctx.db
      .query("billInstances")
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    // Get all bills for the user to create a lookup map
    const bills = await ctx.db
      .query("bills")
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    // Get all profiles for the user to create a lookup map
    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    // Create a map of billId to bill info (name and profileId)
    const billInfoMap = new Map();
    bills.forEach((bill) => {
      billInfoMap.set(bill._id, {
        name: bill.name,
        profileId: bill.profileId,
      });
    });

    // Create a map of profileId to profile info (name and color)
    const profileInfoMap = new Map();
    profiles.forEach((profile) => {
      profileInfoMap.set(profile._id, {
        name: profile.name,
        color: profile.color || "#3b82f6",
      });
    });

    // Combine bill instances with bill names and profile info
    const result = billInstances.map((instance) => {
      const billInfo = billInfoMap.get(instance.billId);
      const profileInfo = billInfo
        ? profileInfoMap.get(billInfo.profileId)
        : undefined;

      return {
        ...instance,
        billName: billInfo?.name || "Unknown Bill",
        profileName: profileInfo?.name || "Unknown Profile",
        profileColor: profileInfo?.color || "#3b82f6",
        profileId: billInfo?.profileId || "",
      };
    });

    return { success: true, data: result };
  },
});

export const getBillInstancesByMonth = query({
  args: {
    month: v.string(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const billInstances = await ctx.db
      .query("billInstances")
      .withIndex("by_month_user", (q) =>
        q.eq("month", args.month).eq("userId", identity.tokenIdentifier),
      )
      .collect();

    // Get all bills for the user to create a lookup map
    const bills = await ctx.db
      .query("bills")
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    // Get all profiles for the user to create a lookup map
    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    // Create a map of billId to bill info (name and profileId)
    const billInfoMap = new Map();
    bills.forEach((bill) => {
      billInfoMap.set(bill._id, {
        name: bill.name,
        profileId: bill.profileId,
      });
    });

    // Create a map of profileId to profile name
    const profileNameMap = new Map();
    profiles.forEach((profile) => {
      profileNameMap.set(profile._id, profile.name);
    });

    // Combine bill instances with bill names and profile names
    const result = billInstances.map((instance) => {
      const billInfo = billInfoMap.get(instance.billId);
      const profileName = billInfo
        ? profileNameMap.get(billInfo.profileId)
        : undefined;

      return {
        ...instance,
        billName: billInfo?.name || "Unknown Bill",
        profileName: profileName || "Unknown Profile",
      };
    });

    return { success: true, data: result };
  },
});

export const getBillInstancesWithBillNamesByProfile = query({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    // Get all bills for the specified profile
    const bills = await ctx.db
      .query("bills")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
      .collect();

    // Get all bill instances for these bills
    const billIds = bills.map((bill) => bill._id);
    const allBillInstances = [];

    for (const billId of billIds) {
      const instances = await ctx.db
        .query("billInstances")
        .withIndex("by_bill", (q) => q.eq("billId", billId))
        .filter((q) => q.eq(q.field("userId"), identity.tokenIdentifier))
        .collect();
      allBillInstances.push(...instances);
    }

    // Get profile info
    const profile = await ctx.db.get(args.profileId);
    const profileName = profile?.name || "Unknown Profile";
    const profileColor = profile?.color || "#3b82f6";

    // Create a map of billId to bill name
    const billNameMap = new Map();
    bills.forEach((bill) => {
      billNameMap.set(bill._id, bill.name);
    });

    // Combine bill instances with bill names and profile info
    const result = allBillInstances.map((instance) => {
      return {
        ...instance,
        billName: billNameMap.get(instance.billId) || "Unknown Bill",
        profileName,
        profileColor,
        profileId: args.profileId,
      };
    });

    return { success: true, data: result };
  },
});

export const generateMonthlyBillInstances = internalMutation({
  args: {},
  handler: async (ctx) => {
    const now = new Date();

    // Bill instances are for the PREVIOUS month
    const previousMonthDate = new Date(
      now.getFullYear(),
      now.getMonth() - 1,
      1,
    );
    const billMonth = format(previousMonthDate, "MMMM yyyy");

    // Due date is in the CURRENT month
    const currentMonth = now.getMonth() + 1;
    const currentYear = now.getFullYear();

    // Get all users
    const allBills = await ctx.db.query("bills").collect();

    // Group bills by user
    const billsByUser = new Map();
    allBills.forEach((bill) => {
      if (!billsByUser.has(bill.userId)) {
        billsByUser.set(bill.userId, []);
      }
      billsByUser.get(bill.userId).push(bill);
    });

    // For each user, create bill instances for the previous month
    for (const [userId, userBills] of billsByUser) {
      for (const bill of userBills) {
        // Get all instances for this bill to check for duplicates and get previous amount
        const instances = await ctx.db
          .query("billInstances")
          .withIndex("by_bill", (q) => q.eq("billId", bill._id))
          .collect();

        // Check if instance already exists for the target month
        const existingInstance = instances.find((i) => i.month === billMonth);

        if (!existingInstance) {
          // Find the most recent previous instance to get the amount
          const previousInstances = instances
            .map((i) => {
              const date = new Date(i.month);
              return { ...i, parsedDate: isNaN(date.getTime()) ? null : date };
            })
            .filter((i) => i.parsedDate && i.parsedDate < previousMonthDate)
            .sort((a, b) => b.parsedDate!.getTime() - a.parsedDate!.getTime());

          const amountToUse =
            previousInstances.length > 0 ? previousInstances[0].amount : 0;

          // Create new bill instance
          await ctx.db.insert("billInstances", {
            billId: bill._id,
            month: billMonth,
            amount: amountToUse,
            dueDate: `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String((bill as any).dueDay || 1).padStart(2, "0")}`,
            description: `${bill.name}'s monthly instance for ${billMonth}`,
            isPaid: false,
            userId: userId,
          });
        }
      }
    }
  },
});
