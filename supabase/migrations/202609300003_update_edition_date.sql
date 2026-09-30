begin;

update public.event_editions
set event_date = '2026-12-19'
where id = 'edition-8';

commit;
