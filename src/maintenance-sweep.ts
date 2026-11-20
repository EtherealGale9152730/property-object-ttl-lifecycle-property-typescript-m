import { infrai } from "./infrai-client.js";
import { lifecycleRule, propertyObjectSchema, shouldExpire } from "./lifecycle-policy.js";
import { randomUUID } from "node:crypto";

const SWEEP_URL = "https://example.invalid/property-object-sweep";

function bucketName(): string {
  const suffix = `${Date.now().toString(36)}-${randomUUID().slice(0, 8)}`;
  return process.env.INFRAI_BUCKET_NAME ?? `property-throwaways-${suffix}`;
}

export async function preparePolicy(): Promise<{ jobId: string }> {
  const name = bucketName();
  await infrai.storage.bucket.create({ name });
  await infrai.storage.bucket.set_lifecycle(name, lifecycleRule());
  const job = await infrai.cron.create({ cron_expr: "0 3 * * *", task: SWEEP_URL });
  return { jobId: job.job_id };
}

export function decide(body: unknown): { expire: boolean; objectKey: string } {
  const object = propertyObjectSchema.parse(body);
  return { expire: shouldExpire(object), objectKey: object.objectKey };
}

if (process.argv[1]?.endsWith("maintenance-sweep.ts")) {
  const input = { kind: "inspection-reminder", objectKey: "unit-18/reminder.json", ageDays: 15 };
  console.log(decide(input));
  if (process.env.INFRAI_API_KEY) preparePolicy().then((result) => console.log(result));
}
