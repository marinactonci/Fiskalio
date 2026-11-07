import { v } from "convex/values";
import { internalMutation, mutation, query } from "./_generated/server";
import { format } from "date-fns";
import { dayOfISODate, periodNote } from "../lib/format";

export const createBillInstance = mutation({
  args: {
    billId: v.id("bills"),
    month: v.string(),
    amount: v.number(),
    dueDate: v.string(),
    description: v.optional(v.string()),
    // Payment date (ms since epoch); omitted = not paid yet.
    paidAt: v.optional(v.number()),
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
      isPaid: args.paidAt !== undefined,
      paidAt: args.paidAt,
      isEstimated: false,
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
    // Payment date (ms since epoch); null clears it and marks the instance
    // unpaid. Takes precedence over `isPaid`.
    paidAt: v.optional(v.union(v.number(), v.null())),
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
      isEstimated: boolean;
      paidAt: number | undefined;
    }> = {};
    if (args.month !== undefined) {
      updates.month = args.month;
    }
    if (args.amount !== undefined) {
      updates.amount = args.amount;
      // Any amount the user saves is a confirmed amount, not the cron's copy.
      updates.isEstimated = false;
    }
    if (args.dueDate !== undefined) {
      updates.dueDate = args.dueDate;
    }
    if (args.description !== undefined) {
      updates.description = args.description;
    }
    if (args.paidAt !== undefined) {
      updates.isPaid = args.paidAt !== null;
      updates.paidAt = args.paidAt ?? undefined;
    } else if (args.isPaid !== undefined && args.isPaid !== billInstance.isPaid) {
      updates.isPaid = args.isPaid;
      updates.paidAt = args.isPaid ? Date.now() : undefined;
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

    const isPaid = !billInstance.isPaid;
    await ctx.db.patch(args.id, {
      isPaid,
      paidAt: isPaid ? Date.now() : undefined,
    });
    return { success: true, data: args.id };
  },
});

export const setPaid = mutation({
  args: {
    id: v.id("billInstances"),
    isPaid: v.boolean(),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const billInstance = await ctx.db.get(args.id);

    if (!billInstance || billInstance.userId !== identity.tokenIdentifier) {
      return { success: false, error: "Bill instance not found" };
    }

    if (billInstance.isPaid !== args.isPaid) {
      await ctx.db.patch(args.id, {
        isPaid: args.isPaid,
        paidAt: args.isPaid ? Date.now() : undefined,
      });
    }
    return { success: true, data: args.id };
  },
});

/**
 * Everything the app views need in one round trip: profiles, bills (without
 * e-bill credentials) and all bill instances of the signed-in user. Filtering,
 * grouping and statistics happen on the client so every view shares the same
 * filter model.
 */
export const getOverview = query({
  args: {},
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false as const, error: "User not authenticated" };
    }

    const userId = identity.tokenIdentifier;

    const [profiles, bills, instances] = await Promise.all([
      ctx.db
        .query("profiles")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("bills")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
      ctx.db
        .query("billInstances")
        .withIndex("by_userId", (q) => q.eq("userId", userId))
        .collect(),
    ]);

    return {
      success: true as const,
      data: {
        profiles: profiles.map((p) => ({
          _id: p._id,
          _creationTime: p._creationTime,
          name: p.name,
          color: p.color || "#3360E0",
          address: p.address,
        })),
        bills: bills.map((b) => ({
          _id: b._id,
          _creationTime: b._creationTime,
          profileId: b.profileId,
          name: b.name,
          dueDay: b.dueDay,
          archivedAt: b.archivedAt,
          hasEBill: !!b.eBill,
          eBillLink: b.eBill?.link || undefined,
        })),
        instances: instances.map((i) => ({
          _id: i._id,
          _creationTime: i._creationTime,
          billId: i.billId,
          month: i.month,
          amount: i.amount,
          dueDate: i.dueDate,
          description: i.description,
          isPaid: i.isPaid,
          isEstimated: i.isEstimated ?? false,
          paidAt: i.paidAt,
        })),
      },
    };
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
        // Archived bills keep their history but get no new instances.
        if (bill.archivedAt) continue;

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

          const lastInstance = previousInstances[0];
          const amountToUse = lastInstance ? lastInstance.amount : 0;

          // Due day: the bill's fixed day if set, else the day of last
          // month's instance, else the 1st. Clamped to the length of the
          // current month (e.g. 31 → 30).
          const daysInMonth = new Date(currentYear, currentMonth, 0).getDate();
          const wantedDay =
            bill.dueDay ?? dayOfISODate(lastInstance?.dueDate) ?? 1;
          const dueDay = Math.min(Math.max(wantedDay, 1), daysInMonth);

          // Create new bill instance; the amount is last month's copy until
          // the user confirms it.
          await ctx.db.insert("billInstances", {
            billId: bill._id,
            month: billMonth,
            amount: amountToUse,
            dueDate: `${currentYear}-${String(currentMonth).padStart(2, "0")}-${String(dueDay).padStart(2, "0")}`,
            description: periodNote(previousMonthDate),
            isPaid: false,
            isEstimated: true,
            userId: userId,
          });
        }
      }
    }
  },
});
