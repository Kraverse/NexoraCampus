/**
 * Auth helper tests — password hashing round-trip.
 * Run with: npx tsx tests/auth.test.ts
 */
import assert from "node:assert";
import bcrypt from "bcryptjs";

let passed = 0;
async function test(name: string, fn: () => Promise<void>) {
  await fn();
  passed++;
  console.log(`  ✓ ${name}`);
}

async function main() {
  console.log("Auth");

  await test("hashes and verifies a password", async () => {
    const hash = await bcrypt.hash("demo123", 10);
    assert.notEqual(hash, "demo123");
    assert.equal(await bcrypt.compare("demo123", hash), true);
  });

  await test("rejects a wrong password", async () => {
    const hash = await bcrypt.hash("demo123", 10);
    assert.equal(await bcrypt.compare("wrong", hash), false);
  });

  await test("detects college email domains", async () => {
    const verify = (e: string) => /\.(edu|ac\.[a-z]{2,})$/i.test(e);
    assert.equal(verify("a@iit.edu"), true);
    assert.equal(verify("b@campus.ac.in"), true);
    assert.equal(verify("c@gmail.com"), false);
  });

  console.log(`\n✅ ${passed} tests passed\n`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
