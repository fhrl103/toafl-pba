-- =============================================================================
-- TOAFL PBA — Migration 0001: skema awal
-- =============================================================================
-- Tabel: users, questions, exam_config, exam_sessions, exam_results
--
-- Semua akses data dilakukan dari sisi SERVER menggunakan service role key
-- (lib/supabase/admin.ts) yang menembus RLS. Oleh karena itu RLS diaktifkan
-- pada kelima tabel dengan DEFAULT DENY untuk role `anon` dan `authenticated`
-- (tidak ada policy SELECT/INSERT/UPDATE/DELETE untuk kedua role tersebut).
-- =============================================================================

-- gen_random_uuid() tersedia via extension pgcrypto (sudah aktif secara
-- default di Supabase; baris di bawah hanya memastikan untuk instance lain).
create extension if not exists pgcrypto;

-- -----------------------------------------------------------------------------
-- users: admin & mahasiswa dalam satu tabel, dibedakan lewat role
-- -----------------------------------------------------------------------------
create table users (
  id uuid primary key default gen_random_uuid(),
  nim_nip varchar(20) not null unique,
  nama_lengkap varchar(100) not null,
  email varchar(100) not null unique,
  password_hash varchar(255) not null,
  angkatan integer,
  role varchar(10) not null default 'mahasiswa' check (role in ('admin','mahasiswa')),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- questions: bank soal 3 seksi
-- -----------------------------------------------------------------------------
create table questions (
  id uuid primary key default gen_random_uuid(),
  section smallint not null check (section in (1,2,3)),
  audio_path text,              -- path di Supabase Storage, hanya untuk section 1
  passage text,
  question_text text not null,
  option_a text not null,
  option_b text not null,
  option_c text not null,
  option_d text not null,
  correct_answer char(1) not null check (correct_answer in ('A','B','C','D')),
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- exam_config: satu baris singleton yang mengontrol status ujian global
-- -----------------------------------------------------------------------------
create table exam_config (
  id smallint primary key default 1 check (id = 1),
  is_open boolean not null default false,
  opened_at timestamptz,
  closed_at timestamptz
);

insert into exam_config (id, is_open) values (1, false);

-- -----------------------------------------------------------------------------
-- exam_sessions: satu sesi aktif per mahasiswa
-- -----------------------------------------------------------------------------
create table exam_sessions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade unique,
  section_1_started_at timestamptz not null,
  section_2_started_at timestamptz not null,
  section_3_started_at timestamptz not null,
  is_completed boolean not null default false,
  answers jsonb not null default '[]',
  created_at timestamptz not null default now()
);

-- -----------------------------------------------------------------------------
-- exam_results: hasil akhir, satu mahasiswa bisa punya riwayat
-- (biasanya 1 baris karena one-shot)
-- -----------------------------------------------------------------------------
create table exam_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references users(id) on delete cascade,
  correct_sec_1 integer not null default 0,
  correct_sec_2 integer not null default 0,
  correct_sec_3 integer not null default 0,
  score_sec_1 integer not null default 0,
  score_sec_2 integer not null default 0,
  score_sec_3 integer not null default 0,
  final_score integer not null default 0,
  submitted_at timestamptz not null default now()
);

-- =============================================================================
-- Row Level Security — DEFAULT DENY untuk anon & authenticated
-- =============================================================================
-- ENABLE RLS saja sudah cukup membuat semua akses anon/authenticated ditolak
-- (deny-by-default) selama tidak ada policy yang dibuat untuk role tersebut.
-- Hanya service_role (dipakai lib/supabase/admin.ts) yang menembus RLS.
-- Untuk kejelasan eksplisit, kita juga revoke GRANT dari anon/authenticated.
-- =============================================================================

alter table users         enable row level security;
alter table questions     enable row level security;
alter table exam_config   enable row level security;
alter table exam_sessions enable row level security;
alter table exam_results  enable row level security;

-- Cabut hak akses tabel dari role publik (anon & authenticated).
-- Akses penuh tetap milik service_role yang dipakai server-side.
revoke all on table users         from anon, authenticated;
revoke all on table questions     from anon, authenticated;
revoke all on table exam_config   from anon, authenticated;
revoke all on table exam_sessions from anon, authenticated;
revoke all on table exam_results  from anon, authenticated;

-- Catatan: TIDAK ada CREATE POLICY untuk anon/authenticated di sini, sehingga
-- RLS berlaku sebagai default-deny bagi kedua role tersebut. Seluruh query
-- dijalankan dari server melalui service role key (lihat supabase/seed.ts dan
-- route handler di app/api/*).
