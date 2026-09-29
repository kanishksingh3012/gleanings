"use client";

import { Button } from "@heroui/react";
import { ArchiveIcon, ArchiveRestoreIcon } from "lucide-react";
import { archivePost, deletePost, togglePostFavorite, unarchivePost } from "@/app/actions";
import { ConfirmDelete } from "./confirm-delete";
import { FavoriteButton } from "./favorite-button";
import { useAction } from "./use-action";

interface PostActionsProps {
  urn: string;
  title: string;
  archived: boolean;
  isFavorite: boolean;
}

export function PostActions({ urn, title, archived, isFavorite }: PostActionsProps) {
  const { pending, run } = useAction();

  return (
    <div className="flex items-center">
      <FavoriteButton isFavorite={isFavorite} label={title} onToggle={(next) => togglePostFavorite(urn, next)} />
      <Button
        isIconOnly
        size="sm"
        variant="ghost"
        isDisabled={pending}
        aria-label={archived ? `Restore ${title}` : `Archive ${title}`}
        onPress={() =>
          archived
            ? run(() => unarchivePost(urn), "Moved back to library")
            : run(() => archivePost(urn), "Archived")
        }
      >
        {archived ? <ArchiveRestoreIcon className="size-4 text-muted" /> : <ArchiveIcon className="size-4 text-muted" />}
      </Button>
      <ConfirmDelete
        itemLabel={title}
        description={`"${title}" will be removed from your library. Archive it instead if you might want it back.`}
        onConfirm={() => run(() => deletePost(urn), "Post deleted")}
      />
    </div>
  );
}
