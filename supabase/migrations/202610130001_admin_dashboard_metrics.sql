begin;

create function public.get_admin_dashboard_metrics(p_edition text)
returns table(
  tickets_sold bigint,
  ticket_revenue_xaf bigint,
  paid_vote_orders bigint,
  vote_revenue_xaf bigint,
  tombola_entries bigint,
  tombola_revenue_xaf bigint,
  accepted_checkins bigint,
  new_inquiries bigint,
  paid_player_registrations bigint
)
language plpgsql stable security definer set search_path = '' as $$
begin
  if not public.has_edition_role(p_edition, array['admin','manager']) then
    raise exception 'FORBIDDEN';
  end if;
  return query
  select
    coalesce((select sum(o.quantity)::bigint from public.ticket_orders o where o.edition_id = p_edition and o.status = 'paid' and o.is_test = false), 0),
    coalesce((select sum(o.total_xaf)::bigint from public.ticket_orders o where o.edition_id = p_edition and o.status = 'paid' and o.is_test = false), 0),
    coalesce((select count(*)::bigint from public.vote_orders o where o.edition_id = p_edition and o.status = 'paid'), 0),
    coalesce((select sum(o.total_xaf)::bigint from public.vote_orders o where o.edition_id = p_edition and o.status = 'paid'), 0),
    coalesce((select sum(o.quantity)::bigint from public.tombola_orders o where o.edition_id = p_edition and o.status = 'paid'), 0),
    coalesce((select sum(o.total_xaf)::bigint from public.tombola_orders o where o.edition_id = p_edition and o.status = 'paid'), 0),
    coalesce((select count(*)::bigint from public.ticket_checkins c where c.edition_id = p_edition and c.result = 'accepted'), 0),
    coalesce((select count(*)::bigint from public.inquiries i where i.edition_id = p_edition and i.status = 'new'), 0),
    coalesce((select count(*)::bigint from public.player_registrations p where p.edition_id = p_edition and p.status = 'paid'), 0);
end;
$$;

revoke all on function public.get_admin_dashboard_metrics(text) from public, anon;
grant execute on function public.get_admin_dashboard_metrics(text) to authenticated;

commit;
