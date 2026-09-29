import { getPosts, type Post } from "@/lib/posts";
import { getResources, type Resource } from "@/lib/resources";

export const dynamic = "force-dynamic";

function postToMarkdown(post: Post): string {
  const lines = [
    `## ${post.title}`,
    `*${post.author_name}* · [Original post](${post.original_post_url})`,
    "",
    post.summary,
  ];
  for (const r of post.resources ?? []) lines.push(`- [${r.title}](${r.url}) — ${r.description}`);
  const tags = [...post.domain_tags, ...post.intent_tags];
  if (tags.length) lines.push("", tags.map((t) => `#${t.replace(/\s+/g, "")}`).join(" "));
  if (post.note) lines.push("", `> ${post.note.replace(/\n/g, "\n> ")}`);
  return lines.join("\n");
}

function resourceToMarkdown(r: Resource): string {
  const lines = [`- **[${r.title}](${r.url})** (${r.type}) — ${r.description}`];
  if (r.note) lines.push(`  - Note: ${r.note.replace(/\n/g, " ")}`);
  return lines.join("\n");
}

export async function GET(request: Request) {
  const type = new URL(request.url).searchParams.get("type") === "resources" ? "resources" : "posts";
  const date = new Date().toISOString().slice(0, 10);

  const body =
    type === "resources"
      ? `# Gleanings — Resources\n\n${(await getResources({})).map(resourceToMarkdown).join("\n")}\n`
      : `# Gleanings — Library\n\n${(await getPosts({ view: "all" })).map(postToMarkdown).join("\n\n---\n\n")}\n`;

  return new Response(body, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="gleanings-${type}-${date}.md"`,
    },
  });
}
