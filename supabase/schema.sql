-- Jalankan sekali di Supabase SQL Editor.
-- Tabel players menyimpan ringkasan profil untuk leaderboard.
create table if not exists players (
 id uuid primary key default gen_random_uuid(),
 player_uid text unique not null,
 username text not null,
 pin text,
 level integer not null default 1,
 total_stars integer not null default 0,
 total_steps integer not null default 0,
 total_hints integer not null default 0,
 hint_balance integer not null default 3,
 created_at timestamptz default now(),
 updated_at timestamptz default now()
);

create table if not exists scores (
 id uuid primary key default gen_random_uuid(),
 player_uid text not null,
 score integer default 0,
 time_used integer default 0,
 hints_used integer default 0,
 created_at timestamptz default now()
);

create table if not exists hint_transactions (
 id uuid primary key default gen_random_uuid(),
 player_uid text not null,
 amount integer not null,
 type text not null,
 created_at timestamptz default now()
);

-- Aman dijalankan pada database yang sebelumnya sudah memiliki tabel players.
alter table players add column if not exists pin text;
alter table players add column if not exists level integer not null default 1;
alter table players add column if not exists total_stars integer not null default 0;
alter table players add column if not exists total_steps integer not null default 0;
alter table players add column if not exists total_hints integer not null default 0;
alter table players add column if not exists hint_balance integer not null default 3;
alter table players add column if not exists updated_at timestamptz default now();

create index if not exists players_leaderboard_idx
on players (level desc, total_stars desc, total_steps asc, total_hints asc);
