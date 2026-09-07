import { getSupabaseAdmin } from "@/lib/supabaseAdmin";

// This reads live data from Supabase on every request — without this, Next
// would statically prerender the page at build time and freeze whatever
// posts existed then, never showing newly synced posts without a rebuild.
export const dynamic = "force-dynamic";

interface PostRow {
  linkedin_urn: string;
  title: string;
  summary: string;
  author_name: string;
  author_url: string | null;
  author_avatar_url: string | null;
  original_post_url: string;
  extracted_link: string | null;
  link_context: string | null;
  intent_tags: string[];
  domain_tags: string[];
  created_at: string;
}

async function getPosts(): Promise<PostRow[]> {
  const supabase = getSupabaseAdmin();
  const { data, error } = await supabase
    .from("posts")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    throw new Error(`Failed to load posts: ${error.message}`);
  }

  return data ?? [];
}

function Badge({ children }: { children: string }) {
  return (
    <span className="rounded-full bg-zinc-100 px-2.5 py-0.5 text-xs font-medium text-zinc-700 dark:bg-zinc-800 dark:text-zinc-300">
      {children}
    </span>
  );
}

function PostCard({ post }: { post: PostRow }) {
  return (
    <article className="rounded-xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-950">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {post.domain_tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
        {post.intent_tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-50">{post.title}</h2>

      <div className="mb-3 flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
        {post.author_avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external, unknown-domain avatar URLs mirrored from LinkedIn/Supabase Storage
          <img
            src={post.author_avatar_url}
            alt={post.author_name}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="h-6 w-6 rounded-full bg-zinc-200 dark:bg-zinc-800" />
        )}
        {post.author_url ? (
          <a href={post.author_url} className="font-medium hover:underline" target="_blank" rel="noopener noreferrer">
            {post.author_name}
          </a>
        ) : (
          <span className="font-medium">{post.author_name}</span>
        )}
        <span>·</span>
        <a
          href={post.original_post_url}
          className="hover:underline"
          target="_blank"
          rel="noopener noreferrer"
        >
          View original post
        </a>
      </div>

      <p className="mb-3 text-sm leading-6 text-zinc-700 dark:text-zinc-300">{post.summary}</p>

      {post.extracted_link && (
        <a
          href={post.extracted_link}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border border-zinc-200 bg-zinc-50 p-3 text-sm hover:border-zinc-300 dark:border-zinc-800 dark:bg-zinc-900 dark:hover:border-zinc-700"
        >
          <div className="truncate font-medium text-zinc-800 dark:text-zinc-200">{post.extracted_link}</div>
          {post.link_context && (
            <div className="mt-0.5 text-zinc-500 dark:text-zinc-500">{post.link_context}</div>
          )}
        </a>
      )}

      <div className="mt-3 text-xs text-zinc-400 dark:text-zinc-600">
        {new Date(post.created_at).toLocaleString()}
      </div>
    </article>
  );
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-zinc-50 px-4 py-10 dark:bg-black">
      <main className="mx-auto flex max-w-2xl flex-col gap-4">
        <h1 className="text-2xl font-semibold text-zinc-900 dark:text-zinc-50">
          Post Library
        </h1>

        {posts.length === 0 ? (
          <p className="text-zinc-500 dark:text-zinc-400">
            No posts synced yet. POST to <code>/api/sync</code> to add one.
          </p>
        ) : (
          posts.map((post) => <PostCard key={post.linkedin_urn} post={post} />)
        )}
      </main>
    </div>
  );
}
