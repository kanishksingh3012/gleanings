"use client";

import { Button } from "@heroui/react";
import { StarIcon } from "lucide-react";
import { useOptimistic } from "react";
import { cn } from "@/lib/utils";
import { useAction } from "./use-action";

interface FavoriteButtonProps {
  isFavorite: boolean;
  label: string;
  onToggle: (next: boolean) => Promise<void>;
}

export function FavoriteButton({ isFavorite, label, onToggle }: FavoriteButtonProps) {
  const [optimistic, setOptimistic] = useOptimistic(isFavorite);
  const { run } = useAction();

  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={optimistic ? `Unstar ${label}` : `Star ${label}`}
      aria-pressed={optimistic}
      onPress={() =>
        run(async () => {
          setOptimistic(!optimistic);
          await onToggle(!optimistic);
        })
      }
    >
      <StarIcon className={cn("size-4", optimistic ? "fill-amber-400 text-amber-500" : "text-muted")} />
    </Button>
  );
}
