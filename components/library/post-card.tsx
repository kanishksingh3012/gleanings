import { Card } from "@heroui/react";
import { ExternalLinkIcon, LayersIcon, StickyNoteIcon } from "lucide-react";
import Link from "next/link";
import { hostname, timeAgo } from "@/lib/format";
import type { Post } from "@/lib/posts";
import { AuthorLine } from "./author-line";
import { PostActions } from "./post-actions";
import { TagList } from "./tag-chip";

interface PostCardProps {
  post: Post;
  detailHref: string;
  canEdit: boolean;
}

export function PostCard({ post, detailHref, canEdit }: PostCardProps) {
  const resourceCount = post.resources?.length ?? 0;

  return (
    <Card className="group gap-3 transition-shadow hover:shadow-md">
      <Card.Header className="flex-row items-start justify-between gap-3">
        <AuthorLine
          name={post.author_name}
          url={post.author_url}
          avatarUrl={post.author_avatar_url}
          meta={timeAgo(post.created_at)}
        />
        {canEdit && (
          <div className="-mt-1 -mr-2 shrink-0">
            <PostActions
              urn={post.linkedin_urn}
              title={post.title}
              archived={post.status === "archived"}
              isFavorite={post.is_favorite}
            />
          </div>
        )}
      </Card.Header>

      <Card.Content className="gap-1.5">
        <Link href={detailHref} scroll={false} className="flex flex-col gap-1.5">
          <Card.Title className="text-base leading-snug text-balance group-hover:underline">{post.title}</Card.Title>
          <Card.Description className="line-clamp-3 max-w-measure text-sm leading-6">{post.summary}</Card.Description>
        </Link>
      </Card.Content>

      {post.extracted_link && (
        <a
          href={post.extracted_link}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-2 rounded-lg bg-surface-secondary px-3 py-2 text-sm transition-colors hover:bg-surface-tertiary"
        >
          <ExternalLinkIcon className="size-3.5 shrink-0 text-muted" />
          <span className="truncate">{post.link_context || hostname(post.extracted_link)}</span>
        </a>
      )}

      <Card.Footer className="mt-auto flex-wrap items-center justify-between gap-2 pt-1">
        <TagList tags={[...post.domain_tags, ...post.intent_tags]} />
        <div className="flex items-center gap-3 text-xs text-muted">
          {resourceCount > 0 && (
            <span className="flex items-center gap-1">
              <LayersIcon className="size-3.5" /> {resourceCount}
            </span>
          )}
          {post.note && <StickyNoteIcon className="size-3.5" aria-label="Has a note" />}
          {!canEdit && post.is_favorite && <span aria-label="Starred">★</span>}
        </div>
      </Card.Footer>
    </Card>
  );
}
