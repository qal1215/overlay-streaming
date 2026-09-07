/**
 * test_phase3.ts -- Phase 3 SePay Idempotency Test Suite
 *
 * Identity mapping verified by source inspection (sepay-adapter.ts):
 *   SePay payload.id (number)
 *     -> SepayAdapter.normalize(): providerTransactionId = payload.id.toString()
 *     -> webhooks.ts route:        eventId = donationEvent.providerTransactionId
 *     -> processed_events.event_id
 *
 * DonationEvent.id = crypto.randomUUID() -- INTERNAL platform UUID, NOT the SePay id.
 *
 * Schema constraints:
 *   processed_events PRIMARY KEY: (creator_id, source, event_id)
 *   donations UNIQUE(payment_provider, payment_reference)
 *   donations UNIQUE(payment_provider, provider_transaction_id)
 *
 * SePay payload.id stability: No official SePay documentation available to this project
 * explicitly guarantees payload.id is stable across webhook retries. The implementation
 * treats it as stable. Documented here, not asserted.
 *
 * Concurrent test note (Test C): Promise.all() on Node.js event loop does NOT guarantee
 * OS-level thread concurrency. SQLite serialises writes. Test C is an integration smoke
 * test proving the application logic handles concurrent identical requests without
 * double-processing -- not a formal proof of MVCC-level concurrency safety.
 */

import { getPlatformProxy } from "wrangler";
import { Hono } from "hono";
import webhooksRouter from "./src/routes/webhooks";
import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Test framework
// ---------------------------------------------------------------------------

interface TestResult { label: string; name: string; passed: boolean; error?: string; }
const results: TestResult[] = [];

function assert(cond: boolean, msg: string): void {
  if (!cond) throw new Error("Assertion failed: " + msg);
}

async function runTest(label: string, name: string, fn: () => Promise<void>): Promise<boolean> {
  process.stdout.write("  [" + label + "] " + name + " ... ");
  try {
    await fn();
    console.log("PASS");
    results.push({ label, name, passed: true });
    return true;
  } catch (e: any) {
    console.log("FAIL");
    console.error("     -> " + e.message);
    results.push({ label, name, passed: false, error: e.message });
    return false;
  }
}

// ---------------------------------------------------------------------------
// Schema helpers
//
// schema.sql uses DROP TABLE IF EXISTS + CREATE TABLE, so it is safe to run
// repeatedly on the persistent local D1 SQLite file.
//
// Error handling: only "already exists" / "no such table" are tolerated.
// Any other schema error aborts the test run (no silent swallowing).
// ---------------------------------------------------------------------------

async function applySchema(db: any): Promise<void> {
  const sql = fs.readFileSync(path.resolve("./schema.sql"), "utf-8");
  const stmts = sql
    .split(";")
    .map((s: string) => s.trim())
    .filter((s: string) => s.length > 0 && !s.startsWith("--"));
  for (const stmt of stmts) {
    try {
      await db.prepare(stmt).run();
    } catch (e: any) {
      if (
        !e.message.includes("already exists") &&
        !e.message.includes("no such table")
      ) {
        throw new Error(
          "Schema init error on statement: " + stmt.substring(0, 80) + " ... " + e.message
        );
      }
    }
  }
}

async function clearTables(db: any): Promise<void> {
  const tables = [
    "processed_events",
    "donations",
    "creator_donation_settings",
    "alert_triggers",
    "overlays",
    "alerts",
  ];
  for (const t of tables) {
    await db.prepare("DELETE FROM " + t).run();
  }
}

// ---------------------------------------------------------------------------
// HMAC-SHA256 signer
//
// Must match SepaySignatureService.validateSignature() exactly:
//   data   = timestamp + "." + rawBody
//   key    = webhookSecret
//   output = bare lowercase hex (no "sha256=" prefix)
//   header = X-SePay-Signature: <hex>
//   (service strips optional "sha256=" prefix before parsing hex)
// ---------------------------------------------------------------------------

async function sign(secret: string, ts: string, body: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await globalThis.crypto.subtle.importKey(
    "raw", enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
  );
  const buf = await globalThis.crypto.subtle.sign("HMAC", key, enc.encode(ts + "." + body));
  return Array.from(new Uint8Array(buf))
    .map((b: number) => b.toString(16).padStart(2, "0"))
    .join("");
}

