import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { timeAgo, hostname } from "@/lib/format";
import type { Post } from "@/lib/posts";
import { AuthorLine } from "./author-line";
import { PostActions } from "./post-actions";

interface PostCardProps {
  post: Post;
  detailHref: string;
  canEdit: boolean;
}

export function PostCard({ post, detailHref, canEdit }: PostCardProps) {
  const tags = [...post.domain_tags, ...post.intent_tags];

  return (
    <article className="group flex flex-col gap-3 rounded-xl border bg-card p-5 text-card-foreground transition-colors hover:border-ring/40">
      <div className="flex items-start justify-between gap-3">
        <AuthorLine
          name={post.author_name}
          url={post.author_url}
          avatarUrl={post.author_avatar_url}
          meta={timeAgo(post.created_at)}
        />
        {canEdit && (
          <div className="-mt-1.5 -mr-2">
            <PostActions urn={post.linkedin_urn} title={post.title} archived={post.status === "archived"} />
          </div>
        )}
      </div>

      <Link href={detailHref} scroll={false} className="flex flex-col gap-1.5 outline-none">
        <h2 className="text-base leading-snug font-semibold text-balance group-hover:underline">{post.title}</h2>
        <p className="line-clamp-3 max-w-measure text-sm leading-6 text-muted-foreground">{post.summary}</p>
      </Link>

      {post.extracted_link && (
        <a
          href={post.extracted_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2 text-sm transition-colors hover:bg-accent"
        >
          <ExternalLinkIcon className="size-3.5 shrink-0 text-muted-foreground" />
          <span className="truncate">{post.link_context || hostname(post.extracted_link)}</span>
        </a>
      )}

      {tags.length > 0 && (
        <div className="mt-auto flex flex-wrap gap-1.5 pt-1">
          {tags.map((tag) => (
            <Badge key={tag} variant="secondary" className="font-normal">
              {tag}
            </Badge>
          ))}
        </div>
      )}
    </article>
  );
}
