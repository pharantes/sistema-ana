import { z } from "zod";

export const CampaignSchema = z.object({
  name: z.string().min(2, "Campaign name required"),
  brand: z.string().min(2),
  budget: z.number().positive(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
});

export function validateCampaign(input) {
  return CampaignSchema.parse(input);
}
