import { v } from "convex/values";
import { internalMutation } from "./_generated/server";
import { planNoteMigration } from "../lib/noteMigration";

/**
 * Moves payment dates typed into notes ("Plaćeno 5.11.2025.") into the
 * `paidAt` field and rewrites notes to the period text
 * ("Račun za razdoblje 1.10.2026. - 31.10.2026.").
 *
 * Internal: run it from the CLI or the Convex dashboard, first as a dry run:
 *   npx convex run migrations:migrateNotes '{"dryRun": true}'
 *   npx convex run migrations:migrateNotes '{"dryRun": false}'
 * (add --prod for the production deployment). Safe to run again: notes that
 * were already migrated are left alone.
 */
export const migrateNotes = internalMutation({
  args: {
    dryRun: v.boolean(),
    // Also fill empty notes and replace the old English cron notes with the
    // period text (default true).
    rewriteOtherNotes: v.optional(v.boolean()),
  },
  handler: async (ctx, args) => {
    const rewriteOther = args.rewriteOtherNotes ?? true;
    const now = Date.now();

    const [instances, bills] = await Promise.all([
      ctx.db.query("billInstances").collect(),
      ctx.db.query("bills").collect(),
    ]);
    const billName = new Map(bills.map((b) => [b._id as string, b.name]));

    const changed: {
      id: string;
      bill: string;
      month: string;
      kind: string;
      before: string;
      after: string;
      paidDate?: string;
      notes?: string[];
    }[] = [];
    // Not changed; fix these by hand in the app if needed.
    const skipped: { id: string; bill: string; month: string; note: string; reason: string }[] = [];
    // Left alone but still mention a payment in a form the migration doesn't read.
    const review: { id: string; bill: string; month: string; note: string; reason: string }[] = [];
    const counts = {
      scanned: instances.length,
      paidNote: 0,
      legacyNote: 0,
      emptyNote: 0,
      unchanged: 0,
      skipped: 0,
      review: 0,
    };

    for (const inst of instances) {
      const name = billName.get(inst.billId);
      const plan = planNoteMigration(inst, now, { billName: name, rewriteOther });
      const bill = name ?? "?";
      const row = { id: inst._id, bill, month: inst.month, note: inst.description ?? "" };

      if (plan.action === "skip") {
        counts.skipped++;
        skipped.push({ ...row, reason: plan.reason });
        continue;
      }
      if (plan.action === "none") {
        counts.unchanged++;
        if (plan.review) {
          counts.review++;
          review.push({ ...row, reason: plan.review });
        }
        continue;
      }

      if (plan.kind === "paid-note") counts.paidNote++;
      else if (plan.kind === "legacy-note") counts.legacyNote++;
      else counts.emptyNote++;

      changed.push({
        id: inst._id,
        bill,
        month: inst.month,
        kind: plan.kind,
        before: inst.description ?? "",
        after: plan.patch.description ?? inst.description ?? "",
        paidDate: plan.paidDate,
        notes: plan.notes.length ? plan.notes : undefined,
      });

      if (!args.dryRun) await ctx.db.patch(inst._id, plan.patch);
    }

    return { dryRun: args.dryRun, counts, skipped, review, changed };
  },
});
