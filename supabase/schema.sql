-- ============================================================
-- STUDIO PLATFORM — Phase 1 schema
-- Run this in Supabase SQL Editor after creating your project
-- ============================================================

-- Profiles: extends Supabase auth.users with role + display info
create table profiles (
  id uuid references auth.users on delete cascade primary key,
  display_name text,
  role text not null default 'reader' check (role in ('admin','subscriber','reader')),
  tier_id uuid,
  created_at timestamptz default now()
);

-- Membership tiers you define (Phase 3 will use price/perks; created now so schema is stable)
create table tiers (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  price_inr numeric not null default 0,
  perks text,
  sort_order int default 0,
  created_at timestamptz default now()
);

alter table profiles
  add constraint profiles_tier_fk foreign key (tier_id) references tiers(id);

-- Series: groups of posts (a novel, a season, an album, etc.)
create table series (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text unique not null,
  description text,
  language text default 'en' check (language in ('en','as')),
  cover_url text,
  created_at timestamptz default now()
);

-- Posts: chapters, artworks, audio, video — any single piece of content
create table posts (
  id uuid primary key default gen_random_uuid(),
  series_id uuid references series(id) on delete set null,
  type text not null check (type in ('chapter','artwork','audio','video')),
  title text not null,
  slug text unique not null,
  body text,                     -- rich text / markdown for chapters
  media_url text,                -- image/audio/video file in cloud storage
  cover_url text,
  visibility text not null default 'public' check (visibility in ('public','paid','subscriber')),
  price_inr numeric default 0,   -- used when visibility = 'paid'
  required_tier_id uuid references tiers(id),  -- used when visibility = 'subscriber'
  status text not null default 'draft' check (status in ('draft','scheduled','published')),
  publish_at timestamptz,
  created_at timestamptz default now(),
  updated_at timestamptz default now()
);

create index posts_status_idx on posts(status, publish_at);
create index posts_series_idx on posts(series_id);

-- Purchases: one-time buys of a post or series
create table purchases (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  post_id uuid references posts(id) on delete cascade,
  amount_inr numeric not null,
  status text not null default 'pending' check (status in ('pending','paid','failed','refunded')),
  provider_payment_id text,
  created_at timestamptz default now()
);

-- Subscriptions: recurring tier memberships (Phase 3 wiring, table exists now)
create table subscriptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade,
  tier_id uuid references tiers(id),
  status text not null default 'active' check (status in ('active','past_due','cancelled')),
  renews_at timestamptz,
  created_at timestamptz default now()
);

-- Comments (moderation queue)
create table comments (
  id uuid primary key default gen_random_uuid(),
  post_id uuid references posts(id) on delete cascade,
  user_id uuid references auth.users(id) on delete cascade,
  body text not null,
  status text not null default 'pending' check (status in ('pending','approved','hidden')),
  created_at timestamptz default now()
);

-- ============================================================
-- Row Level Security
-- ============================================================
alter table profiles enable row level security;
alter table posts enable row level security;
alter table series enable row level security;
alter table purchases enable row level security;
alter table subscriptions enable row level security;
alter table comments enable row level security;

-- Everyone can read published public posts
create policy "public posts are readable" on posts
  for select using (status = 'published' and visibility = 'public');

-- Admin (you) can do everything — checked via profiles.role in app logic + this policy
create policy "admins full access to posts" on posts
  for all using (
    exists (select 1 from profiles where id = auth.uid() and role = 'admin')
  );

create policy "series readable by all" on series for select using (true);
create policy "admins manage series" on series
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "users read own profile" on profiles
  for select using (auth.uid() = id);
create policy "admins read all profiles" on profiles
  for select using (exists (select 1 from profiles p where p.id = auth.uid() and p.role = 'admin'));
create policy "users update own profile" on profiles
  for update using (auth.uid() = id);

create policy "users see own purchases" on purchases
  for select using (auth.uid() = user_id);
create policy "admins see all purchases" on purchases
  for select using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

create policy "users see own subs" on subscriptions
  for select using (auth.uid() = user_id);

create policy "approved comments readable" on comments
  for select using (status = 'approved');
create policy "users insert own comments" on comments
  for insert with check (auth.uid() = user_id);
create policy "admins moderate comments" on comments
  for all using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- ============================================================
-- Auto-create a profile row whenever someone signs up
-- ============================================================
create function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name, role)
  values (new.id, new.email, 'reader');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ============================================================
-- IMPORTANT: after running this, manually set yourself as admin:
-- update profiles set role = 'admin' where id = '<your-user-id-from-auth.users>';
-- ============================================================
