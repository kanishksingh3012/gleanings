"use client";

import { Button, Card, useOverlayState } from "@heroui/react";
import { ArchiveIcon, ArchiveRestoreIcon, ExternalLinkIcon, LayersIcon, NotebookPenIcon } from "lucide-react";
import { hostname, timeAgo } from "@/lib/format";
import type { Post } from "@/lib/posts";
import { cn } from "@/lib/utils";
import { AuthorLine } from "./author-line";
import { ConfirmDelete } from "./confirm-delete";
import { useEdit } from "./edit-context";
import { FavoriteButton } from "./favorite-button";
import { NoteModal } from "./note-modal";
import { TagList } from "./tag-chip";

export interface PostHandlers {
  onOpen: (urn: string) => void;
  onToggleStar: (post: Post) => void;
  onToggleArchive: (post: Post) => void;
  onDelete: (post: Post) => void;
  onNote: (post: Post, note: string) => void;
}

interface PostCardProps extends PostHandlers {
  post: Post;
  detailHref: string;
  compact: boolean;
}

export function PostCard({ post, detailHref, compact, onOpen, onToggleStar, onToggleArchive, onDelete, onNote }: PostCardProps) {
  const noteModal = useOverlayState();
  const { requireEdit } = useEdit();
  const archived = post.status === "archived";
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
        <div className="-mt-1 -mr-2 flex shrink-0 items-center">
          <FavoriteButton isFavorite={post.is_favorite} label={post.title} onPress={() => onToggleStar(post)} />
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={post.note ? `Edit note on ${post.title}` : `Add note to ${post.title}`}
            onPress={() => requireEdit(noteModal.open)}
          >
            <NotebookPenIcon className={cn("size-4", post.note ? "text-accent" : "text-muted")} />
          </Button>
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={archived ? `Restore ${post.title}` : `Archive ${post.title}`}
            onPress={() => onToggleArchive(post)}
          >
            {archived ? <ArchiveRestoreIcon className="size-4 text-muted" /> : <ArchiveIcon className="size-4 text-muted" />}
          </Button>
          <ConfirmDelete
            itemLabel={post.title}
            description={`"${post.title}" will be removed from your library. Archive it instead if you might want it back.`}
            onConfirm={() => onDelete(post)}
          />
        </div>
      </Card.Header>

      <Card.Content className="gap-1.5">
        <a
          href={detailHref}
          onClick={(e) => {
            e.preventDefault();
            onOpen(post.linkedin_urn);
          }}
          className="flex flex-col gap-1.5"
        >
          <Card.Title className="text-base leading-snug text-balance group-hover:underline">{post.title}</Card.Title>
          <Card.Description className={cn("max-w-measure text-sm leading-6", compact ? "line-clamp-1" : "line-clamp-3")}>
            {post.summary}
          </Card.Description>
        </a>
      </Card.Content>

      {!compact && post.extracted_link && (
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
        {resourceCount > 0 && (
          <span className="flex items-center gap-1 text-xs text-muted" title={`${resourceCount} resources found`}>
            <LayersIcon className="size-3.5" /> {resourceCount}
          </span>
        )}
      </Card.Footer>

      {noteModal.isOpen && (
        <NoteModal state={noteModal} title={post.title} initial={post.note} onSave={(note) => onNote(post, note)} />
      )}
    </Card>
  );
}
