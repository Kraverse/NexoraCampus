import type { CategoryId } from "./categories";

// ---------------------------------------------------------------------------
// NexoraCampus AI engine.
// Works fully offline with strong heuristics. If OPENAI_API_KEY is present,
// text generation tasks (rewrite, summarize, assistant) upgrade to the API.
// ---------------------------------------------------------------------------

const CATEGORY_KEYWORDS: Record<CategoryId, string[]> = {
  internships: [
    "intern",
    "internship",
    "hiring",
    "job",
    "recruit",
    "stipend",
    "sde",
    "referral",
    "apply",
    "resume",
    "career",
    "opening",
    "position",
    "full-time",
    "placement",
  ],
  events: [
    "event",
    "hackathon",
    "fest",
    "meetup",
    "workshop",
    "webinar",
    "seminar",
    "talk",
    "conference",
    "competition",
    "register",
    "rsvp",
    "concert",
    "party",
  ],
  resources: [
    "notes",
    "pdf",
    "guide",
    "course",
    "tutorial",
    "material",
    "syllabus",
    "cheatsheet",
    "book",
    "roadmap",
    "resource",
    "link",
    "study",
    "reference",
  ],
  marketplace: [
    "sell",
    "selling",
    "buy",
    "sale",
    "price",
    "cheap",
    "used",
    "second-hand",
    "cycle",
    "laptop",
    "calculator",
    "furniture",
    "rent",
    "negotiable",
    "₹",
    "$",
  ],
  help: [
    "help",
    "how do i",
    "how to",
    "stuck",
    "doubt",
    "question",
    "anyone",
    "need",
    "please",
    "urgent",
    "advice",
    "suggest",
    "confused",
    "error",
  ],
};

const TAG_LIBRARY = [
  "webdev","python","java","javascript","react","ai","ml","dsa","design","ui",
  "startup","finance","gate","cat","gre","placement","frontend","backend","cloud",
  "aws","flutter","android","ios","hackathon","scholarship","remote","paid","free",
  "beginner","networking","robotics","iot","data","math","physics","chemistry",
  "hostel","books","electronics","gaming","music","sports","volunteer",
];

const TOXIC_WORDS = [
  "idiot","stupid","hate","dumb","loser","trash","kill","ugly","shut up","moron",
];
const SPAM_SIGNALS = [
  "click here","free money","earn ₹","earn $","work from home guaranteed",
  "100% free","limited offer","dm to earn","crypto giveaway","double your",
  "whatsapp me","telegram me","subscribe now","bit.ly","tinyurl",
];

export interface CategorizeResult {
  category: CategoryId;
  confidence: number;
  scores: Record<string, number>;
}

export function categorize(text: string): CategorizeResult {
  const lower = text.toLowerCase();
  const scores: Record<string, number> = {};
  (Object.keys(CATEGORY_KEYWORDS) as CategoryId[]).forEach((cat) => {
    let s = 0;
    for (const kw of CATEGORY_KEYWORDS[cat]) {
      if (lower.includes(kw)) s += kw.length > 5 ? 2 : 1;
    }
    scores[cat] = s;
  });
  let best: CategoryId = "resources";
  let bestScore = -1;
  for (const [cat, s] of Object.entries(scores)) {
    if (s > bestScore) {
      bestScore = s;
      best = cat as CategoryId;
    }
  }
  const total = Object.values(scores).reduce((a, b) => a + b, 0) || 1;
  return {
    category: best,
    confidence: bestScore === 0 ? 0.35 : Math.min(0.98, bestScore / total),
    scores,
  };
}

