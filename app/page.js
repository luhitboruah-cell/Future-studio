import { createServerSupabase } from '@/lib/supabaseServer';

export default async function HomePage() {
  const supabase = createServerSupabase();
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, type, visibility, created_at, series:series_id(title)')
    .eq('status', 'published')
    .order('created_at', { ascending: false })
    .limit(20);

  return (
    <div>
      <h1>Latest</h1>
      {(!posts || posts.length === 0) && (
        <p style={{ color: 'var(--muted)' }}>No posts published yet.</p>
      )}
      {posts?.map((post) => (
        <a key={post.id} href={`/posts/${post.slug}`} style={{ textDecoration: 'none' }}>
          <div className="card">
            <strong>{post.title}</strong>
            <span className="badge">{post.type}</span>
            {post.visibility !== 'public' && <span className="badge">{post.visibility}</span>}
            {post.series?.title && (
              <div style={{ color: 'var(--muted)', fontSize: '0.85rem', marginTop: 4 }}>
                from {post.series.title}
              </div>
            )}
          </div>
        </a>
      ))}
    </div>
  );
                }
