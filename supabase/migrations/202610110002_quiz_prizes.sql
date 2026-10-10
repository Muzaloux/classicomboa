alter table public.quiz_attempts
  add column prize_awarded_at timestamptz,
  add column prize_awarded_by uuid,
  add column prize_note text check (prize_note is null or length(prize_note) <= 300);
