"use client";

import { Button, Drawer, Separator, useOverlayState } from "@heroui/react";
import { ExternalLinkIcon } from "lucide-react";
import { hostname, timeAgo } from "@/lib/format";
import type { Post } from "@/lib/posts";
import type { FoundResource } from "@/lib/resources";
import { AuthorLine } from "./author-line";
import { useEdit } from "./edit-context";
import { FoundResources } from "./found-resources";
import { NoteField } from "./note-field";
import { TagList } from "./tag-chip";
import { TagEditor } from "./tag-editor";

interface PostDetailDrawerProps {
  post: Post | null;
  savedResourceUrls: Set<string>;
  onClose: () => void;
  onNote: (post: Post, note: string) => void;
  onAddResource: (post: Post, resource: FoundResource) => void;
  onTags: (post: Post, tags: string[]) => void;
  tagOptions: string[];
}

function SectionLabel({ children }: { children: React.ReactNode }) {
  return <h3 className="text-xs font-medium tracking-wide text-muted uppercase">{children}</h3>;
}

export function PostDetailDrawer({ post, savedResourceUrls, onClose, onNote, onAddResource, onTags, tagOptions }: PostDetailDrawerProps) {
  const { editable, requireEdit } = useEdit();
  const state = useOverlayState({ isOpen: post !== null, onOpenChange: (open) => !open && onClose() });
  // Posts saved before resource detection only have extracted_link — offer it too.
  const resources: FoundResource[] = post?.resources?.length
    ? post.resources
    : post?.extracted_link
      ? [{ title: post.link_context || hostname(post.extracted_link), url: post.extracted_link, description: post.link_context ?? "", type: "Other" }]
      : [];

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
                    meta={`Saved ${timeAgo(post.synced_at)}`}
                    size="md"
                  />
                  <Drawer.Heading className="text-xl leading-snug text-balance">{post.title}</Drawer.Heading>
                </Drawer.Header>

                <Drawer.Body className="flex flex-col gap-6">
                  <p className="max-w-measure text-[15px] leading-7">{post.summary}</p>
                  {editable ? (
                    <div className="flex flex-col gap-2">
                      <TagList tags={post.intent_tags} />
                      <TagEditor tags={post.domain_tags} suggestions={tagOptions} onChange={(tags) => onTags(post, tags)} />
                    </div>
                  ) : (
                    <TagList tags={[...post.domain_tags, ...post.intent_tags]} />
                  )}

                  {resources.length > 0 && (
                    <section className="flex flex-col gap-2">
                      <SectionLabel>
                        Found in this post <span className="normal-case tracking-normal">· tap + to keep in Resources</span>
                      </SectionLabel>
                      <FoundResources
                        resources={resources}
                        savedUrls={savedResourceUrls}
                        onAdd={(resource) => onAddResource(post, resource)}
                      />
                    </section>
                  )}

                  <section className="flex flex-col gap-2">
                    <SectionLabel>Note</SectionLabel>
                    {editable ? (
                      <NoteField key={post.linkedin_urn} initial={post.note} onSave={(note) => onNote(post, note)} />
                    ) : (
                      <button
                        type="button"
                        onClick={() => requireEdit(() => {})}
                        className="rounded-lg border border-dashed border-border p-3 text-left text-sm text-muted hover:bg-default"
                      >
                        {post.note ? <span className="whitespace-pre-wrap text-foreground">{post.note}</span> : "Add a note…"}
                      </button>
                    )}
                  </section>

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
