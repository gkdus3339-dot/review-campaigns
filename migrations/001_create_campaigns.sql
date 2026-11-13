create table if not exists campaigns (
  id text primary key default gen_random_uuid()::text,
  owner text not null,
  platform text not null default '',
  business_name text not null,
  category text not null default '',
  offer text not null default '',
  amount integer,
  region text not null default '',
  visit_start text,
  visit_end text,
  visit_date text,
  deadline text,
  won_date text,
  keywords text not null default '',
  guide text not null default '',
  campaign_url text not null default '',
  review_url text not null default '',
  status text not null default '당첨',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists campaigns_owner_idx on campaigns (owner);

create table if not exists user_settings (
  owner text primary key,
  platforms jsonb not null,
  updated_at timestamptz not null default now()
);
