"use client";

import { Button, Card, useOverlayState } from "@heroui/react";
import { ExternalLinkIcon, NotebookPenIcon } from "lucide-react";
import { hostname, timeAgo } from "@/lib/format";
import type { Resource } from "@/lib/resources";
import { cn } from "@/lib/utils";
import { ConfirmDelete } from "./confirm-delete";
import { useEdit } from "./edit-context";
import { FavoriteButton } from "./favorite-button";
import { NoteModal } from "./note-modal";

const TYPE_STYLES: Record<string, string> = {
  Tool: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Article: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Repo: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  List: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Course: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  Other: "bg-default text-default-foreground",
};

export interface ResourceHandlers {
  onToggleStar: (resource: Resource) => void;
  onNote: (resource: Resource, note: string) => void;
  onDelete: (resource: Resource) => void;
  onOpenSource: (urn: string) => void;
}

interface ResourceCardProps extends ResourceHandlers {
  resource: Resource;
  compact: boolean;
}

export function ResourceCard({ resource, compact, onToggleStar, onNote, onDelete, onOpenSource }: ResourceCardProps) {
  const noteModal = useOverlayState();
  const { requireEdit } = useEdit();

  return (
    <Card className="gap-3">
      <Card.Header className="flex-row items-start justify-between gap-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="flex items-center gap-2 text-xs text-muted">
            <span className={`rounded-full px-2 py-0.5 font-medium ${TYPE_STYLES[resource.type] ?? TYPE_STYLES.Other}`}>
              {resource.type}
            </span>
            {hostname(resource.url)}
          </span>
          <a
            href={resource.url}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 font-semibold hover:underline"
          >
            <span className="truncate">{resource.title}</span>
            <ExternalLinkIcon className="size-3.5 shrink-0 text-muted" />
          </a>
        </div>
        <div className="-mt-1 -mr-2 flex shrink-0 items-center">
          <FavoriteButton isFavorite={resource.is_favorite} label={resource.title} onPress={() => onToggleStar(resource)} />
          <Button
            isIconOnly
            size="sm"
            variant="ghost"
            aria-label={resource.note ? `Edit note on ${resource.title}` : `Add note to ${resource.title}`}
            onPress={() => requireEdit(noteModal.open)}
          >
            <NotebookPenIcon className={cn("size-4", resource.note ? "text-accent" : "text-muted")} />
          </Button>
          <ConfirmDelete
            itemLabel={resource.title}
            description={`"${resource.title}" will be removed from your Resources. The post it came from stays in your library.`}
            onConfirm={() => onDelete(resource)}
          />
        </div>
      </Card.Header>

      {!compact && resource.description && (
        <Card.Content>
          <Card.Description className="text-sm leading-6">{resource.description}</Card.Description>
        </Card.Content>
      )}

      {resource.note && <p className="rounded-lg bg-surface-secondary p-2.5 text-sm whitespace-pre-wrap">{resource.note}</p>}

      <Card.Footer className="justify-between text-xs text-muted">
        <span>Added {timeAgo(resource.created_at)}</span>
        {resource.source_urn && (
          <button type="button" onClick={() => onOpenSource(resource.source_urn!)} className="hover:underline">
            From post →
          </button>
        )}
      </Card.Footer>

      {noteModal.isOpen && (
        <NoteModal state={noteModal} title={resource.title} initial={resource.note} onSave={(note) => onNote(resource, note)} />
      )}
    </Card>
  );
}
