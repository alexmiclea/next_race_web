-- Admins: signed-in users listed here may see every event (pending, rejected) and edit
-- events and races. Everyone else keeps the public, read-only access to approved events.
-- The website checks admin status too, but these rules are what actually protect the data.

create table admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);

alter table admins enable row level security;

-- A signed-in user can only see whether they themselves are an admin.
create policy "Users see their own admin row" on admins
  for select to authenticated using (user_id = auth.uid());

-- No insert/update/delete policies: the admin list can only be changed from the
-- Supabase dashboard (or with the secret key), never from the website.

-- True when the current signed-in user is an admin. "security definer" lets the
-- policies below check the admins table without exposing it.
create function is_admin() returns boolean
language sql stable security definer set search_path = public as $$
  select exists (select 1 from admins where user_id = auth.uid());
$$;

revoke execute on function is_admin() from public;
grant execute on function is_admin() to anon, authenticated;

-- Events: admins read everything and can add and edit (rejecting hides an event;
-- there is deliberately no delete).
create policy "Admins read all events" on events
  for select to authenticated using (is_admin());
create policy "Admins add events" on events
  for insert to authenticated with check (is_admin());
create policy "Admins edit events" on events
  for update to authenticated using (is_admin()) with check (is_admin());

-- Races (distances): admins read, add, edit and remove them.
create policy "Admins read all races" on races
  for select to authenticated using (is_admin());
create policy "Admins add races" on races
  for insert to authenticated with check (is_admin());
create policy "Admins edit races" on races
  for update to authenticated using (is_admin()) with check (is_admin());
create policy "Admins remove races" on races
  for delete to authenticated using (is_admin());

-- The site owner. Their login was created beforehand (sign-ups are turned off).
insert into admins (user_id)
select id from auth.users where email = 'alexmiclea88@gmail.com';
