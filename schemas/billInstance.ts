import z from "zod";

export const billInstanceSchema = z.object({
  month: z.date({ required_error: "Month is required" }),
  amount: z.number().min(0.01, "Amount must be greater than 0"),
  dueDate: z.date({ required_error: "Due date is required" }),
  description: z.string().optional(),
});
