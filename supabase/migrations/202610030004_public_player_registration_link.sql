begin;

drop function public.reserve_player_registration(text,text,text,text,uuid,text,text,text,text,integer);
drop table public.player_registration_invites;

create function public.reserve_player_registration(
  p_edition text, p_club text, p_name text, p_phone text, p_request uuid,
  p_access_hash text, p_contact text, p_kit_name text, p_dorsal_number integer
) returns text language plpgsql security definer set search_path = '' as $$
declare o public.player_registrations; s public.player_registration_settings; attempts integer;
begin
  if p_club is null or p_club not in ('real-mboa','barca-mboa') or p_contact is null
    or p_contact not in ('manuel','youana') or p_request is null or p_access_hash is null
    or p_access_hash !~ '^[a-f0-9]{64}$' or p_name is null
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
  insert into public.submission_limits(bucket, window_start)
    values ('player-phone:' || md5(p_phone), date_trunc('hour', now()))
    on conflict (bucket, window_start) do update set attempts = public.submission_limits.attempts + 1
    returning submission_limits.attempts into attempts;
  if attempts > 10 then raise exception 'RATE_LIMITED'; end if;
  if exists (select 1 from public.player_registrations where edition_id = p_edition and player_phone = p_phone) then
    raise exception 'ALREADY_REGISTERED';
  end if;
  insert into public.player_registrations(request_id, access_hash, edition_id, club, player_name, player_phone, contact, amount_xaf, kit_name, dorsal_number)
    values (p_request, p_access_hash, p_edition, p_club, trim(p_name), p_phone, p_contact, 16000, trim(p_kit_name), p_dorsal_number)
    returning * into o;
  return o.reference;
end;
$$;
revoke all on function public.reserve_player_registration(text,text,text,text,uuid,text,text,text,integer) from public, anon, authenticated;
grant execute on function public.reserve_player_registration(text,text,text,text,uuid,text,text,text,integer) to service_role;

commit;
