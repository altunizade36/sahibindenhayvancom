import { z } from "zod";

// Admin moderation request schema
export const moderateListingSchema = z.object({
  status: z.enum(['active', 'rejected'], {
    errorMap: () => ({ message: "Status must be 'active' or 'rejected'" }),
  }),
  reason: z.string().optional(),
}).refine(
  (data) => {
    // Rejection MUST have a reason
    if (data.status === 'rejected' && !data.reason) {
      return false;
    }
    return true;
  },
  {
    message: "Rejection reason is required when rejecting a listing",
    path: ['reason'],
  }
);

export type ModerateListingInput = z.infer<typeof moderateListingSchema>;
