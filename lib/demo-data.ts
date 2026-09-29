import type { Post } from "./posts";
import type { Resource } from "./resources";

// Sample library for the public /demo page. Fictional authors; nothing here
// touches the database.
const day = (n: number) => new Date(Date.UTC(2026, 8, 28 - n, 9)).toISOString();

function post(
  n: number,
  p: Pick<
    Post,
    "title" | "summary" | "author_name" | "domain_tags" | "intent_tags"
  > &
    Partial<Post>,
): Post {
  return {
    linkedin_urn: `urn:li:activity:demo-${n}`,
    author_url: null,
    author_avatar_url: null,
    original_post_url: "https://www.linkedin.com/feed/",
    extracted_link: null,
    link_context: null,
    status: "published",
    note: null,
    is_favorite: false,
    resources: [],
    created_at: day(n),
    synced_at: day(n),
    ...p,
  };
}

export const DEMO_POSTS: Post[] = [
  post(0, {
    title: "A free design system starter that ships in an afternoon",
    summary:
      "Walks through setting up tokens, a type scale and ten core components, and argues small teams should copy a proven system instead of inventing one.",
    author_name: "Maya Chen",
    domain_tags: ["Design"],
    intent_tags: ["Resources"],
    is_favorite: true,
    note: "Try this for the side project's settings screen.",
    resources: [
      {
        title: "shadcn/ui",
        url: "https://ui.shadcn.com",
        description: "Copy-paste React components built on Radix and Tailwind.",
        type: "Tool",
      },
      {
        title: "Radix Colors",
        url: "https://www.radix-ui.com/colors",
        description: "Accessible color scales with light and dark variants.",
        type: "Tool",
      },
    ],
  }),
  post(1, {
    title: "How we cut our LLM bill by 70% with prompt caching",
    summary:
      "Explains caching long system prompts, batching background jobs and routing simple requests to a smaller model, with before-and-after cost numbers.",
    author_name: "Arjun Mehta",
    domain_tags: ["AI", "Development"],
    intent_tags: ["Learning"],
  }),
  post(2, {
    title: "I built a habit tracker that lives in the menu bar",
    summary:
      "A weekend build using Tauri and SQLite; the author shares what made the app feel native and why they skipped accounts entirely.",
    author_name: "Sofia Rossi",
    domain_tags: ["Coding"],
    intent_tags: ["Cool Build", "Inspiration"],
    extracted_link: "https://tauri.app",
    link_context: "Tauri — build small, fast desktop apps",
  }),
  post(3, {
    title: "SQL window functions explained with one real dataset",
    summary:
      "Uses a single orders table to show ROW_NUMBER, running totals and moving averages, with the query for each step.",
    author_name: "Daniel Okafor",
    domain_tags: ["Data"],
    intent_tags: ["Learning", "Resources"],
    resources: [
      {
        title: "Mode SQL Tutorial",
        url: "https://mode.com/sql-tutorial",
        description:
          "Free interactive SQL lessons from basics to window functions.",
        type: "Course",
      },
    ],
  }),
  post(4, {
    title: "Stop designing empty states last",
    summary:
      "Argues that the first screen a new user sees is usually empty, and shows five patterns that turn it into onboarding.",
    author_name: "Lena Fischer",
    domain_tags: ["Design"],
    intent_tags: ["Inspiration"],
    is_favorite: true,
  }),
  post(5, {
    title: "Our RAG pipeline, from messy PDFs to cited answers",
    summary:
      "Covers chunking by headings, hybrid keyword plus vector search, and forcing the model to cite passages, with an evaluation set of 200 questions.",
    author_name: "Priya Nair",
    domain_tags: ["AI", "Data"],
    intent_tags: ["Learning"],
    extracted_link: "https://github.com/run-llama/llama_index",
    link_context: "LlamaIndex — data framework for LLM apps",
  }),
  post(6, {
    title: "10 GitHub repos every frontend developer should star",
    summary:
      "A curated list covering animation, forms, testing and state management, with one line on why each one matters.",
    author_name: "Tom Becker",
    domain_tags: ["Coding", "Development"],
    intent_tags: ["Resources"],
    resources: [
      {
        title: "Motion",
        url: "https://motion.dev",
        description: "Production-ready animation library for React and JS.",
        type: "Tool",
      },
      {
        title: "Playwright",
        url: "https://playwright.dev",
        description: "End-to-end testing across Chromium, Firefox and WebKit.",
        type: "Tool",
      },
    ],
  }),
  post(7, {
    title: "Shipping a side project in 30 days while working full time",
    summary:
      "A week-by-week log of scope cuts, the one metric tracked, and why launching ugly beat waiting for polish.",
    author_name: "Aisha Khan",
    domain_tags: ["Development"],
    intent_tags: ["Inspiration"],
  }),
  post(8, {
    title: "A dashboard that finally made our metrics readable",
    summary:
      "Shows how removing half the charts, adding plain-language captions and fixing the color scale changed how the team used the dashboard.",
    author_name: "Marco Silva",
    domain_tags: ["Data", "Design"],
    intent_tags: ["Cool Build"],
  }),
];

export const DEMO_RESOURCES: Resource[] = [
  {
    id: "demo-r1",
    title: "shadcn/ui",
    url: "https://ui.shadcn.com",
    description: "Copy-paste React components built on Radix and Tailwind.",
    type: "Tool",
    source_urn: "urn:li:activity:demo-0",
    note: "Use the data table example.",
    is_favorite: true,
    created_at: day(0),
  },
  {
    id: "demo-r2",
    title: "Mode SQL Tutorial",
    url: "https://mode.com/sql-tutorial",
    description:
      "Free interactive SQL lessons from basics to window functions.",
    type: "Course",
    source_urn: "urn:li:activity:demo-3",
    note: null,
    is_favorite: false,
    created_at: day(3),
  },
];
