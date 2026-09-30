begin;

update public.event_editions
set ticket_capacity = 5000
where id = 'edition-8';

update public.ticket_types
set capacity = 5000
where edition_id = 'edition-8'
  and is_test = false;

commit;