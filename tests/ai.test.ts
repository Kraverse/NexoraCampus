/**
 * Lightweight tests for NexoraCampus core logic (AI + auth helpers).
 * Run with: npx tsx tests/ai.test.ts
 * Zero external test framework — pure Node assertions for portability.
 */
import assert from "node:assert";
import { categorize, suggestTags, moderate, localSummarize, rankFeed } from "../src/lib/ai";

let passed = 0;
function test(name: string, fn: () => void) {
  try {
    fn();
    passed++;
    console.log(`  ✓ ${name}`);
  } catch (e) {
    console.error(`  ✗ ${name}`);
    throw e;
  }
}

console.log("AI engine");

test("categorizes an internship post", () => {
  const r = categorize("Hiring summer SDE interns, paid stipend, apply now with resume");
  assert.equal(r.category, "internships");
});

test("categorizes an event post", () => {
  const r = categorize("Join our campus hackathon this weekend, register your team!");
  assert.equal(r.category, "events");
});

test("categorizes a marketplace post", () => {
  const r = categorize("Selling my used laptop, price negotiable, second-hand deal");
  assert.equal(r.category, "marketplace");
});

test("suggests relevant tags", () => {
  const tags = suggestTags("Free python and machine learning notes for beginners");
  assert.ok(tags.length > 0);
  assert.ok(tags.includes("python") || tags.includes("ml"));
});

test("flags toxic content", () => {
  const r = moderate("you are an idiot and stupid loser");
  assert.equal(r.allowed, false);
  assert.ok(r.toxicityScore > 0);
});

test("flags spam content", () => {
  const r = moderate("CLICK HERE for FREE MONEY!!! earn ₹ crypto giveaway double your income");
  assert.equal(r.allowed, false);
  assert.ok(r.spamScore > 0);
});

test("allows clean content", () => {
  const r = moderate("Looking for study partners for our upcoming algorithms exam.");
  assert.equal(r.allowed, true);
});

test("summarizes long text within limit", () => {
  const long = "This is a long post. ".repeat(30);
  const s = localSummarize(long);
  assert.ok(s.length <= 170);
});

test("ranks engaged & recent posts higher", () => {
  const now = new Date();
  const posts = [
    { likeCount: 0, saveCount: 0, viewCount: 0, createdAt: now },
    { likeCount: 100, saveCount: 50, viewCount: 500, createdAt: now },
  ];
  const ranked = rankFeed(posts);
  assert.equal(ranked[0].likeCount, 100);
});

console.log(`\n✅ ${passed} tests passed\n`);
