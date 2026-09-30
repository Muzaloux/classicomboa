begin;

create table public.event_editions (
  id text primary key,
  slug text not null unique,
  edition_number integer not null unique check (edition_number > 0),
  name text not null,
  event_date date not null,
  venue text not null,
  city text not null,
  country text not null default 'Cameroun',
  timezone text not null default 'Africa/Douala',
  status text not null default 'draft' check (status in ('draft','planning','announced','upcoming','sales_open','live','completed','archived','cancelled')),
  created_at timestamptz not null default now()
);

create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '' check (length(display_name) <= 100),
  phone text check (phone is null or phone ~ '^\+2376[0-9]{8}$'),
  city text not null default '' check (length(city) <= 100),
  preferred_locale text not null default 'fr-CM',
  status text not null default 'active' check (status in ('active','suspended','disabled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.edition_staff (
  user_id uuid not null references public.user_profiles(id) on delete cascade,
  edition_id text not null references public.event_editions(id),
  role text not null check (role in ('admin','manager','support','checkin','editor')),
  created_at timestamptz not null default now(),
  primary key (user_id, edition_id)
);

create table public.inquiries (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references public.event_editions(id),
  kind text not null check (kind in ('contact','partner','exhibitor')),
  name text not null check (length(name) between 2 and 100),
  email text not null check (length(email) between 3 and 254),
  phone text check (phone is null or phone ~ '^\+2376[0-9]{8}$'),
  organization text not null default '' check (length(organization) <= 150),
  message text not null check (length(message) between 20 and 4000),
  status text not null default 'new' check (status in ('new','in_review','closed')),
  consent_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (kind = 'contact' or length(organization) >= 2)
);
create index inquiries_edition_created_idx on public.inquiries(edition_id, created_at desc);

-- No PII in the audit payload; inquiry content remains in its protected table.
create table public.audit_events (
  id bigint generated always as identity primary key,
  edition_id text not null references public.event_editions(id),
  actor_id uuid references auth.users(id) on delete set null,
  entity_id uuid not null,
  action text not null,
  old_status text,
  new_status text,
  created_at timestamptz not null default now()
);

-- Service-only, bounded hourly counters. Raw email addresses are not retained here.
create table public.submission_limits (
  bucket text not null,
  window_start timestamptz not null,
  attempts integer not null default 1,
  primary key (bucket, window_start)
);

create function public.create_user_profile() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.user_profiles(id) values (new.id) on conflict do nothing;
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users
for each row execute function public.create_user_profile();
insert into public.user_profiles(id) select id from auth.users on conflict do nothing;

create function public.can_manage_inquiries(target_edition text) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (
    select 1 from public.edition_staff s
    join public.user_profiles p on p.id = s.user_id
    where s.user_id = auth.uid() and s.edition_id = target_edition
      and s.role in ('admin','manager','support') and p.status = 'active'
  );
$$;

create function public.touch_updated_at() returns trigger
language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end;
$$;
create trigger profile_updated before update on public.user_profiles
for each row execute function public.touch_updated_at();

-- The server passes only validated fields. This function is not callable by browsers.
create function public.submit_inquiry(
  p_edition text, p_kind text, p_name text, p_email text,
  p_phone text, p_organization text, p_message text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  received_id uuid;
  attempt_count integer;
  current_window timestamptz := date_trunc('hour', now());
begin
  if not exists (select 1 from public.event_editions where id = p_edition and status in ('announced','upcoming','sales_open','live')) then
    raise exception 'INQUIRIES_CLOSED';
  end if;
  delete from public.submission_limits where window_start < now() - interval '2 hours';
  insert into public.submission_limits(bucket, window_start)
  values (md5(lower(trim(p_email))), current_window)
  on conflict (bucket, window_start) do update set attempts = public.submission_limits.attempts + 1
  returning attempts into attempt_count;
  if attempt_count > 3 then raise exception 'RATE_LIMITED'; end if;
  insert into public.inquiries(edition_id,kind,name,email,phone,organization,message)
  values (p_edition,p_kind,trim(p_name),lower(trim(p_email)),nullif(p_phone,''),trim(p_organization),trim(p_message))
  returning id into received_id;
  return received_id;
end;
$$;

create function public.set_inquiry_status(p_id uuid, p_edition text, p_status text) returns void
language plpgsql security definer set search_path = '' as $$
declare previous_status text;
begin
  if not public.can_manage_inquiries(p_edition) then raise exception 'FORBIDDEN'; end if;
  if p_status is null or p_status not in ('new','in_review','closed') then raise exception 'INVALID_STATUS'; end if;
  select status into previous_status from public.inquiries
    where id = p_id and edition_id = p_edition for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if previous_status = p_status then return; end if;
  update public.inquiries set status = p_status, updated_at = now() where id = p_id;
  insert into public.audit_events(edition_id,actor_id,entity_id,action,old_status,new_status)
  values (p_edition,auth.uid(),p_id,'inquiry.status_changed',previous_status,p_status);
end;
$$;

alter table public.event_editions enable row level security;
alter table public.user_profiles enable row level security;
alter table public.edition_staff enable row level security;
alter table public.inquiries enable row level security;
alter table public.audit_events enable row level security;
alter table public.submission_limits enable row level security;

revoke all on public.event_editions, public.user_profiles, public.edition_staff,
  public.inquiries, public.audit_events, public.submission_limits from anon, authenticated;
grant select on public.event_editions to anon, authenticated;
grant select on public.user_profiles, public.edition_staff, public.inquiries, public.audit_events to authenticated;
grant update(display_name,phone,city,preferred_locale) on public.user_profiles to authenticated;
grant all on public.event_editions, public.user_profiles, public.edition_staff,
  public.inquiries, public.audit_events, public.submission_limits to service_role;
grant usage, select on sequence public.audit_events_id_seq to service_role;

create policy published_editions on public.event_editions for select to anon, authenticated
using (status not in ('draft','planning'));
create policy own_profile on public.user_profiles for select to authenticated using (id = (select auth.uid()));
create policy edit_own_profile on public.user_profiles for update to authenticated
using (id = (select auth.uid()) and status = 'active')
with check (id = (select auth.uid()) and status = 'active');
create policy own_staff_memberships on public.edition_staff for select to authenticated using (user_id = (select auth.uid()));
create policy staff_inquiries on public.inquiries for select to authenticated using (public.can_manage_inquiries(edition_id));
create policy staff_audit on public.audit_events for select to authenticated using (public.can_manage_inquiries(edition_id));

revoke all on function public.create_user_profile(), public.touch_updated_at(),
  public.can_manage_inquiries(text), public.submit_inquiry(text,text,text,text,text,text,text),
  public.set_inquiry_status(uuid,text,text) from public, anon, authenticated;
grant execute on function public.can_manage_inquiries(text), public.set_inquiry_status(uuid,text,text) to authenticated;
grant execute on function public.submit_inquiry(text,text,text,text,text,text,text) to service_role;

insert into public.event_editions(id,slug,edition_number,name,event_date,venue,city,status)
values ('edition-8','8',8,'Classico Mboa — 8e édition','2026-12-12','Omnisports Bépanda','Douala','upcoming');

commit;
