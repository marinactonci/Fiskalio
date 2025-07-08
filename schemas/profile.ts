import { z } from "zod";

export const profileSchema = z.object({
  name: z.string().min(1, "Profile name is required"),
  streetAddress: z.string().min(1, "Street address is required"),
  city: z.string().min(1, "City is required"),
  country: z.string().min(1, "Country is required"),
});
