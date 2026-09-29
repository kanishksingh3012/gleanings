"use client";

import { Button } from "@heroui/react";
import { CheckIcon, ExternalLinkIcon, PlusIcon } from "lucide-react";
import { hostname } from "@/lib/format";
import type { FoundResource } from "@/lib/resources";

interface FoundResourcesProps {
  resources: FoundResource[];
  savedUrls: Set<string>;
  onAdd: (resource: FoundResource) => void;
}

export function FoundResources({ resources, savedUrls, onAdd }: FoundResourcesProps) {
  return (
    <ul className="flex flex-col gap-2">
      {resources.map((resource) => {
        const isSaved = savedUrls.has(resource.url);
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
            <Button
                isIconOnly
                size="sm"
                variant={isSaved ? "ghost" : "secondary"}
                isDisabled={isSaved}
                aria-label={isSaved ? `${resource.title} is in Resources` : `Add ${resource.title} to Resources`}
                onPress={() => onAdd(resource)}
              >
                {isSaved ? <CheckIcon className="size-4 text-success" /> : <PlusIcon className="size-4" />}
              </Button>
          </li>
        );
      })}
    </ul>
  );
}
