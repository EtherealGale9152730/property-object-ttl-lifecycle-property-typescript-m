import assert from "node:assert/strict";
import { decide } from "./maintenance-sweep.js";

const oldRequest = decide({ kind: "maintenance-request", objectKey: "unit-4/request.json", ageDays: 30 });
assert.deepEqual(oldRequest, { expire: true, objectKey: "unit-4/request.json" });

const currentDocument = decide({ kind: "tenant-document", objectKey: "unit-4/lease.json", ageDays: 364 });
assert.equal(currentDocument.expire, false);
console.log("lifecycle decisions passed");
