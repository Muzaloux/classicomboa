create function public.short_code(p_table text) returns text language plpgsql volatile set search_path=public,pg_temp as $$
declare alphabet constant text := 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; code text; exists_already boolean;
begin
  loop
    code := '';
    for i in 1..6 loop code := code || substr(alphabet, 1 + floor(random()*32)::int, 1); end loop;
    execute format('select exists(select 1 from public.%I where reference = $1)', p_table) into exists_already using code;
    exit when not exists_already;
  end loop;
  return code;
end $$;
revoke all on function public.short_code(text) from public;
grant execute on function public.short_code(text) to service_role, authenticated;
alter table public.ticket_orders alter column reference set default public.short_code('ticket_orders');
alter table public.vote_orders alter column reference set default public.short_code('vote_orders');
alter table public.tombola_orders alter column reference set default public.short_code('tombola_orders');
