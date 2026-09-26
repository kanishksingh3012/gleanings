"use client";

import { ExternalLinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { hostname } from "@/lib/format";
import type { Post } from "@/lib/posts";
import { AuthorLine } from "./author-line";

interface PostDetailSheetProps {
  post: Post | null;
  closeHref: string;
  savedLabel: string | null;
}

/** Slide-over driven by the `?post=` URL param, so a post can be linked to directly. */
export function PostDetailSheet({ post, closeHref, savedLabel }: PostDetailSheetProps) {
  const router = useRouter();

  return (
    <Sheet open={post !== null} onOpenChange={(open) => !open && router.replace(closeHref, { scroll: false })}>
      <SheetContent className="w-full gap-0 overflow-y-auto sm:max-w-lg">
        {post && (
          <>
            <SheetHeader className="gap-3 p-6 pb-4">
              <AuthorLine name={post.author_name} url={post.author_url} avatarUrl={post.author_avatar_url} size="md" />
              <SheetTitle className="text-xl leading-snug text-balance">{post.title}</SheetTitle>
              {savedLabel && <SheetDescription>Saved {savedLabel}</SheetDescription>}
            </SheetHeader>

            <div className="flex flex-col gap-6 px-6 pb-6">
              <p className="max-w-measure text-[15px] leading-7">{post.summary}</p>

              {post.extracted_link && (
                <a
                  href={post.extracted_link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex flex-col gap-0.5 rounded-lg border bg-muted p-3 text-sm transition-colors hover:bg-accent"
                >
                  <span className="flex items-center gap-1.5 font-medium">
                    <ExternalLinkIcon className="size-3.5" />
                    {hostname(post.extracted_link)}
                  </span>
                  {post.link_context && <span className="text-muted-foreground">{post.link_context}</span>}
                </a>
              )}

              {(post.domain_tags.length > 0 || post.intent_tags.length > 0) && (
                <div className="flex flex-wrap gap-1.5">
                  {[...post.domain_tags, ...post.intent_tags].map((tag) => (
                    <Badge key={tag} variant="secondary" className="font-normal">
                      {tag}
                    </Badge>
                  ))}
                </div>
              )}

              <Separator />

              <Button asChild variant="outline" className="self-start">
                <a href={post.original_post_url} target="_blank" rel="noopener noreferrer">
                  Open on LinkedIn <ExternalLinkIcon />
                </a>
              </Button>
            </div>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
}
