# Studio — Phase 1 (Core CMS)

What's included: auth (magic link login), admin-only post editor with file upload,
public reading pages, paid/subscriber visibility gating (payment collection wires in Phase 3).

## Setup (about 15 minutes)

### 1. Create your Supabase project
- Go to https://supabase.com → New Project (free tier)
- Once created, go to **SQL Editor** → paste the contents of `supabase/schema.sql` → Run
- Go to **Storage** → Create a new bucket called `media` → make it **Public**
- Go to **Settings → API** → copy your Project URL and `anon` public key

### 2. Configure environment
```bash
cp .env.example .env.local
# paste your Supabase URL and anon key into .env.local
```

### 3. Install and run
```bash
npm install
npm run dev
```
Visit http://localhost:3000

### 4. Make yourself admin
- Sign up on the site once (via /login, using your own email)
- In Supabase → Table Editor → `profiles`, find your row
- Change `role` from `reader` to `admin`
- Now `/admin` is accessible to you (and only you)

### 5. Try it
- Go to `/admin` → New Post → write a chapter or upload an image → set status to Published
- It appears on the homepage and at `/posts/your-slug`

## What's NOT wired yet (later phases)
- **Payments** — "Paid" and "Subscriber" posts show a locked message but there's no
  checkout yet. Phase 3 adds Razorpay for one-time purchases and subscriptions.
- **Video/audio transcoding** — files upload as-is to Supabase Storage. Phase 2 adds
  proper streaming-optimized delivery (Cloudflare Stream/Mux) for larger files.
- **Email notifications** — no "new chapter" alerts yet. Phase 4.
- **Domain** — currently runs on localhost / a Vercel preview URL. Point your real
  domain at it once you're ready to launch (Vercel → Settings → Domains).

## Deploying
Easiest path: push this folder to a GitHub repo, then import it at vercel.com —
it auto-detects Next.js. Add the same two env vars there under Project Settings → Environment Variables.
