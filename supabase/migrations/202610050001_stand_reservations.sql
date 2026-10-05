-- Keep stand requests within the 10 rentable places. Requests in new or in_review
-- status hold a place; closing a declined/completed request releases it.
create function public.submit_stand_reservation(
  p_edition text, p_name text, p_email text, p_phone text,
  p_organization text, p_message text
) returns uuid
language plpgsql security definer set search_path = '' as $$
declare
  received_id uuid;
  attempt_count integer;
  current_window timestamptz := date_trunc('hour', now());
begin
  if not exists (
    select 1 from public.event_editions
    where id = p_edition and status in ('announced','upcoming','sales_open','live')
  ) then
    raise exception 'INQUIRIES_CLOSED';
  end if;

  -- Serialize check-and-insert so concurrent requests cannot claim the same last place.
  perform pg_advisory_xact_lock(hashtext('stand-reservations:' || p_edition));
  if (
    select count(*) from public.inquiries
    where edition_id = p_edition and kind = 'exhibitor' and status in ('new','in_review')
  ) >= 10 then
    raise exception 'STANDS_FULL';
  end if;

  delete from public.submission_limits where window_start < now() - interval '2 hours';
  insert into public.submission_limits(bucket, window_start)
  values (md5(lower(trim(p_email))), current_window)
  on conflict (bucket, window_start) do update
    set attempts = public.submission_limits.attempts + 1
  returning attempts into attempt_count;
  if attempt_count > 3 then raise exception 'RATE_LIMITED'; end if;

  insert into public.inquiries(edition_id,kind,name,email,phone,organization,message)
  values (
    p_edition, 'exhibitor', trim(p_name), lower(trim(p_email)), nullif(p_phone,''),
    trim(p_organization),
    'Demande de réservation d’un stand — tarif : 10 000 XAF par stand.' || E'\n\n' || trim(p_message)
  )
  returning id into received_id;
  return received_id;
end;
$$;

revoke all on function public.submit_stand_reservation(text,text,text,text,text,text) from public, anon, authenticated;
grant execute on function public.submit_stand_reservation(text,text,text,text,text,text) to service_role;
