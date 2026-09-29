"use client";

import { Button } from "@heroui/react";
import { CheckIcon, ExternalLinkIcon, PlusIcon } from "lucide-react";
import { useOptimistic } from "react";
import { addResource } from "@/app/actions";
import { hostname } from "@/lib/format";
import type { FoundResource } from "@/lib/resources";
import { useAction } from "./use-action";

interface FoundResourcesProps {
  sourceUrn: string;
  resources: FoundResource[];
  savedUrls: string[];
  canEdit: boolean;
}

export function FoundResources({ sourceUrn, resources, savedUrls, canEdit }: FoundResourcesProps) {
  const [saved, markSaved] = useOptimistic(new Set(savedUrls), (current, url: string) => new Set(current).add(url));
  const { run } = useAction();

  return (
    <ul className="flex flex-col gap-2">
      {resources.map((resource) => {
        const isSaved = saved.has(resource.url);
        return (
          <li key={resource.url} className="flex items-start gap-3 rounded-lg border border-border p-3">
            <div className="flex min-w-0 flex-1 flex-col gap-0.5">
              <a
                href={resource.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 text-sm font-medium hover:underline"
              >
                <span className="truncate">{resource.title}</span>
                <ExternalLinkIcon className="size-3 shrink-0 text-muted" />
              </a>
              <span className="text-xs text-muted">
                {resource.type} · {hostname(resource.url)}
              </span>
              {resource.description && <p className="text-sm text-muted">{resource.description}</p>}
            </div>
            {canEdit && (
              <Button
                size="sm"
                variant={isSaved ? "ghost" : "secondary"}
                isDisabled={isSaved}
                onPress={() =>
                  run(async () => {
                    markSaved(resource.url);
                    await addResource(sourceUrn, resource);
                  }, "Added to Resources")
                }
              >
                {isSaved ? <CheckIcon className="size-4" /> : <PlusIcon className="size-4" />}
                {isSaved ? "Added" : "Add"}
              </Button>
            )}
          </li>
        );
      })}
    </ul>
  );
}
