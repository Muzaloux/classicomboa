create or replace function public.admin_save_quiz_question(
  p_question_id uuid,p_question text,p_category text,p_difficulty text,p_explanation text,p_status text,p_options jsonb
) returns uuid language plpgsql security definer set search_path = '' as $$
declare v_question_id uuid; option_row record; correct_count integer;
begin
  if auth.role() is distinct from 'service_role' then raise exception 'NOT_ALLOWED'; end if;
  if length(trim(p_question)) not between 8 and 600 or length(trim(p_category)) not between 2 and 80
    or p_difficulty not in ('easy','medium','hard','boss') or p_status not in ('draft','active','archived')
    or jsonb_typeof(p_options) <> 'array' or jsonb_array_length(p_options) <> 4 then raise exception 'INVALID_QUESTION'; end if;
  select count(*) into correct_count from jsonb_array_elements(p_options) as items(value) where (value->>'isCorrect')::boolean;
  if correct_count <> 1 or exists (select 1 from jsonb_array_elements(p_options) as items(value) where length(trim(value->>'label')) not between 1 and 400) then raise exception 'INVALID_OPTIONS'; end if;
  if p_question_id is null then
    insert into public.quiz_questions(question,category,difficulty,explanation,status)
    values(trim(p_question),trim(p_category),p_difficulty,nullif(trim(coalesce(p_explanation,'')),''),p_status) returning id into v_question_id;
  else
    update public.quiz_questions set question=trim(p_question),category=trim(p_category),difficulty=p_difficulty,
      explanation=nullif(trim(coalesce(p_explanation,'')),''),status=p_status where id=p_question_id returning id into v_question_id;
    if v_question_id is null then raise exception 'QUESTION_NOT_FOUND'; end if;
  end if;
  for option_row in select value,ordinality from jsonb_array_elements(p_options) with ordinality as items(value,ordinality) loop
    insert into public.quiz_options(question_id,label,is_correct,sort_order)
    values(v_question_id,trim(option_row.value->>'label'),(option_row.value->>'isCorrect')::boolean,(option_row.ordinality-1)::integer)
    on conflict(question_id,sort_order) do update set label=excluded.label,is_correct=excluded.is_correct;
  end loop;
  return v_question_id;
end;
$$;
