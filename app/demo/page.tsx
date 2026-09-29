import type { Metadata } from "next";
import { EditProvider } from "@/components/library/edit-context";
import { LibraryApp } from "@/components/library/library-app";
import { DEMO_POSTS, DEMO_RESOURCES } from "@/lib/demo-data";

export const metadata: Metadata = { title: "Gleanings · Demo" };

/** Public sandbox: sample data, every edit stays in the visitor's browser tab. */
export default async function Demo({ searchParams }: PageProps<"/demo">) {
  return (
    <EditProvider initialEditable configured={false}>
      <LibraryApp
        demo
        initialPosts={DEMO_POSTS}
        initialResources={DEMO_RESOURCES}
        initialParams={await searchParams}
      />
    </EditProvider>
  );
}
