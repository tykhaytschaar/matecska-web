-- Matecska: fiók alatt játékosprofilok, eseménynaplóval vezetett pont és statisztika.
-- Futtatás: Supabase Dashboard → SQL Editor → beillesztés → Run. Újrafuttatható.

-- Játékosok. A fiók az auth.users sora; törléskor minden játékos és adat vele megy.
create table if not exists public.players (
  id uuid primary key default gen_random_uuid(),
  owner_id uuid not null default auth.uid() references auth.users (id) on delete cascade,
  name text not null check (char_length(btrim(name)) between 1 and 40),
  selected_character_id text not null default 'cat',
  -- A készüléken korábban, fiók nélkül gyűjtött pont/stat/karakter egyszeri átvétele.
  imported jsonb,
  -- Fejlesztői módban beállított pontkorrekció (a pont = válaszok összege + korrekció).
  point_adjustment integer not null default 0,
  -- A játékos beállítása: kérdezhet-e a feladat operandusra is (vegyes), vagy csak az eredményt.
  ask_operands boolean not null default false,
  created_at timestamptz not null default now()
);
alter table public.players add column if not exists point_adjustment integer not null default 0;
alter table public.players add column if not exists ask_operands boolean not null default false;
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
  -- A megszerzett gyorsasági bónusz; a statisztika átlagolja. Régi soroknál null.
  bonus integer,
  -- Munkamenet (kliens által adott UUID; 5 perc szünet vagy játékosváltás után új) és a feladat részletei
  -- a későbbi visszanézéshez (tanári felület). Régi soroknál null. 90 napon túl csak a statisztika marad.
  session_id uuid,
  operand_a integer,
  operand_b integer,
  blank text check (blank is null or blank in ('first', 'second', 'result')),
  given integer,
  elapsed_ms integer,
  created_at timestamptz not null default now()
);
alter table public.attempts add column if not exists bonus integer;
alter table public.attempts add column if not exists session_id uuid;
alter table public.attempts add column if not exists operand_a integer;
alter table public.attempts add column if not exists operand_b integer;
alter table public.attempts add column if not exists blank text;
alter table public.attempts add column if not exists given integer;
alter table public.attempts add column if not exists elapsed_ms integer;
create index if not exists attempts_player_idx on public.attempts (player_id);
create index if not exists attempts_player_time_idx on public.attempts (player_id, created_at);

-- A karakterek pontküszöbre oldódnak fel (a kliens katalógusa szerint), a pont nem fogy;
-- ezért nincs vásárlás-tábla. A korábbi `purchases` tábla elhagyva.
drop view if exists public.player_summaries;
drop table if exists public.purchases;

-- Jogosultság: mindenki csak a saját játékosait és azok adatait látja, írja.
alter table public.players enable row level security;
alter table public.attempts enable row level security;

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

-- Játékosonkénti összesítés, hogy a kliensnek ne kelljen a teljes naplót letöltenie.
-- security_invoker: a hívó jogosultságával fut, így a players RLS-e érvényes rá.
create or replace view public.player_summaries
with (security_invoker = true) as
select
  p.id as player_id,
  coalesce((select sum(a.points) from public.attempts a where a.player_id = p.id), 0) as points_delta,
  coalesce(
    (select jsonb_object_agg(s.operation, jsonb_build_object('solved', s.solved, 'correct', s.correct))
       from (select a.operation, count(*) as solved, count(*) filter (where a.correct) as correct
               from public.attempts a where a.player_id = p.id group by a.operation) s),
    '{}'::jsonb) as stats
from public.players p;

-- Módonkénti statisztika egy időponttól (since null = minden). A hívó jogosultságával fut,
-- így a players/attempts RLS-e érvényes: csak a saját játékos sorai jönnek.
create or replace function public.mode_stats(pid uuid, since timestamptz default null)
returns table (mode text, solved bigint, correct bigint, bonus_sum bigint, bonus_count bigint)
language sql
stable
security invoker
set search_path = public
as $$
  select a.mode,
         count(*) as solved,
         count(*) filter (where a.correct) as correct,
         coalesce(sum(a.bonus) filter (where a.correct and a.bonus is not null), 0) as bonus_sum,
         count(*) filter (where a.correct and a.bonus is not null) as bonus_count
  from public.attempts a
  where a.player_id = pid and (since is null or a.created_at >= since)
  group by a.mode;
$$;
revoke execute on function public.mode_stats(uuid, timestamptz) from public, anon;
grant execute on function public.mode_stats(uuid, timestamptz) to authenticated;

-- A játékos munkamenet-azonosítói egy időponttól (since null = minden); a kliens a helyiekkel uniózza.
create or replace function public.session_ids(pid uuid, since timestamptz default null)
returns table (session_id uuid)
language sql
stable
security invoker
set search_path = public
as $$
  select distinct a.session_id
  from public.attempts a
  where a.player_id = pid and a.session_id is not null and (since is null or a.created_at >= since);
$$;
revoke execute on function public.session_ids(uuid, timestamptz) from public, anon;
grant execute on function public.session_ids(uuid, timestamptz) to authenticated;

-- Fejlesztői mód: egy játékos statisztikájának és pontjának törlése (a karakterek a ponttal együtt záródnak vissza).
create or replace function public.reset_player(pid uuid)
returns void
language plpgsql
security invoker
set search_path = public
as $$
begin
  if not exists (select 1 from public.players where id = pid and owner_id = auth.uid()) then
    raise exception 'nem a te játékosod';
  end if;
  delete from public.attempts where player_id = pid;
  update public.players set imported = null, selected_character_id = 'cat', point_adjustment = 0 where id = pid;
end;
$$;

-- Fiók törlése az appból (App Store és GDPR követelmény). A játékosok és adataik cascade-del mennek.
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
