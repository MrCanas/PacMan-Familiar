-- Ranking compartido de Pac-Man Familiar.
--
-- Pasos:
--   1. Crea un proyecto gratis en https://supabase.com
--   2. Pega este fichero entero en el SQL Editor y ejecutalo.
--   3. Copia Project URL y anon key (Settings -> API) a tu .env.local.
--      Ver .env.example.
--
-- La anon key viaja en el JavaScript del navegador, asi que es publica por
-- diseno. Lo que protege la tabla es RLS: solo deja insertar y leer, nunca
-- borrar ni modificar, y los CHECK acotan los valores para que nadie pueda
-- meter una puntuacion imposible.

create table if not exists public.match_results (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  family_id text not null check (char_length(family_id) between 1 and 40),
  character_id text not null check (char_length(character_id) between 1 and 40),
  character_name text not null check (char_length(character_name) between 1 and 60),
  scenario_id text not null check (char_length(scenario_id) between 1 and 40),
  difficulty text not null check (difficulty in ('easy', 'medium', 'hard')),
  pellets int not null check (pellets between 0 and 400),
  score int not null check (score between 0 and 100000),
  won boolean not null,
  duration_ms int not null check (duration_ms between 0 and 3600000)
);

create index if not exists match_results_character_idx
  on public.match_results (character_id);

alter table public.match_results enable row level security;

drop policy if exists "cualquiera puede guardar su partida" on public.match_results;
create policy "cualquiera puede guardar su partida"
  on public.match_results for insert to anon with check (true);

drop policy if exists "cualquiera puede leer el ranking" on public.match_results;
create policy "cualquiera puede leer el ranking"
  on public.match_results for select to anon using (true);

-- Dos rankings de una sola vista:
--   total_pellets -> quien es el que mas come
--   best_score    -> quien saca mas puntos en una partida
create or replace view public.ranking as
  select
    character_id,
    max(character_name) as character_name,
    max(family_id) as family_id,
    sum(pellets)::int as total_pellets,
    max(score)::int as best_score,
    count(*)::int as matches,
    count(*) filter (where won)::int as wins
  from public.match_results
  group by character_id;
