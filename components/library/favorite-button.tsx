"use client";

import { Button } from "@heroui/react";
import { StarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface FavoriteButtonProps {
  isFavorite: boolean;
  label: string;
  onPress: () => void;
}

export function FavoriteButton({ isFavorite, label, onPress }: FavoriteButtonProps) {
  return (
    <Button
      isIconOnly
      size="sm"
      variant="ghost"
      aria-label={isFavorite ? `Unstar ${label}` : `Star ${label}`}
      aria-pressed={isFavorite}
      onPress={onPress}
    >
      <StarIcon className={cn("size-4", isFavorite ? "fill-amber-400 text-amber-500" : "text-muted")} />
    </Button>
  );
}
