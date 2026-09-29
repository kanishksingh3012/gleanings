"use client";

import { Button, Drawer, Separator, useOverlayState } from "@heroui/react";
import { ExternalLinkIcon } from "lucide-react";
import { useRouter } from "next/navigation";
import { setPostNote } from "@/app/actions";
import { hostname } from "@/lib/format";
import type { Post } from "@/lib/posts";
import { AuthorLine } from "./author-line";
import { FoundResources } from "./found-resources";
import { NoteField } from "./note-field";
import { TagList } from "./tag-chip";

interface PostDetailDrawerProps {
  post: Post | null;
  closeHref: string;
  savedLabel: string | null;
  savedResourceUrls: string[];
  canEdit: boolean;
}

function SectionLabel({ children }: { children: string }) {
  return <h3 className="text-xs font-medium tracking-wide text-muted uppercase">{children}</h3>;
}

/** Slide-over driven by the `?post=` URL param, so a post can be linked to directly. */
export function PostDetailDrawer({ post, closeHref, savedLabel, savedResourceUrls, canEdit }: PostDetailDrawerProps) {
  const router = useRouter();
  const state = useOverlayState({
    isOpen: post !== null,
    onOpenChange: (open) => !open && router.replace(closeHref, { scroll: false }),
  });
  const resources = post?.resources ?? [];

  return (
    <Drawer state={state}>
      <Drawer.Backdrop>
        <Drawer.Content placement="right">
          <Drawer.Dialog className="w-full overflow-y-auto sm:max-w-lg">
            {post && (
              <>
                <Drawer.CloseTrigger />
                <Drawer.Header className="flex flex-col items-start gap-3">
                  <AuthorLine
                    name={post.author_name}
                    url={post.author_url}
                    avatarUrl={post.author_avatar_url}
                    meta={savedLabel ? `Saved ${savedLabel}` : undefined}
                    size="md"
                  />
                  <Drawer.Heading className="text-xl leading-snug text-balance">{post.title}</Drawer.Heading>
                </Drawer.Header>

                <Drawer.Body className="flex flex-col gap-6">
                  <p className="max-w-measure text-[15px] leading-7">{post.summary}</p>
                  <TagList tags={[...post.domain_tags, ...post.intent_tags]} />

                  {post.extracted_link && resources.length === 0 && (
                    <a
                      href={post.extracted_link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex flex-col gap-0.5 rounded-lg bg-surface-secondary p-3 text-sm hover:bg-surface-tertiary"
                    >
                      <span className="flex items-center gap-1.5 font-medium">
                        <ExternalLinkIcon className="size-3.5" />
                        {hostname(post.extracted_link)}
                      </span>
                      {post.link_context && <span className="text-muted">{post.link_context}</span>}
                    </a>
                  )}

                  {resources.length > 0 && (
                    <section className="flex flex-col gap-2">
                      <SectionLabel>Found in this post</SectionLabel>
                      <FoundResources
                        sourceUrn={post.linkedin_urn}
                        resources={resources}
                        savedUrls={savedResourceUrls}
                        canEdit={canEdit}
                      />
                    </section>
                  )}

                  {(canEdit || post.note) && (
                    <section className="flex flex-col gap-2">
                      <SectionLabel>Note</SectionLabel>
                      {canEdit ? (
                        <NoteField
                          key={post.linkedin_urn}
                          initial={post.note}
                          onSave={(note) => setPostNote(post.linkedin_urn, note)}
                        />
                      ) : (
                        <p className="text-sm whitespace-pre-wrap">{post.note}</p>
                      )}
                    </section>
                  )}

                  <Separator />

                  <a href={post.original_post_url} target="_blank" rel="noopener noreferrer" className="self-start">
                    <Button variant="outline">
                      Open on LinkedIn <ExternalLinkIcon className="size-4" />
                    </Button>
                  </a>
                </Drawer.Body>
              </>
            )}
          </Drawer.Dialog>
        </Drawer.Content>
      </Drawer.Backdrop>
    </Drawer>
  );
}
