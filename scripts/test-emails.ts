#!/usr/bin/env node
/**
 * Test script for Brevo email system
 * Usage: npx tsx scripts/test-emails.ts
 *
 * Requires BREVO_API_KEY and BREVO_SENDER_EMAIL in environment.
 * Sends one test email of each type to the configured TEST_EMAIL.
 */

const TEST_EMAIL = process.env.TEST_EMAIL ?? process.env.BREVO_SENDER_EMAIL;

if (!TEST_EMAIL) {
  console.error("❌ Set TEST_EMAIL or BREVO_SENDER_EMAIL environment variable");
  process.exit(1);
}

if (!process.env.BREVO_API_KEY) {
  console.error("❌ Set BREVO_API_KEY environment variable");
  process.exit(1);
}

console.log(`📧 Testing Brevo email system`);
console.log(`   To: ${TEST_EMAIL}`);
console.log(`   Sender: ${process.env.BREVO_SENDER_EMAIL ?? "default"}`);
console.log("");

const EMAIL_TYPES = [
  { name: "Order Confirmation", fn: "sendOrderConfirmation", args: {
    to: TEST_EMAIL,
    customerName: "Test Customer",
    orgName: "GestiOS Test",
    orderId: "test-order-123",
    items: [{ name: "Producto de prueba", quantity: 2, unitPrice: 150.00 }],
    total: 300.00,
    paymentMethod: "EFECTIVO",
  }},
  { name: "Welcome Email", fn: "sendWelcomeEmail", args: {
    to: TEST_EMAIL,
    customerName: "New Customer",
    orgName: "GestiOS Test",
  }},
  { name: "Birthday Email", fn: "sendBirthdayEmail", args: {
    to: TEST_EMAIL,
    customerName: "Birthday Person",
    orgName: "GestiOS Test",
    discountCode: "CUMPLETEST20",
    discountValue: 20,
  }},
  { name: "Low Stock Alert", fn: "sendLowStockAlert", args: {
    to: TEST_EMAIL,
    orgName: "GestiOS Test",
    products: [
      { name: "Producto A", stock: 2, minStock: 10 },
      { name: "Producto B", stock: 0, minStock: 5 },
    ],
  }},
  { name: "Plan Expiry Warning", fn: "sendPlanExpiryWarning", args: {
    to: TEST_EMAIL,
    orgName: "GestiOS Test",
    daysLeft: 3,
    planLabel: "Pro",
  }},
  { name: "Plan Expired", fn: "sendPlanExpired", args: {
    to: TEST_EMAIL,
    orgName: "GestiOS Test",
    planLabel: "Pro",
  }},
];

async function runTests() {
  const results: { name: string; status: string }[] = [];

  for (const test of EMAIL_TYPES) {
    process.stdout.write(`  Testing ${test.name}... `);

    try {
      // Import dynamically to get fresh module
      const emailModule = await import("@/lib/email");
      const fn = emailModule[test.fn as keyof typeof emailModule];

      if (typeof fn !== "function") {
        console.log(`❌ Function ${test.fn} not found`);
        results.push({ name: test.name, status: "ERROR" });
        continue;
      }

      await (fn as (...args: unknown[]) => Promise<void>)(test.args);

      // Small delay between sends to avoid rate limiting
      await new Promise(r => setTimeout(r, 1000));

      console.log("✅ OK");
      results.push({ name: test.name, status: "OK" });
    } catch (error) {
      console.log(`❌ ${error instanceof Error ? error.message : String(error)}`);
      results.push({ name: test.name, status: "FAILED" });
    }
  }

  console.log("");
  console.log("=== Results ===");
  const ok = results.filter(r => r.status === "OK").length;
  const failed = results.filter(r => r.status === "FAILED").length;
  const errors = results.filter(r => r.status === "ERROR").length;

  for (const r of results) {
    const icon = r.status === "OK" ? "✅" : r.status === "FAILED" ? "❌" : "⚠️";
    console.log(`  ${icon} ${r.name}: ${r.status}`);
  }

  console.log("");
  console.log(`Total: ${results.length} | OK: ${ok} | Failed: ${failed} | Errors: ${errors}`);

  if (failed > 0 || errors > 0) {
    process.exit(1);
  }
}

runTests().catch(console.error);
