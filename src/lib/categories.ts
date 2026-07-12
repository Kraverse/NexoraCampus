export type CategoryId =
  | "internships"
  | "events"
  | "resources"
  | "marketplace"
  | "help";

export interface CategoryMeta {
  id: CategoryId;
  label: string;
  short: string;
  emoji: string;
  color: string; // tailwind gradient stops via inline
  from: string;
  to: string;
  description: string;
}

export const CATEGORIES: CategoryMeta[] = [
  {
    id: "internships",
    label: "Internships",
    short: "Interns",
    emoji: "💼",
    color: "#6366f1",
    from: "#6366f1",
    to: "#8b5cf6",
    description: "Openings, referrals & career leads",
  },
  {
    id: "events",
    label: "Events",
    short: "Events",
    emoji: "🎉",
    color: "#ec4899",
    from: "#ec4899",
    to: "#f43f5e",
    description: "Fests, meetups, hackathons & talks",
  },
  {
    id: "resources",
    label: "Resources",
    short: "Notes",
    emoji: "📚",
    color: "#06b6d4",
    from: "#06b6d4",
    to: "#3b82f6",
    description: "Notes, guides, courses & links",
  },
  {
    id: "marketplace",
    label: "Marketplace",
    short: "Market",
    emoji: "🛒",
    color: "#f59e0b",
    from: "#f59e0b",
    to: "#f97316",
    description: "Buy & sell second-hand items",
  },
  {
    id: "help",
    label: "Help Requests",
    short: "Help",
    emoji: "🤝",
    color: "#10b981",
    from: "#10b981",
    to: "#22c55e",
    description: "Ask questions & get support",
  },
];

export const CATEGORY_MAP: Record<CategoryId, CategoryMeta> = CATEGORIES.reduce(
  (acc, c) => {
    acc[c.id] = c;
    return acc;
  },
  {} as Record<CategoryId, CategoryMeta>
);

export function getCategory(id: string): CategoryMeta {
  return CATEGORY_MAP[id as CategoryId] ?? CATEGORIES[0];
}

export const REPORT_REASONS = [
  "Spam or scam",
  "Harassment or hate",
  "Inappropriate content",
  "Misinformation",
  "Off-topic",
  "Other",
];
