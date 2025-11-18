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
    userId: v.string(),
  })
    .index("by_bill", ["billId"])
    .index("by_month_user", ["month", "userId"]),
});

export default schema;

export type Profile = Doc<"profiles">;
export type Bill = Doc<"bills">;
export type BillInstance = Doc<"billInstances">;
