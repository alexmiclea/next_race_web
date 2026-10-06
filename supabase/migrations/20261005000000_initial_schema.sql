-- Initial schema: reference data (sports, counties), events and their races.
-- An event (e.g. "Bucharest Marathon") has one or more races (42km, 21km, relay…).
-- Every event goes through manual review; only approved events are public.

create type review_status as enum ('pending', 'approved', 'rejected');

-- Sports are data, not code: add a row to support a new sport.
create table sports (
  slug text primary key,
  name_ro text not null,
  name_en text not null,
  sort_order int not null default 0
);

create table counties (
  code text primary key,
  name text not null
);

create table events (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  organizer text,
  start_date date not null,
  end_date date not null,
  -- Europe/Bucharest local time, when known.
  start_time time,
  city text,
  county_code text references counties (code),
  -- Can be run from anywhere (virtual / "oriunde").
  is_virtual boolean not null default false,
  website_url text,
  registration_url text,

  status review_status not null default 'pending',
  review_note text,

  -- Where the event came from: a scraped website's hostname, or 'manual' / 'organizer'.
  source text not null default 'manual',
  source_url text,
  -- Stable id within a source, so re-scraping updates instead of duplicating.
  external_key text,

  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint events_dates_ordered check (end_date >= start_date),
  constraint events_source_key unique (source, external_key)
);

create index events_upcoming on events (start_date) where status = 'approved';
create index events_county on events (county_code);

create table races (
  id uuid primary key default gen_random_uuid(),
  event_id uuid not null references events (id) on delete cascade,
  sport_slug text not null references sports (slug),
  -- As announced: "21km", "Sprint", "copii", "ștafetă".
  label text not null,
  -- Null for categories without a single distance (kids, relay, teams).
  distance_km numeric(7, 2),
  sort_order int not null default 0
);

create index races_event on races (event_id);
create index races_sport on races (sport_slug);

create function set_updated_at() returns trigger
language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger events_updated_at before update on events
  for each row execute function set_updated_at();

-- Row-level security: the public (publishable key) can only read approved data.
-- Writes happen through the Supabase dashboard or server code using the secret key.
alter table sports enable row level security;
alter table counties enable row level security;
alter table events enable row level security;
alter table races enable row level security;

create policy "Sports are public" on sports for select using (true);
create policy "Counties are public" on counties for select using (true);
create policy "Approved events are public" on events for select using (status = 'approved');
create policy "Races of approved events are public" on races for select using (
  exists (select 1 from events where events.id = races.event_id and events.status = 'approved')
);

-- Reference data.
insert into sports (slug, name_ro, name_en, sort_order) values
  ('running', 'Alergare', 'Running', 1),
  ('cycling', 'Ciclism', 'Cycling', 2),
  ('swimming', 'Înot', 'Swimming', 3),
  ('triathlon', 'Triatlon', 'Triathlon', 4);

insert into counties (code, name) values
  ('AB', 'Alba'), ('AR', 'Arad'), ('AG', 'Argeș'), ('BC', 'Bacău'), ('BH', 'Bihor'),
  ('BN', 'Bistrița-Năsăud'), ('BT', 'Botoșani'), ('BV', 'Brașov'), ('BR', 'Brăila'),
  ('B', 'București'), ('BZ', 'Buzău'), ('CS', 'Caraș-Severin'), ('CL', 'Călărași'),
  ('CJ', 'Cluj'), ('CT', 'Constanța'), ('CV', 'Covasna'), ('DB', 'Dâmbovița'),
  ('DJ', 'Dolj'), ('GL', 'Galați'), ('GR', 'Giurgiu'), ('GJ', 'Gorj'), ('HR', 'Harghita'),
  ('HD', 'Hunedoara'), ('IL', 'Ialomița'), ('IS', 'Iași'), ('IF', 'Ilfov'),
  ('MM', 'Maramureș'), ('MH', 'Mehedinți'), ('MS', 'Mureș'), ('NT', 'Neamț'), ('OT', 'Olt'),
  ('PH', 'Prahova'), ('SM', 'Satu Mare'), ('SJ', 'Sălaj'), ('SB', 'Sibiu'), ('SV', 'Suceava'),
  ('TR', 'Teleorman'), ('TM', 'Timiș'), ('TL', 'Tulcea'), ('VS', 'Vaslui'), ('VL', 'Vâlcea'),
  ('VN', 'Vrancea');
