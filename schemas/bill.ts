import { z } from "zod";

export const billSchema = z.object({
  name: z.string().min(1, "Bill name is required"),
  website: z
    .string()
    .url("Please enter a valid URL")
    .optional()
    .or(z.literal("")),
  username: z.string().optional(),
  password: z.string().optional(),
});
