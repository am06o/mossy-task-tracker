-- mossy가 쓰는 테이블. Supabase 프로젝트의 SQL Editor에 붙여넣고 한 번 실행하면 됩니다.
-- 로그인한 사용자 한 명당 한 행(row)에 앱 데이터 전체(JSON)를 저장하는 단순한 구조입니다.

create table if not exists app_data (
  user_id uuid primary key references auth.users (id) on delete cascade,
  data jsonb not null,
  updated_at timestamptz not null default now()
);

alter table app_data enable row level security;

-- 본인 데이터만 읽고 쓸 수 있게 제한합니다.
create policy "read own data" on app_data
  for select using (auth.uid() = user_id);

create policy "insert own data" on app_data
  for insert with check (auth.uid() = user_id);

create policy "update own data" on app_data
  for update using (auth.uid() = user_id);
