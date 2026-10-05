-- Keep the capacity authoritative even if another service-only RPC inserts an
-- exhibitor inquiry in the future.
create function public.enforce_stand_reservation_limit() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.kind = 'exhibitor' then
    perform pg_advisory_xact_lock(hashtext('stand-reservations:' || new.edition_id));
    if (
      select count(*) from public.inquiries
      where edition_id = new.edition_id and kind = 'exhibitor' and status in ('new','in_review')
    ) >= 10 then
      raise exception 'STANDS_FULL';
    end if;
  end if;
  return new;
end;
$$;

create trigger enforce_stand_reservation_limit_before_insert
before insert on public.inquiries
for each row execute function public.enforce_stand_reservation_limit();

revoke all on function public.enforce_stand_reservation_limit() from public, anon, authenticated, service_role;
