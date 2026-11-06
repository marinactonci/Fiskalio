import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";
import type { Doc } from "./_generated/dataModel";

const schema = defineSchema({
  profiles: defineTable({
    name: v.string(),
    address: v.object({
      street: v.string(),
      city: v.string(),
      country: v.string(),
    }),
    color: v.string(),
    userId: v.string(),
    billCount: v.number(),
  }).index("by_userId", ["userId"]),

  bills: defineTable({
    profileId: v.id("profiles"),
    name: v.string(),
    eBill: v.optional(
      v.object({
        link: v.string(),
        username: v.string(),
        password: v.string(),
      }),
    ),
    // Day of the month the bill is usually due; used when the monthly cron
    // opens new instances.
    dueDay: v.optional(v.number()),
    billInstanceCount: v.number(),
    userId: v.string(),
  })
    .index("by_profile", ["profileId"])
    .index("by_userId", ["userId"]),

  billInstances: defineTable({
    billId: v.id("bills"),
    month: v.string(),
    amount: v.number(),
    dueDate: v.string(),
    description: v.optional(v.string()),
    isPaid: v.boolean(),
    // True while the amount is still the copy of last month's amount made by
    // the monthly cron; cleared as soon as the user edits the amount.
    isEstimated: v.optional(v.boolean()),
    // When the instance was marked paid (ms since epoch).
    paidAt: v.optional(v.number()),
    userId: v.string(),
  })
    .index("by_bill", ["billId"])
    .index("by_month_user", ["month", "userId"])
    .index("by_userId", ["userId"]),

  // Named filter combinations shown in the sidebar ("Spremljeni pogledi").
  savedViews: defineTable({
    userId: v.string(),
    name: v.string(),
    // Serialized filter query string, e.g. "status=unpaid&profiles=a,b".
    query: v.string(),
  }).index("by_userId", ["userId"]),
});

export default schema;

export type Profile = Doc<"profiles">;
export type Bill = Doc<"bills">;
export type BillInstance = Doc<"billInstances">;
export type SavedView = Doc<"savedViews">;
