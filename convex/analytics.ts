import { v } from "convex/values";
import { query } from "./_generated/server";

// Get analytics data for all profiles
export const getAnalyticsData = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = identity.tokenIdentifier;

    // Get all profiles for the user
    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get all bills for the user
    const bills = await ctx.db
      .query("bills")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get all bill instances for the user
    const billInstances = await ctx.db
      .query("billInstances")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Calculate total statistics
    const totalProfiles = profiles.length;
    const totalBills = bills.length;
    const totalBillInstances = billInstances.length;
    const paidBillInstances = billInstances.filter(instance => instance.isPaid).length;
    const unpaidBillInstances = totalBillInstances - paidBillInstances;
    const totalAmount = billInstances.reduce((sum, instance) => sum + instance.amount, 0);
    const paidAmount = billInstances
      .filter(instance => instance.isPaid)
      .reduce((sum, instance) => sum + instance.amount, 0);
    const unpaidAmount = totalAmount - paidAmount;

    return {
      success: true,
      data: {
        totalProfiles,
        totalBills,
        totalBillInstances,
        paidBillInstances,
        unpaidBillInstances,
        totalAmount,
        paidAmount,
        unpaidAmount,
      }
    };
  },
});

// Get monthly cost data for all profiles
export const getMonthlyCostData = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = identity.tokenIdentifier;

    // Get all profiles for the user
    const profiles = await ctx.db
      .query("profiles")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get all bills for the user
    const bills = await ctx.db
      .query("bills")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get all bill instances for the user
    const billInstances = await ctx.db
      .query("billInstances")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Create a map of billId to profileId
    const billToProfileMap = new Map();
    bills.forEach(bill => {
      billToProfileMap.set(bill._id, bill.profileId);
    });

    // Create a map of profileId to profile name
    const profileNameMap = new Map();
    profiles.forEach(profile => {
      profileNameMap.set(profile._id, profile.name);
    });

    // Group bill instances by month and profile
    const monthlyData = new Map();

    billInstances.forEach(instance => {
      const profileId = billToProfileMap.get(instance.billId);
      const profileName = profileNameMap.get(profileId) || "Unknown Profile";
      const month = instance.month;

      if (!monthlyData.has(month)) {
        monthlyData.set(month, new Map());
      }

      const monthData = monthlyData.get(month);
      if (!monthData.has(profileName)) {
        monthData.set(profileName, 0);
      }

      monthData.set(profileName, monthData.get(profileName) + instance.amount);
    });

    // Convert to array format suitable for charts
    const result: Array<{ month: string; total: number; [key: string]: number | string }> = [];
    const sortedMonths = Array.from(monthlyData.keys()).sort();
    const allProfiles = Array.from(new Set(profiles.map(p => p.name)));

    sortedMonths.forEach(month => {
      const monthData = monthlyData.get(month);
      const dataPoint: { month: string; total: number; [key: string]: number | string } = { month, total: 0 };
      let total = 0;

      allProfiles.forEach(profileName => {
        const amount = monthData?.get(profileName) || 0;
        dataPoint[profileName] = amount;
        total += amount;
      });

      dataPoint.total = total;
      result.push(dataPoint);
    });

    return {
      success: true,
      data: {
        monthlyData: result,
        profiles: allProfiles,
      }
    };
  },
});

// Get profile-specific monthly cost data
export const getProfileMonthlyCostData = query({
  args: {
    profileId: v.id("profiles"),
  },
  handler: async (ctx, args) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = identity.tokenIdentifier;

    // Get the specific profile
    const profile = await ctx.db.get(args.profileId);
    if (!profile || profile.userId !== userId) {
      return { success: false, error: "Profile not found or access denied" };
    }

    // Get all bills for this profile
    const bills = await ctx.db
      .query("bills")
      .withIndex("by_profile", (q) => q.eq("profileId", args.profileId))
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Get all bill instances for these bills
    const billIds = bills.map(bill => bill._id);
    const allBillInstances = [];

    for (const billId of billIds) {
      const instances = await ctx.db
        .query("billInstances")
        .withIndex("by_bill", (q) => q.eq("billId", billId))
        .filter((q) => q.eq(q.field("userId"), userId))
        .collect();
      allBillInstances.push(...instances);
    }

    // Group by month and calculate totals
    const monthlyTotals = new Map();

    allBillInstances.forEach(instance => {
      const month = instance.month;
      if (!monthlyTotals.has(month)) {
        monthlyTotals.set(month, 0);
      }
      monthlyTotals.set(month, monthlyTotals.get(month) + instance.amount);
    });

    // Convert to array format suitable for charts
    const result = Array.from(monthlyTotals.entries())
      .map(([month, total]) => ({ month, total }))
      .sort((a, b) => a.month.localeCompare(b.month));

    return {
      success: true,
      data: {
        profileName: profile.name,
        monthlyData: result,
      }
    };
  },
});

// Get bill status distribution
export const getBillStatusDistribution = query({
  handler: async (ctx) => {
    const identity = await ctx.auth.getUserIdentity();

    if (!identity) {
      return { success: false, error: "User not authenticated" };
    }

    const userId = identity.tokenIdentifier;

    // Get all bill instances for the user
    const billInstances = await ctx.db
      .query("billInstances")
      .filter((q) => q.eq(q.field("userId"), userId))
      .collect();

    // Group by paid status
    const paid = billInstances.filter(instance => instance.isPaid).length;
    const unpaid = billInstances.filter(instance => !instance.isPaid).length;

    return {
      success: true,
      data: [
        { name: "Paid", value: paid, color: "#22c55e" },
        { name: "Unpaid", value: unpaid, color: "#ef4444" },
      ]
    };
  },
});
