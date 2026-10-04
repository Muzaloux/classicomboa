begin;

alter table public.player_registrations
  add column kit_name text not null default '',
  add column dorsal_number integer not null default 0 check (dorsal_number between 0 and 99);
alter table public.player_registrations drop constraint player_registrations_status_check;
alter table public.player_registrations add constraint player_registrations_status_check check (status in ('pending','approved','rejected','paid'));
alter table public.player_registration_settings alter column fee_xaf set default 16000;
update public.player_registration_settings set fee_xaf = 16000;

create table public.player_registration_invites (
  id uuid primary key default gen_random_uuid(),
  edition_id text not null references public.event_editions(id),
  token_hash text not null unique check (token_hash ~ '^[a-f0-9]{64}$'),
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  expires_at timestamptz not null,
  used_at timestamptz
);
alter table public.player_registration_invites enable row level security;
revoke all on public.player_registration_invites from anon, authenticated;
grant insert on public.player_registration_invites to authenticated;
grant all on public.player_registration_invites to service_role;
create policy player_invites_staff_create on public.player_registration_invites for insert to authenticated
  with check (public.has_edition_role(edition_id, array['admin','manager']) and created_by = auth.uid());

drop function public.reserve_player_registration(text,text,text,text,uuid,text,text);
create function public.reserve_player_registration(
  p_edition text, p_club text, p_name text, p_phone text, p_request uuid,
  p_access_hash text, p_contact text, p_invite_hash text, p_kit_name text,
  p_dorsal_number integer
) returns text language plpgsql security definer set search_path = '' as $$
declare o public.player_registrations; s public.player_registration_settings;
  i public.player_registration_invites; attempts integer;
begin
  if p_club is null or p_club not in ('real-mboa','barca-mboa') or p_contact is null
    or p_contact not in ('manuel','youana') or p_request is null or p_access_hash is null
    or p_access_hash !~ '^[a-f0-9]{64}$' or p_invite_hash is null
    or p_invite_hash !~ '^[a-f0-9]{64}$' or p_name is null
    or length(trim(p_name)) not between 2 and 100 or p_phone is null
    or p_kit_name is null or length(trim(p_kit_name)) not between 2 and 24
    or p_dorsal_number is null or p_dorsal_number not between 0 and 99 then
    raise exception 'INVALID_ORDER';
  end if;
  perform pg_advisory_xact_lock(hashtextextended(p_request::text, 0));
  select * into o from public.player_registrations where request_id = p_request;
  if found then
    if o.edition_id <> p_edition or o.access_hash <> p_access_hash or o.club <> p_club
      or o.player_phone <> p_phone or o.kit_name <> trim(p_kit_name)
      or o.dorsal_number <> p_dorsal_number then raise exception 'REQUEST_CONFLICT'; end if;
    return o.reference;
  end if;
  select * into s from public.player_registration_settings where edition_id = p_edition;
  if not found or not s.is_open then raise exception 'REGISTRATION_CLOSED'; end if;
  select * into i from public.player_registration_invites
    where edition_id = p_edition and token_hash = p_invite_hash and used_at is null and expires_at > now() for update;
  if not found then raise exception 'INVITE_INVALID'; end if;
  insert into public.submission_limits(bucket, window_start) values ('player-phone:' || md5(p_phone), date_trunc('hour', now()))
    on conflict (bucket, window_start) do update set attempts = public.submission_limits.attempts + 1 returning submission_limits.attempts into attempts;
  if attempts > 10 then raise exception 'RATE_LIMITED'; end if;
  if exists (select 1 from public.player_registrations where edition_id = p_edition and player_phone = p_phone) then raise exception 'ALREADY_REGISTERED'; end if;
  insert into public.player_registrations(request_id, access_hash, edition_id, club, player_name, player_phone, contact, amount_xaf, kit_name, dorsal_number)
    values (p_request, p_access_hash, p_edition, p_club, trim(p_name), p_phone, p_contact, 16000, trim(p_kit_name), p_dorsal_number) returning * into o;
  update public.player_registration_invites set used_at = now() where id = i.id;
  return o.reference;
end;
$$;
revoke all on function public.reserve_player_registration(text,text,text,text,uuid,text,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.reserve_player_registration(text,text,text,text,uuid,text,text,text,text,integer) to service_role;

create function public.review_player_registration(p_edition text, p_reference text, p_decision text)
returns text language plpgsql security definer set search_path = '' as $$
declare o public.player_registrations;
begin
  if not public.has_edition_role(p_edition, array['admin','manager']) then raise exception 'FORBIDDEN'; end if;
  if p_decision not in ('approved','rejected') then raise exception 'INVALID_DECISION'; end if;
  select * into o from public.player_registrations where edition_id = p_edition and reference = p_reference for update;
  if not found or o.status <> 'pending' then raise exception 'INVALID_STATE'; end if;
  update public.player_registrations set status = p_decision where id = o.id;
  insert into public.audit_events(edition_id, actor_id, entity_id, action, old_status, new_status)
    values (p_edition, auth.uid(), o.id, 'player.reviewed', o.status, p_decision);
  return p_decision;
end;
$$;
revoke all on function public.review_player_registration(text,text,text) from public, anon;
grant execute on function public.review_player_registration(text,text,text) to authenticated;

create or replace function public.confirm_player_payment(p_edition text, p_reference text, p_amount integer, p_receipt text)
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
  if o.status <> 'approved' then raise exception 'NOT_APPROVED'; end if;
  update public.player_registrations set status = 'paid', receipt_reference = trim(p_receipt), confirmed_by = auth.uid(), paid_at = now() where id = o.id;
  insert into public.audit_events(edition_id, actor_id, entity_id, action, old_status, new_status) values (p_edition, auth.uid(), o.id, 'player.payment_confirmed', o.status, 'paid');
  return 'paid';
end;
$$;
revoke all on function public.confirm_player_payment(text,text,integer,text) from public, anon;
grant execute on function public.confirm_player_payment(text,text,integer,text) to authenticated;

commit;
