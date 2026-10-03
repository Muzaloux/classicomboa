begin;

insert into public.vote_candidates(category_id,name,subtitle,sort_order) values
('20000000-0000-4000-8000-000000000010','MUSA','Barça Mboa · n° 23',38),
('20000000-0000-4000-8000-000000000012','MUSA','Barça Mboa · n° 23',18);

create table public.player_registration_settings (
  edition_id text primary key references public.event_editions(id),
  is_open boolean not null default true,
  fee_xaf integer not null default 16000 check (fee_xaf >= 0)
);
create table public.player_registrations (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique default public.short_code('player_registrations'),
  request_id uuid not null unique,
  access_hash text not null check (access_hash ~ '^[a-f0-9]{64}$'),
  edition_id text not null references public.event_editions(id),
  club text not null check (club in ('real-mboa','barca-mboa')),
  player_name text not null check (length(player_name) between 2 and 100),
  player_phone text not null,
  contact text not null check (contact in ('manuel','youana')),
  amount_xaf integer not null check (amount_xaf >= 0),
  status text not null default 'pending' check (status in ('pending','paid')),
  receipt_reference text,
  confirmed_by uuid references auth.users(id) on delete set null,
  paid_at timestamptz,
  created_at timestamptz not null default now(),
  unique (edition_id, player_phone)
);
create unique index player_receipt_once on public.player_registrations(lower(receipt_reference)) where receipt_reference is not null;

alter table public.player_registration_settings enable row level security;
alter table public.player_registrations enable row level security;
revoke all on public.player_registration_settings, public.player_registrations from anon, authenticated;
grant all on public.player_registration_settings, public.player_registrations to service_role;
grant select, update on public.player_registration_settings to authenticated;
grant select on public.player_registrations to authenticated;
create policy player_settings_staff on public.player_registration_settings for select to authenticated using (public.has_edition_role(edition_id, array['admin','manager']));
create policy player_settings_staff_update on public.player_registration_settings for update to authenticated using (public.has_edition_role(edition_id, array['admin','manager'])) with check (public.has_edition_role(edition_id, array['admin','manager']));
create policy player_registrations_staff on public.player_registrations for select to authenticated using (public.has_edition_role(edition_id, array['admin','manager']));

insert into public.player_registration_settings(edition_id) values ('edition-8');

create function public.reserve_player_registration(p_edition text, p_club text, p_name text, p_phone text, p_request uuid, p_access_hash text, p_contact text)
returns text language plpgsql security definer set search_path = '' as $$
declare s public.player_registration_settings; o public.player_registrations; attempts integer;
begin
  if p_club is null or p_club not in ('real-mboa','barca-mboa') or p_contact is null or p_contact not in ('manuel','youana') or p_request is null or p_access_hash is null or p_access_hash !~ '^[a-f0-9]{64}$' or p_name is null or length(trim(p_name)) < 2 or p_phone is null then raise exception 'INVALID_ORDER'; end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text, 0));
  select * into o from public.player_registrations where request_id = p_request;
  if found then
    if o.edition_id <> p_edition or o.access_hash <> p_access_hash or o.club <> p_club or o.player_phone <> p_phone then raise exception 'REQUEST_CONFLICT'; end if;
    return o.reference;
  end if;
  select * into s from public.player_registration_settings where edition_id = p_edition;
  if not found or not s.is_open then raise exception 'REGISTRATION_CLOSED'; end if;
  insert into public.submission_limits(bucket, window_start) values ('player-phone:' || md5(p_phone), date_trunc('hour', now()))
    on conflict (bucket, window_start) do update set attempts = public.submission_limits.attempts + 1 returning submission_limits.attempts into attempts;
  if attempts > 10 then raise exception 'RATE_LIMITED'; end if;
  if exists (select 1 from public.player_registrations where edition_id = p_edition and player_phone = p_phone) then raise exception 'ALREADY_REGISTERED'; end if;
  insert into public.player_registrations(request_id, access_hash, edition_id, club, player_name, player_phone, contact, amount_xaf)
    values (p_request, p_access_hash, p_edition, p_club, trim(p_name), p_phone, p_contact, s.fee_xaf) returning * into o;
  return o.reference;
end;
$$;
revoke all on function public.reserve_player_registration(text,text,text,text,uuid,text,text) from public, anon, authenticated;
grant execute on function public.reserve_player_registration(text,text,text,text,uuid,text,text) to service_role;

create function public.confirm_player_payment(p_edition text, p_reference text, p_amount integer, p_receipt text)
returns text language plpgsql security definer set search_path = '' as $$
declare o public.player_registrations;
begin
  if not public.has_edition_role(p_edition, array['admin','manager']) then raise exception 'FORBIDDEN'; end if;
  if p_receipt is null or length(trim(p_receipt)) not between 6 and 100 then raise exception 'INVALID_RECEIPT'; end if;
  select * into o from public.player_registrations where reference = p_reference and edition_id = p_edition for update;
  if not found then raise exception 'NOT_FOUND'; end if;
  if p_amount is distinct from o.amount_xaf then raise exception 'AMOUNT_MISMATCH'; end if;
  if o.status = 'paid' then
    if lower(o.receipt_reference) = lower(trim(p_receipt)) then return 'paid'; end if;
    raise exception 'PAYMENT_STATE_CONFLICT';
  end if;
  update public.player_registrations set status = 'paid', receipt_reference = trim(p_receipt), confirmed_by = auth.uid(), paid_at = now() where id = o.id;
  insert into public.audit_events(edition_id, actor_id, entity_id, action, old_status, new_status) values (p_edition, auth.uid(), o.id, 'player.payment_confirmed', o.status, 'paid');
  return 'paid';
end;
$$;
revoke all on function public.confirm_player_payment(text,text,integer,text) from public, anon;
grant execute on function public.confirm_player_payment(text,text,integer,text) to authenticated;

commit;
