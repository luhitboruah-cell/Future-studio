'use client';
import { useState } from 'react';
import { createClient } from '@/lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [sent, setSent] = useState(false);
  const [error, setError] = useState('');
  const supabase = createClient();

  async function handleSubmit(e) {
    e.preventDefault();
    setError('');
    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: { emailRedirectTo: `${window.location.origin}/` },
    });
    if (error) setError(error.message);
    else setSent(true);
  }

  return (
    <div className="card" style={{ maxWidth: 400 }}>
      <h1>Log in</h1>
      {sent ? (
        <p>Check your email for a login link.</p>
      ) : (
        <form onSubmit={handleSubmit}>
          <label>Email</label>
          <input type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" style={{ width: '100%' }} />
          <button type="submit" style={{ marginTop: 16, width: '100%' }}>Send login link</button>
          {error && <p style={{ color: '#FB7185' }}>{error}</p>}
        </form>
      )}
    </div>
  );
}
