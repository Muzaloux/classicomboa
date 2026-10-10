alter table public.quiz_attempts
  add column expires_at timestamptz not null default now() + interval '7 minutes';

create or replace function public.save_daily_quiz_answer(p_reference text,p_position integer,p_option uuid,p_bucket_hash text)
returns boolean language plpgsql security definer set search_path = '' as $$
declare attempt_row public.quiz_attempts%rowtype; session_row public.quiz_daily_sessions%rowtype;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if p_bucket_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_REQUEST'; end if;
  select * into attempt_row from public.quiz_attempts where public_reference=p_reference for update;
  if not found or attempt_row.status <> 'started' then raise exception 'ATTEMPT_NOT_ACTIVE'; end if;
  if now() >= attempt_row.expires_at then
    update public.quiz_attempts set status='expired' where id=attempt_row.id;
    return false;
  end if;
  select * into session_row from public.quiz_daily_sessions where id=attempt_row.daily_session_id;
  if not public.quiz_is_open(session_row.quiz_date,session_row.override_status) then
    update public.quiz_attempts set status='expired' where id=attempt_row.id;
    return false;
  end if;
  update public.quiz_attempt_questions q set selected_option_id=p_option, answered_at=now()
  where q.attempt_id=attempt_row.id and q.position=p_position and p_option=any(q.option_order);
  if not found then raise exception 'INVALID_ANSWER'; end if;
  return true;
end;
$$;

create or replace function public.submit_daily_quiz(p_reference text,p_answers jsonb,p_bucket_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare attempt_row public.quiz_attempts%rowtype; session_row public.quiz_daily_sessions%rowtype; correct_count integer; elapsed integer;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if p_bucket_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_REQUEST'; end if;
  select * into attempt_row from public.quiz_attempts where public_reference=p_reference for update;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  if attempt_row.status='completed' then return jsonb_build_object('status','completed','reference',attempt_row.public_reference,'score',attempt_row.score,'correctAnswers',attempt_row.correct_answers); end if;
  if attempt_row.status <> 'started' then raise exception 'ATTEMPT_NOT_ACTIVE'; end if;
  select * into session_row from public.quiz_daily_sessions where id=attempt_row.daily_session_id;
  if now() >= attempt_row.expires_at or not public.quiz_is_open(session_row.quiz_date,session_row.override_status) then
    update public.quiz_attempts set status='expired' where id=attempt_row.id;
    return jsonb_build_object('status','expired','reference',attempt_row.public_reference);
  end if;
  if jsonb_typeof(p_answers) <> 'array' or jsonb_array_length(p_answers) <> 5
    or (select count(distinct (value->>'position')::integer) from jsonb_array_elements(p_answers)) <> 5
    or exists (
      select 1 from jsonb_array_elements(p_answers) a(value)
      left join public.quiz_attempt_questions q on q.attempt_id=attempt_row.id
        and q.position=(a.value->>'position')::integer
        and (a.value->>'optionId')::uuid=any(q.option_order)
      where q.id is null
    ) then raise exception 'INVALID_ANSWERS'; end if;
  update public.quiz_attempt_questions q set selected_option_id=(a.value->>'optionId')::uuid, answered_at=now()
  from jsonb_array_elements(p_answers) a(value)
  where q.attempt_id=attempt_row.id and q.position=(a.value->>'position')::integer
    and (a.value->>'optionId')::uuid=any(q.option_order);
  if (select count(*) from public.quiz_attempt_questions where attempt_id=attempt_row.id and selected_option_id is not null) <> 5 then raise exception 'INVALID_ANSWERS'; end if;
  update public.quiz_attempt_questions q set is_correct=o.is_correct,points_awarded=case when o.is_correct then 20 else 0 end
  from public.quiz_options o where q.attempt_id=attempt_row.id and o.id=q.selected_option_id;
  select count(*) into correct_count from public.quiz_attempt_questions where attempt_id=attempt_row.id and is_correct=true;
  elapsed := greatest(0,floor(extract(epoch from (now()-attempt_row.started_at)))::integer);
  update public.quiz_attempts set status='completed',completed_at=now(),score=correct_count*20,correct_answers=correct_count,completion_seconds=elapsed where id=attempt_row.id;
  return jsonb_build_object('status','completed','reference',attempt_row.public_reference,'score',correct_count*20,'correctAnswers',correct_count);
end;
$$;

create or replace function public.get_public_quiz_attempt(p_reference text,p_bucket_hash text)
returns jsonb language plpgsql security definer set search_path = '' as $$
declare attempt_row public.quiz_attempts%rowtype; session_row public.quiz_daily_sessions%rowtype; reveal boolean;
begin
  if auth.role() <> 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if p_bucket_hash !~ '^[a-f0-9]{64}$' then raise exception 'INVALID_REQUEST'; end if;
  select * into attempt_row from public.quiz_attempts where public_reference=p_reference for update;
  if not found then raise exception 'ATTEMPT_NOT_FOUND'; end if;
  select * into session_row from public.quiz_daily_sessions where id=attempt_row.daily_session_id;
  if attempt_row.status='started' and (now() >= attempt_row.expires_at or not public.quiz_is_open(session_row.quiz_date,session_row.override_status)) then
    update public.quiz_attempts set status='expired' where id=attempt_row.id;
    attempt_row.status := 'expired';
  end if;
  select coalesce(reveal_answers_after_close,false) and now() >= s.closes_at into reveal
    from public.quiz_settings cross join public.quiz_daily_sessions s where public.quiz_settings.id=true and s.id=attempt_row.daily_session_id;
  return jsonb_build_object('reference',attempt_row.public_reference,'name',attempt_row.participant_name,'date',attempt_row.quiz_date,
    'status',attempt_row.status,'score',attempt_row.score,'correctAnswers',attempt_row.correct_answers,'totalQuestions',attempt_row.total_questions,
    'completionSeconds',attempt_row.completion_seconds,'expiresAt',attempt_row.expires_at,
    'questions',case when attempt_row.status='started' then
      (select jsonb_agg(jsonb_build_object('id',q.id,'position',q.position,'question',q.question_snapshot,'category',b.category,'difficulty',b.difficulty,
        'selectedOptionId',q.selected_option_id,'options',(select jsonb_agg(value order by array_position(q.option_order,(value->>'id')::uuid)) from jsonb_array_elements(q.option_snapshot) value)) order by q.position)
       from public.quiz_attempt_questions q join public.quiz_questions b on b.id=q.question_id where q.attempt_id=attempt_row.id)
      else null end,
    'review',case when reveal and attempt_row.status='completed' then
       (select jsonb_agg(jsonb_build_object('question',q.question_snapshot,'selected',(
          select value->>'label' from jsonb_array_elements(q.option_snapshot) value where (value->>'id')::uuid=q.selected_option_id
        ),'correct',q.correct_option_snapshot,'isCorrect',q.is_correct) order by q.position)
       from public.quiz_attempt_questions q where q.attempt_id=attempt_row.id)
      else null end);
end;
$$;
