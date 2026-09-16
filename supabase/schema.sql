-- Matecska: szülői fiók alatt gyerekprofilok, eseménynaplóval vezetett pont és statisztika.
-- Futtatás: Supabase Dashboard → SQL Editor → beillesztés → Run. Újrafuttatható.

-- Gyerekek. A szülő az auth.users sora; törléskor minden gyerek és adat vele megy.
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  selected_character_id text not null default 'cat',
  -- A készüléken korábban, fiók nélkül gyűjtött pont/stat/karakter egyszeri átvétele.
  imported jsonb,
  created_at timestamptz not null default now()
);
create index if not exists players_owner_idx on public.players (owner_id);

-- Egy beküldött válasz. A `points` a ténylegesen könyvelt pontváltozás (a nulla alatti
-- levonás már a kliensen 0-ra csonkul), így az összeg adja a pontot.
create table if not exists public.attempts (
  id uuid primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  operation text not null check (operation in ('addition', 'subtraction', 'multiplication', 'division')),
  mode text not null,
  correct boolean not null,
  points integer not null,
  created_at timestamptz not null default now()
);
create index if not exists attempts_player_idx on public.attempts (player_id);

-- Karaktervásárlás pontért.
create table if not exists public.purchases (
  id uuid primary key,
  player_id uuid not null references public.players (id) on delete cascade,
  character_id text not null,
  price integer not null check (price >= 0),
  created_at timestamptz not null default now(),
  unique (player_id, character_id)
);
create index if not exists purchases_player_idx on public.purchases (player_id);

-- Jogosultság: mindenki csak a saját gyerekeit és azok adatait látja, írja.
alter table public.players enable row level security;
alter table public.attempts enable row level security;
alter table public.purchases enable row level security;

drop policy if exists "own players" on public.players;
create policy "own players" on public.players
  for all to authenticated
  using (owner_id = auth.uid())
  with check (owner_id = auth.uid());

drop policy if exists "own attempts" on public.attempts;
create policy "own attempts" on public.attempts
  for all to authenticated
  using (exists (select 1 from public.players p where p.id = player_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.players p where p.id = player_id and p.owner_id = auth.uid()));

drop policy if exists "own purchases" on public.purchases;
create policy "own purchases" on public.purchases
  for all to authenticated
  using (exists (select 1 from public.players p where p.id = player_id and p.owner_id = auth.uid()))
  with check (exists (select 1 from public.players p where p.id = player_id and p.owner_id = auth.uid()));

-- Gyerekenkénti összesítés, hogy a kliensnek ne kelljen a teljes naplót letöltenie.
-- security_invoker: a hívó jogosultságával fut, így a players RLS-e érvényes rá.
create or replace view public.player_summaries
with (security_invoker = true) as
select
  p.id as player_id,
  coalesce((select sum(a.points) from public.attempts a where a.player_id = p.id), 0)
    - coalesce((select sum(b.price) from public.purchases b where b.player_id = p.id), 0) as points_delta,
  coalesce(
    (select jsonb_object_agg(s.operation, jsonb_build_object('solved', s.solved, 'correct', s.correct))
       from (select a.operation, count(*) as solved, count(*) filter (where a.correct) as correct
               from public.attempts a where a.player_id = p.id group by a.operation) s),
    '{}'::jsonb) as stats,
  coalesce((select array_agg(b.character_id order by b.created_at) from public.purchases b where b.player_id = p.id),
    '{}'::text[]) as purchased_character_ids
from public.players p;

-- Fejlesztői mód: egy gyerek statisztikájának, pontjának és karaktereinek törlése.
create or replace function public.reset_player(pid uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (select 1 from public.players where id = pid and owner_id = auth.uid()) then
    raise exception 'nem a te gyereked';
  end if;
  delete from public.attempts where player_id = pid;
  delete from public.purchases where player_id = pid;
  update public.players set imported = null, selected_character_id = 'cat' where id = pid;
end;
$$;

-- Fiók törlése az appból (App Store és GDPR követelmény). A gyerekek és adataik cascade-del mennek.
create or replace function public.delete_account()
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if auth.uid() is null then
    raise exception 'nincs bejelentkezett felhasználó';
  end if;
  delete from auth.users where id = auth.uid();
end;
$$;

revoke execute on function public.delete_account() from public, anon;
grant execute on function public.delete_account() to authenticated;
revoke execute on function public.reset_player(uuid) from public, anon;
grant execute on function public.reset_player(uuid) to authenticated;
