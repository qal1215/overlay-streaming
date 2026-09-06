import { getPlatformProxy } from "wrangler";
import { Hono } from "hono";
import webhooksRouter from "./src/routes/webhooks";
import * as fs from "fs";
import * as path from "path";
import * as crypto from "crypto";

async function runTests() {
  console.log("Setting up Wrangler local D1 test environment...");
  const { env, dispose } = await getPlatformProxy<any>();
  const db = env.DB;
  
  if (!db) {
    throw new Error("D1 database not found in env. Please ensure wrangler.json is configured.");
  }

  // Load and apply schema
  const schemaPath = path.resolve("./schema.sql");
  const schemaSql = fs.readFileSync(schemaPath, "utf-8");
  
  // Basic split by semicolon. Real wrangler uses miniflare execute, but we can just run queries
  const statements = schemaSql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0);
  
  for (const stmt of statements) {
    try {
      await db.prepare(stmt).run();
    } catch (e: any) {
      if (!e.message.includes("already exists")) {
         // ignore some drop/create errors just to ensure fresh state or we can just log
      }
    }
  }

  // Clear data for tests
  await db.prepare("DELETE FROM processed_events").run();
  await db.prepare("DELETE FROM donations").run();
  await db.prepare("DELETE FROM creator_donation_settings").run();
  await db.prepare("DELETE FROM alert_triggers").run();

  // Create a Hono app and mount webhooks
  const app = new Hono<{ Bindings: any }>();
  app.route("/api/webhooks", webhooksRouter);

  // Helper to generate signature
  async function generateSignature(secret: string, timestamp: string, payload: string) {
    const encoder = new TextEncoder();
    const keyData = encoder.encode(secret);
    const key = await globalThis.crypto.subtle.importKey(
      "raw", keyData, { name: "HMAC", hash: "SHA-256" }, false, ["sign"]
    );
    const payloadToSign = `${timestamp}.${payload}`;
    const signatureBuffer = await globalThis.crypto.subtle.sign("HMAC", key, encoder.encode(payloadToSign));
    return Array.from(new Uint8Array(signatureBuffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  }

  // Create test creator and settings
  const creatorId = "creator_p3";
  const mockSecret = "sepay_super_secret_p3";
  const mockWebhookId = "wh_p3";
  const mockAccountNumber = "999999";
  
  // Use our encryption service to store the secret correctly
  // We need PLATFORM_ENCRYPTION_KEY in env
  env.PLATFORM_ENCRYPTION_KEY = "0".repeat(64); // 32 bytes in hex = 64 characters
  env.ADMIN_SECRET = "admin123";

  // Mock OVERLAY_ROOM
  let dispatchedAlerts: any[] = [];
  let shouldFailAlert = false;
  env.OVERLAY_ROOM = {
    idFromName: () => "mock-do-id",
    get: () => ({
      fetch: async (req: Request) => {
        if (shouldFailAlert) {
           throw new Error("Simulated alert dispatch failure");
        }
        const body = await req.json();
        dispatchedAlerts.push(body);
        return new Response(JSON.stringify({success: true}));
      }
    })
  };

  const { SecretEncryptionService } = await import("./src/services/SecretEncryptionService");
  const encryptor = new SecretEncryptionService(env.PLATFORM_ENCRYPTION_KEY);
  const encryptedSecret = await encryptor.encrypt(mockSecret);

  await db.prepare(`
    INSERT INTO creator_donation_settings (creator_id, enabled, payment_provider, payment_account_number, sepay_webhook_id, sepay_webhook_secret)
    VALUES (?, 1, 'sepay', ?, ?, ?)
  `).bind(creatorId, mockAccountNumber, mockWebhookId, encryptedSecret).run();

  await db.prepare(`
    INSERT INTO alert_triggers (id, creator_id, source, event_type, alert_id, enabled)
    VALUES ('trig_1', ?, 'sepay', 'donation', 'alert_1', 1)
  `).bind(creatorId).run();

  await db.prepare(`
    INSERT INTO overlays (id, creator_id, name, width, height, definition_json)
    VALUES ('overlay_1', ?, 'Test Overlay', 1920, 1080, '[]')
  `).bind(creatorId).run();

  console.log("Environment ready. Starting tests...\n");
  let passed = true;

  const runWebhook = async (payloadStr: string, signature: string, timestamp: string) => {
    return app.request(`/api/webhooks/sepay/${mockWebhookId}`, {
      method: "POST",
      headers: {
        "X-SePay-Signature": signature,
        "X-SePay-Timestamp": timestamp,
        "Content-Type": "application/json"
      },
      body: payloadStr
    }, env);
  };

  function createPayload(id: number, reference: string, amount = 50000) {
    return {
      id,
      gateway: "VietQR",
      transactionDate: "2024-01-01 12:00:00",
      accountNumber: mockAccountNumber,
      subAccountCode: null,
      code: null,
      content: reference, // SePay uses content for transfer details
      transferType: "in",
      transferAmount: amount,
      accumulated: 100000,
      referenceCode: reference,
      description: "Thank you"
    };
  }

  // TEST A: First delivery
  console.log("Test A: First delivery");
  const refA = "DONATE-TEST-001";
  await db.prepare("INSERT INTO donations (id, creator_id, amount, currency, payment_provider, payment_reference, status) VALUES ('don_1', ?, 50000, 'VND', 'sepay', ?, 'PENDING')").bind(creatorId, refA).run();
  
  const payloadA = createPayload(1001, refA);
  const strA = JSON.stringify(payloadA);
  const timeA = Math.floor(Date.now() / 1000).toString();
  const sigA = await generateSignature(mockSecret, timeA, strA);

  const resA = await runWebhook(strA, sigA, timeA);
  const jsonA = await resA.json();
  
  if (resA.status !== 200 || !jsonA.success) {
    console.error("Test A Failed", jsonA);
    passed = false;
  }
  
  const donationA = await db.prepare("SELECT * FROM donations WHERE id = 'don_1'").first<any>();
  if (donationA.status !== 'PAID' || donationA.provider_transaction_id !== '1001') {
    console.error("Test A Failed: Donation not updated", donationA);
    passed = false;
  }
  
  if (dispatchedAlerts.length !== 1) {
    console.error("Test A Failed: Alert not dispatched", dispatchedAlerts);
    passed = false;
  }
  
  // TEST B: Sequential duplicate
  console.log("\\nTest B: Sequential duplicate");
  const resB = await runWebhook(strA, sigA, timeA);
  const jsonB = await resB.json();
  if (resB.status !== 200 || jsonB.message !== "Duplicate event already completed") {
    console.error("Test B Failed: Did not return duplicate success", jsonB);
    passed = false;
  }
  if (dispatchedAlerts.length !== 1) {
    console.error("Test B Failed: Alert dispatched twice!");
    passed = false;
  }

  // TEST C: True Concurrency
  console.log("\\nTest C: True Concurrency");
  const refC = "DONATE-TEST-002";
  await db.prepare("INSERT INTO donations (id, creator_id, amount, currency, payment_provider, payment_reference, status) VALUES ('don_2', ?, 50000, 'VND', 'sepay', ?, 'PENDING')").bind(creatorId, refC).run();
  
  const payloadC = createPayload(1002, refC);
  const strC = JSON.stringify(payloadC);
  const timeC = Math.floor(Date.now() / 1000).toString();
  const sigC = await generateSignature(mockSecret, timeC, strC);
  
  const [resC1, resC2] = await Promise.all([
    runWebhook(strC, sigC, timeC),
    runWebhook(strC, sigC, timeC)
  ]);
  
  const jsonC1 = await resC1.json();
  const jsonC2 = await resC2.json();
  
  if (resC1.status !== 200 || resC2.status !== 200) {
    console.error("Test C Failed: One request failed completely", resC1.status, resC2.status);
    passed = false;
  }
  
  if (dispatchedAlerts.length !== 2) {
    console.error("Test C Failed: Duplicate alerts dispatched or none dispatched", dispatchedAlerts.length);
    passed = false;
  }
  
  const eventC = await db.prepare("SELECT * FROM processed_events WHERE event_id = '1002'").first<any>();
  if (eventC.attempts !== 1) {
    console.error("Test C Failed: Attempts > 1 means both threads claimed it incorrectly", eventC.attempts);
    passed = false;
  }

  // TEST C2: PAID -> alert failure -> retry
  console.log("\\nTest C2: PAID -> alert failure -> retry");
  const refC2 = "DONATE-TEST-C2";
  await db.prepare("INSERT INTO donations (id, creator_id, amount, currency, payment_provider, payment_reference, status) VALUES ('don_c2', ?, 50000, 'VND', 'sepay', ?, 'PENDING')").bind(creatorId, refC2).run();
  
  const payloadC2 = createPayload(1003, refC2);
  const strC2 = JSON.stringify(payloadC2);
  const timeC2 = Math.floor(Date.now() / 1000).toString();
  const sigC2 = await generateSignature(mockSecret, timeC2, strC2);
  
  shouldFailAlert = true;
  const resC2a = await runWebhook(strC2, sigC2, timeC2);
  if (resC2a.status !== 500) {
    console.error("Test C2 Failed: Expected 500 on alert failure, got", resC2a.status);
    passed = false;
  }
  
  const donC2a = await db.prepare("SELECT status FROM donations WHERE id = 'don_c2'").first<any>();
  const evC2a = await db.prepare("SELECT status FROM processed_events WHERE event_id = '1003'").first<any>();
  if (donC2a.status !== 'PAID' || evC2a.status !== 'FAILED') {
    console.error("Test C2 Failed: Incorrect state after failure", donC2a, evC2a);
    passed = false;
  }
  
  shouldFailAlert = false;
  const resC2b = await runWebhook(strC2, sigC2, timeC2);
  if (resC2b.status !== 200) {
    console.error("Test C2 Failed: Retry failed", resC2b.status);
    passed = false;
  }
  
  const evC2b = await db.prepare("SELECT status FROM processed_events WHERE event_id = '1003'").first<any>();
  if (evC2b.status !== 'COMPLETED') {
    console.error("Test C2 Failed: Retry did not complete event", evC2b);
    passed = false;
  }
  if (dispatchedAlerts.length !== 3) {
    console.error("Test C2 Failed: Alert not dispatched exactly once on retry", dispatchedAlerts.length);
    passed = false;
  }

  // TEST D: Different transaction, same reference (duplicate payment)
  console.log("\\nTest D: Same reference, different transaction id");
  const payloadD = createPayload(1004, refC2); // refC2 is already paid
  const strD = JSON.stringify(payloadD);
  const sigD = await generateSignature(mockSecret, timeC2, strD);
  const resD = await runWebhook(strD, sigD, timeC2);
  const jsonD = await resD.json();
  
  if (resD.status !== 200 || jsonD.message !== "Payment ignored or already processed") {
    console.error("Test D Failed: Did not ignore duplicate payment", jsonD);
    passed = false;
  }
  if (dispatchedAlerts.length !== 3) {
    console.error("Test D Failed: Alert incorrectly dispatched for duplicate transaction");
    passed = false;
  }

  // TEST G: Cross-creator Collision
  console.log("\\nTest G: Cross-creator Collision");
  const creatorId2 = "creator_p3_alt";
  const mockWebhookId2 = "wh_p3_alt";
  await db.prepare("INSERT INTO creator_donation_settings (creator_id, enabled, payment_provider, payment_account_number, sepay_webhook_id, sepay_webhook_secret) VALUES (?, 1, 'sepay', ?, ?, ?)").bind(creatorId2, mockAccountNumber, mockWebhookId2, encryptedSecret).run();
  
  await db.prepare("INSERT INTO overlays (id, creator_id, name, width, height, definition_json) VALUES ('overlay_2', ?, 'Test Overlay 2', 1920, 1080, '[]')").bind(creatorId2).run();

  const refG = "DONATE-TEST-G1";
  await db.prepare("INSERT INTO donations (id, creator_id, amount, currency, payment_provider, payment_reference, status) VALUES ('don_g', ?, 50000, 'VND', 'sepay', ?, 'PENDING')").bind(creatorId2, refG).run();
  
  // They both receive transaction ID 1001 (same ID, different creator)
  const payloadG = createPayload(1001, refG);
  const strG = JSON.stringify(payloadG);
  const sigG = await generateSignature(mockSecret, timeC2, strG);
  
  const resG = await app.request(`/api/webhooks/sepay/${mockWebhookId2}`, {
    method: "POST",
    headers: { "X-SePay-Signature": sigG, "X-SePay-Timestamp": timeC2, "Content-Type": "application/json" },
    body: strG
  }, env);
  
  if (resG.status !== 400) {
    console.error("Test G Failed: Expected 400 due to global transaction uniqueness, got", resG.status);
    passed = false;
  }
  
  const eventG = await db.prepare("SELECT * FROM processed_events WHERE event_id = '1001' AND creator_id = ?").bind(creatorId2).first<any>();
  if (!eventG || eventG.status !== 'FAILED' || !eventG.last_error.includes("UNIQUE constraint failed")) {
    console.error("Test G Failed: Processed event did not fail gracefully on global constraint", eventG);
    passed = false;
  }
  
  // Now test legitimately separate payment for Creator B
  const refG2 = "DONATE-TEST-G2";
  await db.prepare("INSERT INTO donations (id, creator_id, amount, currency, payment_provider, payment_reference, status) VALUES ('don_g2', ?, 50000, 'VND', 'sepay', ?, 'PENDING')").bind(creatorId2, refG2).run();
  
  const payloadG2 = createPayload(1005, refG2);
  const strG2 = JSON.stringify(payloadG2);
  const sigG2 = await generateSignature(mockSecret, timeC2, strG2);
  
  const resG2 = await app.request(`/api/webhooks/sepay/${mockWebhookId2}`, {
    method: "POST",
    headers: { "X-SePay-Signature": sigG2, "X-SePay-Timestamp": timeC2, "Content-Type": "application/json" },
    body: strG2
  }, env);
  
  if (resG2.status !== 200) {
    console.error("Test G Failed: Independent event failed", resG2.status);
    passed = false;
  }
  
  const eventG2 = await db.prepare("SELECT * FROM processed_events WHERE event_id = '1005' AND creator_id = ?").bind(creatorId2).first<any>();
  if (!eventG2 || eventG2.status !== 'COMPLETED') {
    console.error("Test G Failed: Independent event not completed", eventG2);
    passed = false;
  }

  console.log(passed ? "\\nALL PHASE 3 TESTS PASSED!" : "\\nSOME PHASE 3 TESTS FAILED.");
  
  await dispose();
}

runTests().catch(console.error);
