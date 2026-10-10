begin;

alter table public.quiz_attempts
  alter column expires_at set default now() + interval '4 minutes';

-- Keep unfinished attempts on the original server-side start time. Anyone who
-- has crossed the new deadline is ineligible and cannot resume the attempt.
update public.quiz_attempts
set expires_at = started_at + interval '4 minutes'
where status = 'started';

update public.quiz_attempts
set status = 'expired'
where status = 'started'
  and now() >= expires_at;

-- Re-evaluate already completed attempts against the same strict deadline.
update public.quiz_attempts
set status = 'disqualified'
where status = 'completed'
  and (
    completion_seconds is null
    or completed_at is null
    or completed_at >= started_at + interval '4 minutes'
  );

commit;
