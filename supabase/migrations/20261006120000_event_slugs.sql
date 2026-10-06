-- Readable, permanent URLs for events: /concurs/bucharest-marathon-2026.
-- The slug is set once (on insert, or when cleared) and never changes after that,
-- even if the name is edited, so shared links keep working.

alter table events add column slug text unique;

-- "Alergăraș în Făgăraș" → "alergaras-in-fagaras". Covers Romanian and Hungarian letters.
create function slugify(value text) returns text
language sql immutable as $$
  select trim(both '-' from regexp_replace(
    translate(
      lower(value),
      'ăâîșşțţ' || 'áéíóöőúüű' || 'àèìòù' || 'äëïç',
      'aaisstt' || 'aeiooouuu' || 'aeiou' || 'aeic'
    ),
    '[^a-z0-9]+', '-', 'g'
  ));
$$;

create function set_event_slug() returns trigger
language plpgsql as $$
declare
  base text;
  candidate text;
  n int := 1;
begin
  if new.slug is not null and new.slug <> '' then
    return new;
  end if;
  base := slugify(new.name) || '-' || extract(year from new.start_date);
  candidate := base;
  while exists (select 1 from events where slug = candidate and id <> new.id) loop
    n := n + 1;
    candidate := base || '-' || n;
  end loop;
  new.slug := candidate;
  return new;
end;
$$;

create trigger events_slug before insert or update on events
  for each row execute function set_event_slug();

-- Give existing events a slug, one at a time so duplicates get -2, -3…
do $$
declare
  event_id uuid;
begin
  for event_id in select id from events order by start_date, created_at loop
    update events set slug = null where id = event_id;
  end loop;
end;
$$;

alter table events alter column slug set not null;
