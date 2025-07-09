import { cronJobs } from "convex/server";
import { internal } from "./_generated/api";

const crons = cronJobs();

// Run on the 1st day of every month at 00:01 UTC
crons.monthly(
  "generate-monthly-bills",
  { day: 1, hourUTC: 0, minuteUTC: 1 },
  internal.billInstances.generateMonthlyBillInstances,
);

export default crons;
