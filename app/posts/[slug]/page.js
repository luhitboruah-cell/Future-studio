import { createServerSupabase } from '@/lib/supabaseServer';

export default async function PostPage({ params }) {
  const supabase = createServerSupabase();
  const { data: { user } } = await supabase.auth.getUser();

  const { data: post } = await supabase
    .from('posts')
    .select('*, series:series_id(title, slug)')
    .eq('slug', params.slug)
    .eq('status', 'published')
    .single();

  if (!post) {
    return <div className="card">Post not found.</div>;
  }

  let hasAccess = post.visibility === 'public';

  if (!hasAccess && user) {
    if (post.visibility === 'paid') {
      const { data: purchase } = await supabase
        .from('purchases')
        .select('id')
        .eq('user_id', user.id)
        .eq('post_id', post.id)
        .eq('status', 'paid')
        .maybeSingle();
      hasAccess = !!purchase;
    }
    if (post.visibility === 'subscriber') {
      const { data: profile } = await supabase
        .from('profiles')
        .select('tier_id, role')
        .eq('id', user.id)
        .single();
      hasAccess = profile?.role === 'admin' || profile?.tier_id === post.required_tier_id;
    }
  }

  return (
    <article>
      <h1>{post.title}</h1>
      {post.series?.title && <p style={{ color: 'var(--muted)' }}>Part of {post.series.title}</p>}
      {hasAccess ? (
        <>
          {post.type === 'chapter' && (
            <div style={{ whiteSpace: 'pre-wrap', lineHeight: 1.7 }}>{post.body}</div>
          )}
          {post.type === 'artwork' && post.media_url && (
            <img src={post.media_url} alt={post.title} style={{ maxWidth: '100%', borderRadius: 8 }} />
          )}
          {post.type === 'audio' && post.media_url && (
            <audio controls src={post.media_url} style={{ width: '100%' }} />
          )}
          {post.type === 'video' && post.media_url && (
            <video controls src={post.media_url} style={{ width: '100%', borderRadius: 8 }} />
          )}
        </>
      ) : (
        <div className="card">
          <p>This {post.type} is {post.visibility === 'paid' ? 'a paid unlock' : 'for subscribers only'}.</p>
          {!user && <p><a href="/login">Log in</a> to purchase or check your access.</p>}
        </div>
      )}
    </article>
  );
}
