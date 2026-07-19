'use client';
import { useState, useEffect } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabaseClient';

export default function EditorPage() {
  const supabase = createClient();
  const router = useRouter();
  const searchParams = useSearchParams();
  const postId = searchParams.get('id');

  const [form, setForm] = useState({
    title: '', slug: '', type: 'chapter', body: '', media_url: '',
    visibility: 'public', price_inr: 0, status: 'draft', publish_at: '',
  });
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (postId) {
      supabase.from('posts').select('*').eq('id', postId).single()
        .then(({ data }) => { if (data) setForm(data); });
    }
  }, [postId]);

  function update(field, value) { setForm((f) => ({ ...f, [field]: value })); }

  function autoSlug(title) {
    return title.toLowerCase().trim().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
  }

  async function handleFileUpload(e) {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const path = `${Date.now()}-${file.name}`;
    const { data, error } = await supabase.storage.from('media').upload(path, file);
    if (!error) {
      const { data: pub } = supabase.storage.from('media').getPublicUrl(path);
      update('media_url', pub.publicUrl);
    }
    setUploading(false);
  }

  async function handleSave(e) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, slug: form.slug || autoSlug(form.title) };
    if (postId) { await supabase.from('posts').update(payload).eq('id', postId); }
    else { await supabase.from('posts').insert(payload); }
    setSaving(false);
    router.push('/admin');
  }

  return (
    <form onSubmit={handleSave} className="card">
      <h1>{postId ? 'Edit Post' : 'New Post'}</h1>
      <label>Title</label>
      <input required value={form.title} onChange={(e) => update('title', e.target.value)} style={{ width: '100%' }} />
      <label>Slug (auto-generated if left blank)</label>
      <input value={form.slug} onChange={(e) => update('slug', e.target.value)} style={{ width: '100%' }} />
      <label>Type</label>
      <select value={form.type} onChange={(e) => update('type', e.target.value)}>
        <option value="chapter">Chapter / Writing</option>
        <option value="artwork">Artwork / Image</option>
        <option value="audio">Audio</option>
        <option value="video">Video</option>
      </select>
      {form.type === 'chapter' ? (
        <>
          <label>Body</label>
          <textarea rows={12} value={form.body || ''} onChange={(e) => update('body', e.target.value)} style={{ width: '100%' }} />
        </>
      ) : (
        <>
          <label>Upload media</label>
          <input type="file" onChange={handleFileUpload} />
          {uploading && <p>Uploading...</p>}
          {form.media_url && <p style={{ color: 'var(--muted)', fontSize: '0.85rem' }}>Uploaded: {form.media_url}</p>}
        </>
      )}
      <label>Visibility</label>
      <select value={form.visibility} onChange={(e) => update('visibility', e.target.value)}>
        <option value="public">Public (free)</option>
        <option value="paid">Paid unlock</option>
        <option value="subscriber">Subscribers only</option>
      </select>
      {form.visibility === 'paid' && (
        <>
          <label>Price (INR)</label>
          <input type="number" value={form.price_inr} onChange={(e) => update('price_inr', Number(e.target.value))} />
        </>
      )}
      <label>Status</label>
      <select value={form.status} onChange={(e) => update('status', e.target.value)}>
        <option value="draft">Draft</option>
        <option value="scheduled">Scheduled</option>
        <option value="published">Published</option>
      </select>
      {form.status === 'scheduled' && (
        <>
          <label>Publish at</label>
          <input type="datetime-local" value={form.publish_at || ''} onChange={(e) => update('publish_at', e.target.value)} />
        </>
      )}
      <button type="submit" disabled={saving} style={{ marginTop: 20 }}>{saving ? 'Saving...' : 'Save Post'}</button>
    </form>
  );
      }
