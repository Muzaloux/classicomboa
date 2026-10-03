begin;

create function public.consume_ticket_recovery_attempt(p_reference text)
returns integer
language plpgsql
security definer
set search_path = ''
as $$
declare
  attempt_count integer;
  current_window timestamptz := date_trunc('hour', now());
  attempt_bucket text;
begin
  if p_reference is null or p_reference !~ '^(CM-[a-f0-9]{32}|[A-HJ-NP-Z2-9]{6})$' then
    raise exception 'INVALID_REFERENCE';
  end if;

  attempt_bucket := 'ticket-recovery:' || md5(lower(trim(p_reference)));
  delete from public.submission_limits where window_start < now() - interval '48 hours';
  insert into public.submission_limits(bucket, window_start)
  values (attempt_bucket, current_window)
  on conflict (bucket, window_start)
  do update set attempts = public.submission_limits.attempts + 1
  returning attempts into attempt_count;
  return attempt_count;
end;
$$;

revoke all on function public.consume_ticket_recovery_attempt(text) from public, anon, authenticated;
grant execute on function public.consume_ticket_recovery_attempt(text) to service_role;

commit;
