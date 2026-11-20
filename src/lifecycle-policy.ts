import { z } from "zod";

export const propertyObjectSchema = z.object({
  kind: z.enum(["maintenance-request", "tenant-document", "inspection-reminder"]),
  objectKey: z.string().min(1),
  ageDays: z.number().int().nonnegative(),
});

export type PropertyObject = z.infer<typeof propertyObjectSchema>;

const retentionDays: Record<PropertyObject["kind"], number> = {
  "maintenance-request": 30,
  "tenant-document": 365,
  "inspection-reminder": 14,
};

export function shouldExpire(input: PropertyObject): boolean {
  return input.ageDays >= retentionDays[input.kind];
}

export function lifecycleRule() {
  return { rules: Object.entries(retentionDays).map(([prefix, days]) => ({ prefix, expire_days: days })) };
}
