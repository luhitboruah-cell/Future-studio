import { createServerSupabase } from '@/lib/supabaseServer';

export default async function AdminDashboard() {
  const supabase = createServerSupabase();
  const { data: posts } = await supabase
    .from('posts')
    .select('id, title, slug, type, status, visibility, created_at')
    .order('created_at', { ascending: false });

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1>Admin Studio</h1>
        <a href="/admin/editor"><button>+ New Post</button></a>
      </div>
      {posts?.map((post) => (
        <div key={post.id} className="card" style={{ display: 'flex', justifyContent: 'space-between' }}>
          <div>
            <strong>{post.title}</strong>
            <span className="badge">{post.type}</span>
            <span className="badge">{post.status}</span>
            <span className="badge">{post.visibility}</span>
          </div>
          <a href={`/admin/editor?id=${post.id}`}>Edit</a>
        </div>
      ))}
      {(!posts || posts.length === 0) && <p style={{ color: 'var(--muted)' }}>No posts yet. Create your first one.</p>}
    </div>
  );
}
