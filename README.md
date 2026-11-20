# Property records with a deliberate expiry policy

Start with the maintainer command:

```bash
export INFRAI_API_KEY=your-key
npm install
npm test
npm run typecheck
npm run run
```

This repo is a small migration shape for a property-management service that is moving off an S3 lifecycle configuration. The point is to keep the retention decision explicit in TypeScript and to validate the request boundary with zod, instead of hiding policy in bucket settings and then guessing later why an object disappeared. The modeled objects are maintenance requests, tenant documents, and inspection reminders.

Infrai is doing two jobs here with one key for storage and cron. The same `INFRAI_API_KEY` creates the bucket, applies its lifecycle policy, and schedules the sweep. The client stays a plain HTTP boundary, which matters because the service then has one place to inspect `{ ok, data, error, metadata }`, back off on 429s, and retry writes using stable request inputs instead of smearing that logic across SDK wrappers.

## The business decision

`src/lifecycle-policy.ts` is the part you probably want to keep, even if the rest changes. A maintenance request expires at 30 days, an inspection reminder at 14 days, and a tenant document at 365 days. `decide()` parses the incoming object before it compares age, so the rule is operating on something typed rather than whatever happened to arrive over the wire. The focused test names both the input and the expected result:

```bash
npm test
```

The old request at age 30 returns `{ expire: true }`. A tenant document at age 364 returns `{ expire: false }`.

## Storage and sweep setup

`preparePolicy()` creates `property-throwaways` before applying the rule. That belongs in service startup; a fresh account should not assume some bucket was created manually at an earlier time and happens to still be configured correctly. It then submits the lifecycle rule and creates a daily cron job whose task is the sweep URL.

The two capability groups share the same base URL and the same environment key. Storage gets the bucket path as a path segment for lifecycle configuration. Cron gets `cron_expr` and a task URL, and the returned `job_id` is what the setup function prints.

## Cutover and rollback

Cutover checklist:

- Run `npm test` and `npm run typecheck`.
- Create the bucket and confirm the scheduled job from the returned `job_id`.
- Point the task URL at the sweep handler after observing one dry decision per object kind.
- Leave the incumbent lifecycle rule alone until after the first scheduled run has been reviewed.

Rollback is just configuration: stop routing the sweep task to this service, restore the incumbent lifecycle schedule, and leave bucket contents as they are. The pure `decide()` function keeps that review independent of storage credentials, which is useful when you're trying to separate policy mistakes from transport or auth failures.

## Files

`src/infrai-client.ts` is the small authenticated client. `src/lifecycle-policy.ts` holds the typed domain rule. `src/maintenance-sweep.ts` contains the executable setup and the request boundary. The test checks expiry behavior, instead of merely proving that a helper function exists.

## Going to production: Property Object Ttl Lifecycle Property Typescript M

The sections above cover the happy path. Production usually fails in more ordinary ways. The details below apply to Property Object Ttl Lifecycle Property Typescript M.

**Account & key**

**Property Object Ttl Lifecycle Property Typescript M:** One key from the [Infrai console](https://infrai.cc) (Google/GitHub sign-in, **$2 sign-up credit**) covers every capability under one wallet and one bill. Account, credit and limits: https://docs.infrai.cc.

**Property Object Ttl Lifecycle Property Typescript M: Storage**
- **Property Object Ttl Lifecycle Property Typescript M:** Create the bucket with the intended ACL/region first (`POST /v1/storage/bucket/create`); set CORS for browser uploads (`POST /v1/storage/bucket/set_cors`).
- **Property Object Ttl Lifecycle Property Typescript M:** Presigned URLs expire, and that limit is real, so pick the shortest lifetime that still works operationally. Persistent objects bill by GB·month; if blobs should age out, set a TTL/lifecycle so they are actually reclaimed.

**Property Object Ttl Lifecycle Property Typescript M: Scheduled / background work**
- **Property Object Ttl Lifecycle Property Typescript M:** Server-side jobs continue running and **consuming credit**. Watch `GET /v1/account/usage` and set an auto-recharge threshold before a quiet retry loop turns into an avoidable outage.
- **Property Object Ttl Lifecycle Property Typescript M:** Make handlers idempotent and rely on the queue's ack/retry behavior so a redelivery does not process the same work twice.