// ---------------------------------------------------------------------------
// Payload factory -- matches SePayWebhookPayloadSchema
// ---------------------------------------------------------------------------

function mkP(id: number, ref: string, acct: string, amt = 50000) {
  return {
    id,
    gateway: "VietQR",
    transactionDate: "2024-01-01 12:00:00",
    accountNumber: acct,
    subAccountCode: null,
    code: null,
    content: "Donation " + ref,
    transferType: "in",
    transferAmount: amt,
    accumulated: 100000,
    referenceCode: ref,
    description: "Thank you",
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function runTests() {
  console.log("=".repeat(70));
  console.log("Phase 3 -- SePay Idempotency Integration Test Suite");
  console.log("Runtime: Wrangler local D1/SQLite via getPlatformProxy()");
  console.log("=".repeat(70));

  const { env, dispose } = await getPlatformProxy<any>();
  const db = env.DB;
  if (!db) throw new Error("D1 database not found in env. Check wrangler.jsonc.");

  env.PLATFORM_ENCRYPTION_KEY = "0".repeat(64); // 32 bytes as lowercase hex
  env.ADMIN_SECRET = "admin_secret_p3";

  // Guaranteed cleanup even if tests throw
  try {
    console.log("\nApplying schema and clearing data...");
    await applySchema(db);
    await clearTables(db);

    const { SecretEncryptionService } = await import(
      "./src/services/SecretEncryptionService"
    );
    const encSvc = new SecretEncryptionService(env.PLATFORM_ENCRYPTION_KEY);

    // Creator A -- primary
    const cA = "tst_creator_A";
    const whSecA = "wh_secret_A_p3test";
    const whIdA = "wh_id_A_p3test";
    const acctA = "111222333";
    const encA = await encSvc.encrypt(whSecA);

    await db
      .prepare(
        "INSERT INTO creator_donation_settings " +
        "(creator_id,enabled,payment_provider,payment_account_number,sepay_webhook_id,sepay_webhook_secret) " +
        "VALUES (?,1,'sepay',?,?,?)"
      )
      .bind(cA, acctA, whIdA, encA)
      .run();
    await db
      .prepare(
        "INSERT INTO overlays (id,creator_id,name,width,height,definition_json) " +
        "VALUES ('ov_A',?,'OvA',1920,1080,'[]')"
      )
      .bind(cA)
      .run();
    await db
      .prepare(
        "INSERT INTO alert_triggers (id,creator_id,source,event_type,alert_id,enabled) " +
        "VALUES ('trig_A',?,'sepay','donation','alert_A',1)"
      )
      .bind(cA)
      .run();

    // Creator B -- for cross-creator tests
    const cB = "tst_creator_B";
    const whSecB = "wh_secret_A_p3test"; // same raw secret, different account
    const whIdB = "wh_id_B_p3test";
    const acctB = "444555666";
    const encB = await encSvc.encrypt(whSecB);

    await db
      .prepare(
        "INSERT INTO creator_donation_settings " +
        "(creator_id,enabled,payment_provider,payment_account_number,sepay_webhook_id,sepay_webhook_secret) " +
        "VALUES (?,1,'sepay',?,?,?)"
      )
      .bind(cB, acctB, whIdB, encB)
      .run();
    await db
      .prepare(
        "INSERT INTO overlays (id,creator_id,name,width,height,definition_json) " +
        "VALUES ('ov_B',?,'OvB',1920,1080,'[]')"
      )
      .bind(cB)
      .run();
    await db
      .prepare(
        "INSERT INTO alert_triggers (id,creator_id,source,event_type,alert_id,enabled) " +
        "VALUES ('trig_B',?,'sepay','donation','alert_B',1)"
      )
      .bind(cB)
      .run();

    // ------------------------------------------------------------------
    // OverlayRoom stub -- counts successful alert dispatches
    // ------------------------------------------------------------------
    let dispatched: any[] = [];
    let failAlert = false;
    const resetAlerts = () => { dispatched = []; failAlert = false; };

    env.OVERLAY_ROOM = {
      idFromName: (n: string) => "doid:" + n,
      get: (_doId: string) => ({
        fetch: async (req: Request) => {
          if (failAlert) throw new Error("Simulated OverlayRoom dispatch failure");
          dispatched.push(await req.json());
          return new Response(JSON.stringify({ success: true }), { status: 200 });
        },
      }),
    };

    // ------------------------------------------------------------------
    // Hono app
    // ------------------------------------------------------------------
    const app = new Hono<{ Bindings: any }>();
    app.route("/api/webhooks", webhooksRouter);

    async function wh(whId: string, rawStr: string, sig: string, ts: string) {
      return app.request("/api/webhooks/sepay/" + whId, {
        method: "POST",
        headers: {
          "X-SePay-Signature": sig,
          "X-SePay-Timestamp": ts,
          "Content-Type": "application/json",
        },
        body: rawStr,
      }, env);
    }

    async function signed(secret: string, payload: object) {
      const str = JSON.stringify(payload);
      const ts = Math.floor(Date.now() / 1000).toString();
      return { str, ts, sig: await sign(secret, ts, str) };
    }

    console.log("\nRunning tests...\n");

    // ==============================================================
    // TEST A -- First delivery
    // ==============================================================
    console.log("--- Test A: First delivery ---");
    resetAlerts();
    const txA = 2001;
    const refA = "REF-A-001";
    await db.prepare(
      "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,status) " +
      "VALUES ('don_A001',?,50000,'VND','sepay',?,'PENDING')"
    ).bind(cA, refA).run();

    const { str: strA, ts: tsA, sig: sigA } = await signed(whSecA, mkP(txA, refA, acctA));
    const resA = await wh(whIdA, strA, sigA, tsA);

    await runTest("A", "HTTP 200", async () => {
      assert(resA.status === 200, "Got " + resA.status);
      const j = await resA.clone().json() as any;
      assert(j.success === true, JSON.stringify(j));
    });
    await runTest("A", "donation.status = PAID", async () => {
      const d = await db.prepare("SELECT * FROM donations WHERE id='don_A001'").first<any>();
      assert(d !== null, "row missing");
      assert(d.status === "PAID", "Got " + d.status);
    });
    await runTest("A", "provider_transaction_id = payload.id ('" + txA + "')", async () => {
      const d = await db.prepare("SELECT * FROM donations WHERE id='don_A001'").first<any>();
      assert(d.provider_transaction_id === txA.toString(), "Got " + d.provider_transaction_id);
    });
    await runTest("A", "processed_events row = COMPLETED", async () => {
      const e = await db
        .prepare("SELECT * FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txA.toString(), cA)
        .first<any>();
      assert(e !== null, "row missing");
      assert(e.status === "COMPLETED", "Got " + e.status);
    });
    await runTest("A", "exactly 1 alert dispatched", async () => {
      assert(dispatched.length === 1, "Got " + dispatched.length);
    });

    // ==============================================================
    // TEST B -- Sequential duplicate (exact same signed request)
    // ==============================================================
    console.log("\n--- Test B: Sequential duplicate ---");
    const resB = await wh(whIdA, strA, sigA, tsA);

    await runTest("B", "HTTP 200 with duplicate-completed message", async () => {
      assert(resB.status === 200, "Got " + resB.status);
      const j = await resB.clone().json() as any;
      assert(
        j.message === "Duplicate event already completed",
        "Got: " + j.message
      );
    });
    await runTest("B", "donations count = 1 (no double row)", async () => {
      const { results: rows } = await db
        .prepare("SELECT * FROM donations WHERE payment_reference=?")
        .bind(refA)
        .all();
      assert(rows.length === 1, "Got " + rows.length + " rows");
    });
    await runTest("B", "processed_events count = 1 (no duplicate row)", async () => {
      const { results: rows } = await db
        .prepare("SELECT * FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txA.toString(), cA)
        .all();
      assert(rows.length === 1, "Got " + rows.length + " rows");
    });
    await runTest("B", "alert count still 1 (no second dispatch)", async () => {
      assert(dispatched.length === 1, "Got " + dispatched.length);
    });

    // ==============================================================
    // TEST C -- Concurrent duplicate (Promise.all)
    // ==============================================================
    console.log("\n--- Test C: Concurrent duplicate (integration smoke test) ---");
    resetAlerts();
    const txC = 2002;
    const refC = "REF-C-001";
    await db.prepare(
      "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,status) " +
      "VALUES ('don_C001',?,50000,'VND','sepay',?,'PENDING')"
    ).bind(cA, refC).run();

    const { str: strC, ts: tsC, sig: sigC } = await signed(whSecA, mkP(txC, refC, acctA));
    const [resC1, resC2] = await Promise.all([
      wh(whIdA, strC, sigC, tsC),
      wh(whIdA, strC, sigC, tsC),
    ]);

    await runTest("C", "both requests return HTTP 200", async () => {
      assert(resC1.status === 200, "R1=" + resC1.status);
      assert(resC2.status === 200, "R2=" + resC2.status);
    });
    await runTest("C", "donations = 1 PAID (not double-processed)", async () => {
      const { results: rows } = await db
        .prepare("SELECT * FROM donations WHERE payment_reference=? AND status='PAID'")
        .bind(refC)
        .all();
      assert(rows.length === 1, "Got " + rows.length + " PAID rows");
    });
    await runTest("C", "processed_events = 1 row (no PK violation)", async () => {
      const { results: rows } = await db
        .prepare("SELECT * FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txC.toString(), cA)
        .all();
      assert(rows.length === 1, "Got " + rows.length + " rows");
    });
    await runTest("C", "processed_events.attempts = 1 (only one claim succeeded)", async () => {
      const e = await db
        .prepare("SELECT * FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txC.toString(), cA)
        .first<any>();
      assert(e !== null, "row missing");
      assert(e.attempts === 1, "Got attempts=" + e.attempts);
    });
    await runTest("C", "exactly 1 alert dispatched", async () => {
      assert(dispatched.length === 1, "Got " + dispatched.length);
    });

    // ==============================================================
    // TEST C2 -- PAID -> alert failure -> FAILED -> retry -> COMPLETED
    //
    // The full webhook -> DonationService -> AlertService -> OverlayRoom path
    // is exercised. OverlayRoom.get().fetch() is stubbed to throw, simulating
    // an overlay dispatch failure. This is NOT "AlertService mocked" -- the
    // real AlertService code runs; only the terminal network call (OverlayRoom)
    // is intercepted by the test stub.
    // ==============================================================
    console.log("\n--- Test C2: PAID -> alert failure -> retry ---");
    resetAlerts();
    const txC2 = 2003;
    const refC2 = "REF-C2-001";
    await db.prepare(
      "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,status) " +
      "VALUES ('don_C2001',?,50000,'VND','sepay',?,'PENDING')"
    ).bind(cA, refC2).run();

    const { str: strC2, ts: tsC2, sig: sigC2 } = await signed(whSecA, mkP(txC2, refC2, acctA));

    // First attempt -- fail at OverlayRoom
    failAlert = true;
    const resC2a = await wh(whIdA, strC2, sigC2, tsC2);

    await runTest("C2", "first attempt returns HTTP 500", async () => {
      assert(resC2a.status === 500, "Got " + resC2a.status);
    });
    await runTest("C2", "donation.status = PAID (financial state survives alert failure)", async () => {
      const d = await db.prepare("SELECT status FROM donations WHERE id='don_C2001'").first<any>();
      assert(d !== null, "row missing");
      assert(d.status === "PAID", "Got " + d.status);
    });
    await runTest("C2", "processed_events.status = FAILED before retry", async () => {
      const e = await db
        .prepare("SELECT status FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txC2.toString(), cA)
        .first<any>();
      assert(e !== null, "row missing");
      assert(e.status === "FAILED", "Got " + e.status);
    });
    await runTest("C2", "0 successful alerts during failed attempt (OverlayRoom threw)", async () => {
      assert(dispatched.length === 0, "Got " + dispatched.length);
    });

    // Retry -- OverlayRoom succeeds
    failAlert = false;
    const resC2b = await wh(whIdA, strC2, sigC2, tsC2);

    await runTest("C2", "retry returns HTTP 200", async () => {
      assert(resC2b.status === 200, "Got " + resC2b.status);
    });
    await runTest("C2", "processed_events.status = COMPLETED after retry", async () => {
      const e = await db
        .prepare("SELECT status FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txC2.toString(), cA)
        .first<any>();
      assert(e !== null, "row missing");
      assert(e.status === "COMPLETED", "Got " + e.status);
    });
    await runTest("C2", "exactly 1 alert dispatched after retry", async () => {
      assert(dispatched.length === 1, "Got " + dispatched.length);
    });
    await runTest("C2", "donations = 1 PAID (not duplicated on retry)", async () => {
      const { results: rows } = await db
        .prepare("SELECT * FROM donations WHERE payment_reference=? AND status='PAID'")
        .bind(refC2)
        .all();
      assert(rows.length === 1, "Got " + rows.length + " rows");
    });

    // ==============================================================
    // TEST D -- Same payment_reference, different provider_transaction_id
    //
    // REF-C2-001 is already PAID with TX=2003 from Test C2.
    // DonationService sends TX=2004 for same reference.
    // UPDATE WHERE status='PENDING' returns 0 changes -> null alertEvent.
    // Route marks event COMPLETED and returns "Payment ignored or already processed".
    // ==============================================================
    console.log("\n--- Test D: Same reference, different transaction ID ---");
    resetAlerts();
    const txD = 2004;
    const refD = refC2; // already PAID

    const { str: strD, ts: tsD, sig: sigD } = await signed(whSecA, mkP(txD, refD, acctA));
    const resD = await wh(whIdA, strD, sigD, tsD);

    await runTest("D", "HTTP 200 with 'Payment ignored' message", async () => {
      assert(resD.status === 200, "Got " + resD.status);
      const j = await resD.clone().json() as any;
      assert(
        j.message === "Payment ignored or already processed",
        "Got: " + j.message
      );
    });
    await runTest("D", "no second donation row created", async () => {
      const { results: rows } = await db
        .prepare("SELECT * FROM donations WHERE payment_reference=?")
        .bind(refD)
        .all();
      assert(rows.length === 1, "Got " + rows.length + " rows");
    });
    await runTest("D", "original provider_transaction_id = 2003 (not overwritten)", async () => {
      const d = await db
        .prepare("SELECT * FROM donations WHERE payment_reference=?")
        .bind(refD)
        .first<any>();
      assert(
        d.provider_transaction_id === "2003",
        "Got " + d.provider_transaction_id
      );
    });
    await runTest("D", "no alert dispatched for duplicate reference", async () => {
      assert(dispatched.length === 0, "Got " + dispatched.length);
    });
    await runTest("D", "event for TX-2004 = COMPLETED (safe retryable state)", async () => {
      const e = await db
        .prepare("SELECT * FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txD.toString(), cA)
        .first<any>();
      assert(e !== null, "No processed_events row for TX-" + txD);
      assert(e.status === "COMPLETED", "Got " + e.status);
    });

    // ==============================================================
    // TEST E -- Existing PROCESSING state collision
    //
    // Manually pre-insert a PROCESSING row. The atomic claim UPDATE
    // finds status NOT IN ('RECEIVED','FAILED') -> changes=0 ->
    // route returns 200 "Event is currently processing".
    // ==============================================================
    console.log("\n--- Test E: Existing PROCESSING state collision ---");
    resetAlerts();
    const txE = 2005;
    const refE = "REF-E-001";

    await db
      .prepare(
        "INSERT INTO processed_events " +
        "(event_id,creator_id,source,status,attempts,processing_started_at) " +
        "VALUES (?,?,'sepay','PROCESSING',1,CURRENT_TIMESTAMP)"
      )
      .bind(txE.toString(), cA)
      .run();
    await db.prepare(
      "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,status) " +
      "VALUES ('don_E001',?,50000,'VND','sepay',?,'PENDING')"
    ).bind(cA, refE).run();

    const { str: strE, ts: tsE, sig: sigE } = await signed(whSecA, mkP(txE, refE, acctA));
    const resE = await wh(whIdA, strE, sigE, tsE);

    await runTest("E", "HTTP 200 with 'Event is currently processing' message", async () => {
      assert(resE.status === 200, "Got " + resE.status);
      const j = await resE.clone().json() as any;
      assert(j.message === "Event is currently processing", "Got: " + j.message);
    });
    await runTest("E", "donation remains PENDING (not double-processed)", async () => {
      const d = await db.prepare("SELECT status FROM donations WHERE id='don_E001'").first<any>();
      assert(d !== null, "row missing");
      assert(d.status === "PENDING", "Got " + d.status);
    });
    await runTest("E", "no alert dispatched", async () => {
      assert(dispatched.length === 0, "Got " + dispatched.length);
    });
    await runTest("E", "PROCESSING row not re-claimed (attempts still = 1)", async () => {
      const e = await db
        .prepare("SELECT * FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txE.toString(), cA)
        .first<any>();
      assert(e !== null, "row missing");
      assert(e.attempts === 1, "Got attempts=" + e.attempts);
    });

    // ==============================================================
    // TEST G1 -- Cross-creator transaction collision (global UNIQUE)
    //
    // UNIQUE(payment_provider, provider_transaction_id) is GLOBAL (not per-creator).
    // Creator A already has TX=2001 (from Test A).
    // Creator B's donation (different payment_reference) is attempted with TX=2001.
    // DonationService.processPaymentEvent UPDATE sets provider_transaction_id=2001
    // on Creator B's donation -> hits UNIQUE constraint -> throws -> route returns 400.
    // This verifies financial transaction uniqueness, not creator authorization.
    // ==============================================================
    console.log("\n--- Test G1: Cross-creator transaction collision (global UNIQUE) ---");
    resetAlerts();
    const txG1 = txA; // 2001 -- already used by Creator A
    const refG1 = "REF-G1-001";

    await db.prepare(
      "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,status) " +
      "VALUES ('don_G1B',?,50000,'VND','sepay',?,'PENDING')"
    ).bind(cB, refG1).run();

    const { str: strG1, ts: tsG1, sig: sigG1 } = await signed(whSecB, mkP(txG1, refG1, acctB));
    const resG1 = await wh(whIdB, strG1, sigG1, tsG1);

    await runTest("G1", "request does not return HTTP 200 success (UNIQUE blocks it)", async () => {
      const isSuccess = resG1.status === 200 && (await resG1.clone().json() as any).success === true;
      assert(!isSuccess, "Expected non-success response, got 200 success");
    });
    await runTest("G1", "Creator B donation NOT set to PAID (no financial corruption)", async () => {
      const d = await db.prepare("SELECT * FROM donations WHERE id='don_G1B'").first<any>();
      assert(d !== null, "row missing");
      assert(d.status !== "PAID", "Got PAID -- global UNIQUE must prevent TX reuse");
      assert(
        d.provider_transaction_id !== txG1.toString(),
        "provider_transaction_id must not be " + txG1
      );
    });
    await runTest("G1", "processed_events for B/TX-2001 = FAILED", async () => {
      const e = await db
        .prepare("SELECT * FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txG1.toString(), cB)
        .first<any>();
      assert(e !== null, "processed_events row for Creator B missing");
      assert(e.status === "FAILED", "Got " + e.status);
    });
    await runTest("G1", "no alert dispatched for collision", async () => {
      assert(dispatched.length === 0, "Got " + dispatched.length);
    });

    // ==============================================================
    // TEST G2 -- Independent transaction for Creator B
    //
    // Verifies that scoped event IDs (creator_id, source, event_id in
    // processed_events) do not incorrectly suppress Creator B's own
    // legitimate donations.
    // ==============================================================
    console.log("\n--- Test G2: Independent creator transaction ---");
    resetAlerts();
    const txG2 = 3001; // new TX, never seen
    const refG2 = "REF-G2-001";

    await db.prepare(
      "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,status) " +
      "VALUES ('don_G2B',?,50000,'VND','sepay',?,'PENDING')"
    ).bind(cB, refG2).run();

    const { str: strG2, ts: tsG2, sig: sigG2 } = await signed(whSecB, mkP(txG2, refG2, acctB));
    const resG2 = await wh(whIdB, strG2, sigG2, tsG2);

    await runTest("G2", "HTTP 200 for legitimate Creator B transaction", async () => {
      assert(resG2.status === 200, "Got " + resG2.status);
      const j = await resG2.clone().json() as any;
      assert(j.success === true, JSON.stringify(j));
    });
    await runTest("G2", "Creator B donation = PAID with correct TX", async () => {
      const d = await db.prepare("SELECT * FROM donations WHERE id='don_G2B'").first<any>();
      assert(d !== null, "row missing");
      assert(d.status === "PAID", "Got " + d.status);
      assert(
        d.provider_transaction_id === txG2.toString(),
        "Got " + d.provider_transaction_id
      );
    });
    await runTest("G2", "processed_events for B/TX-3001 = COMPLETED", async () => {
      const e = await db
        .prepare("SELECT * FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txG2.toString(), cB)
        .first<any>();
      assert(e !== null, "row missing");
      assert(e.status === "COMPLETED", "Got " + e.status);
    });
    await runTest("G2", "exactly 1 alert dispatched for Creator B", async () => {
      assert(dispatched.length === 1, "Got " + dispatched.length);
    });

    // ==============================================================
    // TEST H1 -- Direct DB: UNIQUE(payment_provider, payment_reference)
    // ==============================================================
    console.log("\n--- Test H1: UNIQUE(payment_provider, payment_reference) ---");
    await db.prepare(
      "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,status) " +
      "VALUES ('don_H1a','h1_ctr',100,'VND','sepay','H1-REF-SAME','PENDING')"
    ).run();

    await runTest("H1", "second insert with same (provider, reference) fails", async () => {
      let threw = false;
      try {
        await db.prepare(
          "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,status) " +
          "VALUES ('don_H1b','h1_ctr',100,'VND','sepay','H1-REF-SAME','PENDING')"
        ).run();
      } catch (e: any) {
        threw = true;
        assert(
          e.message.includes("UNIQUE constraint failed"),
          "Expected UNIQUE error, got: " + e.message
        );
      }
      assert(threw, "Expected UNIQUE constraint violation but insert succeeded");
    });

    await db.prepare("DELETE FROM donations WHERE id LIKE 'don_H1%'").run();

    // ==============================================================
    // TEST H2 -- Direct DB: UNIQUE(payment_provider, provider_transaction_id)
    // ==============================================================
    console.log("\n--- Test H2: UNIQUE(payment_provider, provider_transaction_id) ---");
    await db.prepare(
      "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,provider_transaction_id,status) " +
      "VALUES ('don_H2a','h2_ctr',100,'VND','sepay','H2-REF-001','TX-H2-SAME','PAID')"
    ).run();

    await runTest("H2", "second insert with same (provider, provider_transaction_id) fails", async () => {
      let threw = false;
      try {
        await db.prepare(
          "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,provider_transaction_id,status) " +
          "VALUES ('don_H2b','h2_ctr',100,'VND','sepay','H2-REF-002','TX-H2-SAME','PAID')"
        ).run();
      } catch (e: any) {
        threw = true;
        assert(
          e.message.includes("UNIQUE constraint failed"),
          "Expected UNIQUE error, got: " + e.message
        );
      }
      assert(threw, "Expected UNIQUE constraint violation but insert succeeded");
    });

    await db.prepare("DELETE FROM donations WHERE id LIKE 'don_H2%'").run();

    // ==============================================================
    // TEST I -- processed_events PRIMARY KEY (creator_id, source, event_id)
    // ==============================================================
    console.log("\n--- Test I: processed_events PK uniqueness ---");
    await db.prepare(
      "INSERT INTO processed_events (event_id,creator_id,source,status,attempts) " +
      "VALUES ('PK-EV-1','pk_ctr','sepay','COMPLETED',1)"
    ).run();

    await runTest("I", "duplicate (creator_id, source, event_id) insert fails", async () => {
      let threw = false;
      try {
        await db.prepare(
          "INSERT INTO processed_events (event_id,creator_id,source,status,attempts) " +
          "VALUES ('PK-EV-1','pk_ctr','sepay','RECEIVED',0)"
        ).run();
      } catch (e: any) {
        threw = true;
        const isExpected =
          e.message.includes("UNIQUE constraint failed") ||
          e.message.includes("PRIMARY KEY") ||
          e.message.includes("already exists");
        assert(isExpected, "Expected PK/UNIQUE error, got: " + e.message);
      }
      assert(threw, "Expected PK violation but insert succeeded");
    });

    await runTest("I", "different event_id for same creator inserts successfully", async () => {
      await db.prepare(
        "INSERT INTO processed_events (event_id,creator_id,source,status,attempts) " +
        "VALUES ('PK-EV-2','pk_ctr','sepay','COMPLETED',1)"
      ).run();
      const e = await db
        .prepare("SELECT * FROM processed_events WHERE event_id='PK-EV-2' AND creator_id='pk_ctr'")
        .first<any>();
      assert(e !== null, "Row with different event_id not found");
    });

    await db.prepare("DELETE FROM processed_events WHERE creator_id='pk_ctr'").run();

    // ==============================================================
    // TEST J -- Authentication-before-idempotency regression
    //
    // An invalid HMAC signature must be rejected BEFORE any idempotency
    // state is written. This proves authentication is the outermost guard.
    // ==============================================================
    console.log("\n--- Test J: Authentication-before-idempotency regression ---");
    resetAlerts();
    const txJ = 9999;
    const refJ = "REF-J-001";

    await db.prepare(
      "INSERT INTO donations (id,creator_id,amount,currency,payment_provider,payment_reference,status) " +
      "VALUES ('don_J001',?,50000,'VND','sepay',?,'PENDING')"
    ).bind(cA, refJ).run();

    const rawStrJ = JSON.stringify(mkP(txJ, refJ, acctA));
    const rawTsJ = Math.floor(Date.now() / 1000).toString();
    const badSig = "deadbeef".repeat(8); // 64 hex chars, cryptographically wrong
    const resJ = await wh(whIdA, rawStrJ, badSig, rawTsJ);

    await runTest("J", "HTTP 401 for invalid signature", async () => {
      assert(resJ.status === 401, "Got " + resJ.status);
    });
    await runTest("J", "no processed_events row created", async () => {
      const e = await db
        .prepare("SELECT * FROM processed_events WHERE event_id=? AND creator_id=? AND source='sepay'")
        .bind(txJ.toString(), cA)
        .first<any>();
      assert(e === null, "Found unexpected row: " + JSON.stringify(e));
    });
    await runTest("J", "donation remains PENDING (auth gate protects financial state)", async () => {
      const d = await db
        .prepare("SELECT status FROM donations WHERE id='don_J001'")
        .first<any>();
      assert(d !== null, "row missing");
      assert(d.status === "PENDING", "Got " + d.status);
    });
    await runTest("J", "no alert dispatched for invalid request", async () => {
      assert(dispatched.length === 0, "Got " + dispatched.length);
    });

    // ==============================================================
    // Final report
    // ==============================================================
    console.log("\n" + "=".repeat(70));
    console.log("TEST MATRIX");
    console.log("=".repeat(70));

    const order = ["A", "B", "C", "C2", "D", "E", "G1", "G2", "H1", "H2", "I", "J"];
    const descs: Record<string, string> = {
      A:  "First delivery",
      B:  "Sequential duplicate",
      C:  "Concurrent duplicate",
      C2: "PAID -> alert failure -> retry",
      D:  "Same reference, different transaction",
      E:  "Existing PROCESSING collision",
      G1: "Cross-creator transaction collision",
      G2: "Independent creator transaction",
      H1: "payment_reference UNIQUE constraint",
      H2: "provider_transaction_id UNIQUE constraint",
      I:  "processed_events PK uniqueness",
      J:  "Authentication-before-idempotency regression",
    };

    let allPass = true;
    console.log(
      "| " + "Test".padEnd(4) +
      " | " + "Purpose".padEnd(44) +
      " | " + "Assertions".padEnd(10) +
      " | " + "Result".padEnd(6) + " |"
    );
    console.log(
      "|" + "-".repeat(6) + "|" + "-".repeat(46) +
      "|" + "-".repeat(12) + "|" + "-".repeat(8) + "|"
    );

    for (const lbl of order) {
      const group = results.filter((r) => r.label === lbl);
      if (!group.length) continue;
      const fail = group.filter((r) => !r.passed).length;
      const overall = fail === 0 ? "PASS" : "FAIL";
      if (fail > 0) allPass = false;
      const countStr = group.length + " (" + fail + " fail)";
      console.log(
        "| " + lbl.padEnd(4) +
        " | " + (descs[lbl] || lbl).padEnd(44) +
        " | " + countStr.padEnd(10) +
        " | " + overall.padEnd(6) + " |"
      );
    }

    if (!allPass) {
      console.log("\nFailed assertions:");
      for (const r of results.filter((r) => !r.passed)) {
        console.log("  [" + r.label + "] " + r.name);
        console.log("       -> " + r.error);
      }
    }

    console.log("\n" + "=".repeat(70));
    console.log(allPass ? "ALL PHASE 3 TESTS PASSED" : "SOME PHASE 3 TESTS FAILED");
    console.log("=".repeat(70));

    if (!allPass) process.exit(1);
  } finally {
    // dispose() is called even if tests throw or process.exit(1) is called
    // Note: process.exit(1) will skip the finally block -- intentional for CI.
    // For interactive runs, the finally ensures cleanup.
    await dispose();
  }
}

runTests().catch((e) => {
  console.error("\nFATAL:", e);
  process.exit(1);
});
