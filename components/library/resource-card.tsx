"use client";

import { Card } from "@heroui/react";
import { ExternalLinkIcon } from "lucide-react";
import Link from "next/link";
import { deleteResource, setResourceNote, toggleResourceFavorite } from "@/app/actions";
import { hostname, timeAgo } from "@/lib/format";
import type { Resource } from "@/lib/resources";
import { ConfirmDelete } from "./confirm-delete";
import { FavoriteButton } from "./favorite-button";
import { NoteField } from "./note-field";
import { useAction } from "./use-action";

const TYPE_STYLES: Record<string, string> = {
  Tool: "bg-blue-500/15 text-blue-700 dark:text-blue-300",
  Article: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-300",
  Repo: "bg-violet-500/15 text-violet-700 dark:text-violet-300",
  List: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Course: "bg-pink-500/15 text-pink-700 dark:text-pink-300",
  Other: "bg-default text-default-foreground",
};

interface ResourceCardProps {
  resource: Resource;
  sourceHref: string | null;
  canEdit: boolean;
}

export function ResourceCard({ resource, sourceHref, canEdit }: ResourceCardProps) {
  const { run } = useAction();

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
        {canEdit && (
          <div className="-mt-1 -mr-2 flex shrink-0 items-center">
            <FavoriteButton
              isFavorite={resource.is_favorite}
              label={resource.title}
              onToggle={(next) => toggleResourceFavorite(resource.id, next)}
            />
            <ConfirmDelete
              itemLabel={resource.title}
              description={`"${resource.title}" will be removed from your Resources. The post it came from stays in your library.`}
              onConfirm={() => run(() => deleteResource(resource.id), "Resource removed")}
            />
          </div>
        )}
      </Card.Header>

      {resource.description && (
        <Card.Content>
          <Card.Description className="text-sm leading-6">{resource.description}</Card.Description>
        </Card.Content>
      )}

      {canEdit ? (
        <NoteField initial={resource.note} onSave={(note) => setResourceNote(resource.id, note)} />
      ) : (
        resource.note && <p className="text-sm whitespace-pre-wrap">{resource.note}</p>
      )}

      <Card.Footer className="justify-between text-xs text-muted">
        <span>Added {timeAgo(resource.created_at)}</span>
        {sourceHref && (
          <Link href={sourceHref} scroll={false} className="hover:underline">
            From post →
          </Link>
        )}
      </Card.Footer>
    </Card>
  );
}
