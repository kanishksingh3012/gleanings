import { EditProvider } from "@/components/library/edit-context";
import { LibraryApp } from "@/components/library/library-app";
import { canEdit, isPasswordConfigured } from "@/lib/auth";
import { getAllPosts } from "@/lib/posts";
import { getAllResources } from "@/lib/resources";

// Reads live data on every request instead of freezing it at build time.
export const dynamic = "force-dynamic";

/** One round trip loads the whole library; everything after that runs in the browser. */
export default async function Home({ searchParams }: PageProps<"/">) {
  const [params, posts, resources, editable] = await Promise.all([searchParams, getAllPosts(), getAllResources(), canEdit()]);

  return (
    <EditProvider initialEditable={editable} configured={isPasswordConfigured()}>
      <LibraryApp initialPosts={posts} initialResources={resources} initialParams={params} />
    </EditProvider>
  );
}
