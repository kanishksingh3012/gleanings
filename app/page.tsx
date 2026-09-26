import { ThemeToggle } from "@/components/theme-toggle";
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
    <span className="rounded-full bg-secondary px-2.5 py-0.5 text-xs font-medium text-secondary-foreground">
      {children}
    </span>
  );
}

function PostCard({ post }: { post: PostRow }) {
  return (
    <article className="rounded-xl border bg-card p-5 text-card-foreground">
      <div className="mb-2 flex flex-wrap gap-1.5">
        {post.domain_tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
        {post.intent_tags.map((tag) => (
          <Badge key={tag}>{tag}</Badge>
        ))}
      </div>

      <h2 className="mb-2 text-lg font-semibold">{post.title}</h2>

      <div className="mb-3 flex items-center gap-2 text-sm text-muted-foreground">
        {post.author_avatar_url ? (
          // eslint-disable-next-line @next/next/no-img-element -- external, unknown-domain avatar URLs mirrored from LinkedIn/Supabase Storage
          <img
            src={post.author_avatar_url}
            alt={post.author_name}
            className="h-6 w-6 rounded-full object-cover"
          />
        ) : (
          <span className="h-6 w-6 rounded-full bg-muted" />
        )}
        {post.author_url ? (
          <a href={post.author_url} className="font-medium hover:underline" target="_blank" rel="noopener noreferrer">
            {post.author_name}
          </a>
        ) : (
          <span className="font-medium">{post.author_name}</span>
        )}
        <span>·</span>
        <a href={post.original_post_url} className="hover:underline" target="_blank" rel="noopener noreferrer">
          View original post
        </a>
      </div>

      <p className="mb-3 max-w-measure text-sm leading-6">{post.summary}</p>

      {post.extracted_link && (
        <a
          href={post.extracted_link}
          target="_blank"
          rel="noopener noreferrer"
          className="block rounded-lg border bg-muted p-3 text-sm transition-colors hover:bg-accent"
        >
          <div className="truncate font-medium">{post.extracted_link}</div>
          {post.link_context && <div className="mt-0.5 text-muted-foreground">{post.link_context}</div>}
        </a>
      )}

      <div className="mt-3 text-xs text-muted-foreground">{new Date(post.created_at).toLocaleString()}</div>
    </article>
  );
}

export default async function Home() {
  const posts = await getPosts();

  return (
    <div className="min-h-screen bg-background px-4 py-10">
      <main className="mx-auto flex max-w-reading flex-col gap-4">
        <header className="mb-4 flex items-center justify-between">
          <h1 className="text-2xl font-semibold tracking-tight">Post Library</h1>
          <ThemeToggle />
        </header>

        {posts.length === 0 ? (
          <p className="text-muted-foreground">No posts saved yet.</p>
        ) : (
          posts.map((post) => <PostCard key={post.linkedin_urn} post={post} />)
        )}
      </main>
    </div>
  );
}