export function suggestTags(text: string, limit = 5): string[] {
  const lower = text.toLowerCase();
  const found = new Set<string>();
  for (const tag of TAG_LIBRARY) {
    if (lower.includes(tag)) found.add(tag);
  }
  // add category-derived tag
  const { category } = categorize(text);
  found.add(category);
  // pull salient words
  const words = lower
    .replace(/[^a-z0-9\s]/g, " ")
    .split(/\s+/)
    .filter((w) => w.length > 4);
  const freq: Record<string, number> = {};
  const stop = new Set(["about","which","there","their","would","could","should","these","those","after","before","because","while"]);
  for (const w of words) {
    if (stop.has(w)) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .forEach(([w]) => found.add(w));
  return Array.from(found).slice(0, limit);
}

export interface ModerationResult {
  allowed: boolean;
  spamScore: number;
  toxicityScore: number;
  flags: string[];
}

export function moderate(text: string): ModerationResult {
  const lower = text.toLowerCase();
  const flags: string[] = [];
  let spam = 0;
  let tox = 0;
  for (const s of SPAM_SIGNALS) {
    if (lower.includes(s)) {
      spam += 0.34;
      flags.push(`spam signal: "${s}"`);
    }
  }
  for (const t of TOXIC_WORDS) {
    if (new RegExp(`\\b${t}\\b`).test(lower)) {
      tox += 0.3;
      flags.push(`toxic term: "${t}"`);
    }
  }
  // ALL CAPS shouting
  const letters = text.replace(/[^a-zA-Z]/g, "");
  if (letters.length > 15 && letters === letters.toUpperCase()) {
    spam += 0.2;
    flags.push("excessive caps");
  }
  // repeated links
  const links = (lower.match(/https?:\/\//g) || []).length;
  if (links > 2) {
    spam += 0.3;
    flags.push("too many links");
  }
  spam = Math.min(1, spam);
  tox = Math.min(1, tox);
  return {
    allowed: spam < 0.6 && tox < 0.6,
    spamScore: Number(spam.toFixed(2)),
    toxicityScore: Number(tox.toFixed(2)),
    flags,
  };
}

export function localSummarize(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (clean.length <= max) return clean;
  const sentences = clean.match(/[^.!?]+[.!?]?/g) || [clean];
  let out = "";
  for (const s of sentences) {
    if ((out + s).length > max) break;
    out += s;
  }
  if (!out) out = clean.slice(0, max);
  return out.trim().replace(/[,;:]$/, "") + "…";
}

export function localRewrite(text: string): string {
  const clean = text.replace(/\s+/g, " ").trim();
  if (!clean) return "";
  // Capitalize sentences, fix spacing, add polish framing.
  const sentences = clean
    .split(/(?<=[.!?])\s+/)
    .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
    .map((s) => (/[.!?]$/.test(s) ? s : s + "."));
  return sentences.join(" ");
}

// ---- Optional OpenAI upgrade ------------------------------------------------

async function callOpenAI(system: string, user: string): Promise<string | null> {
  const key = process.env.OPENAI_API_KEY;
  if (!key) return null;
  try {
    const res = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
        temperature: 0.6,
        max_tokens: 400,
      }),
    });
    if (!res.ok) return null;
    const data = await res.json();
    return data.choices?.[0]?.message?.content?.trim() ?? null;
  } catch {
    return null;
  }
}

export async function rewrite(text: string): Promise<string> {
  const ai = await callOpenAI(
    "You are an editor for a student community app. Rewrite the post to be clearer, friendlier, and more engaging while keeping the meaning. Return only the improved text.",
    text
  );
  return ai ?? localRewrite(text);
}

export async function summarize(text: string): Promise<string> {
  const ai = await callOpenAI(
    "Summarize this student post in one short, punchy sentence (max 160 chars). Return only the summary.",
    text
  );
  return ai ?? localSummarize(text);
}

const ASSISTANT_KNOWLEDGE = `You are Nova, the friendly NexoraCampus assistant. NexoraCampus is a student community app.
Categories: Internships, Events, Resources, Marketplace, Help Requests.
Users can: browse an infinite feed, filter by category/tag, create posts (with AI tag & rewrite help),
search, save/bookmark posts, report content, and view profiles. Admins moderate reported posts.
Give short, helpful, encouraging answers. If asked how to do something, give clear steps.`;

export async function assistant(message: string): Promise<string> {
  const ai = await callOpenAI(ASSISTANT_KNOWLEDGE, message);
  if (ai) return ai;
  return localAssistant(message);
}

function localAssistant(message: string): string {
  const m = message.toLowerCase();
  if (/post|create|write|publish/.test(m))
    return "To create a post, tap the ✨ Create button in the top bar. Add a title and details, then use 'AI Enhance' to polish it and 'Suggest Tags' to auto-tag. Pick a category and hit Publish!";
  if (/save|bookmark/.test(m))
    return "Tap the bookmark icon on any post to save it. Find all your saved posts under Saved in the sidebar or your profile.";
  if (/intern|job|hiring/.test(m))
    return "Head to the Internships category from the filter bar — you'll find openings, referrals, and career leads shared by fellow students.";
  if (/report|spam|inappropriate/.test(m))
    return "Open a post's menu and choose Report. Pick a reason and our moderation team (and AI filters) will review it.";
  if (/search|find/.test(m))
    return "Use the search bar up top — try natural queries like 'free ML resources' or 'cheap laptop near me'.";
  if (/event|hackathon|fest/.test(m))
    return "Check the Events category for hackathons, fests, workshops, and meetups happening around campus.";
  if (/hello|hi|hey|help/.test(m))
    return "Hi! I'm Nova 👋 I can help you navigate NexoraCampus — ask me about creating posts, finding internships, saving items, or searching. What do you need?";
  return "I'm Nova, your campus guide! I can help with posting, finding internships & events, searching resources, saving items, and reporting content. Try asking me something specific 🙂";
}

export function rankFeed<T extends { likeCount: number; saveCount: number; viewCount: number; createdAt: Date | string }>(
  posts: T[]
): T[] {
  const now = Date.now();
  return [...posts].sort((a, b) => score(b) - score(a));
  function score(p: T) {
    const created = new Date(p.createdAt).getTime();
    const ageHours = Math.max(1, (now - created) / 3_600_000);
    const engagement = p.likeCount * 3 + p.saveCount * 4 + p.viewCount * 0.5;
    return (engagement + 1) / Math.pow(ageHours, 0.7);
  }
}
