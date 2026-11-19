-- Support portal read receipts: when each message was seen by the other side.
alter table public.messages add column if not exists read_at timestamptz;

-- The reader marks everything the other side sent as seen. Staff read user messages,
-- users read staff messages (system notices count as staff and are harmless to mark).
create or replace function public.mark_support_messages_read(
    p_conversation_id public.messages.conversation_id%type,
    p_reader_is_staff boolean
) returns void
language sql
security definer
set search_path = public
as $$
    update public.messages
    set read_at = now()
    where conversation_id = p_conversation_id
      and is_staff = not p_reader_is_staff
      and read_at is null;
$$;

grant execute on function public.mark_support_messages_read(public.messages.conversation_id%type, boolean) to anon, authenticated;

-- Realtime: receipts arrive as message UPDATEs, and status changes (inactive / reopened)
-- refresh the open chat on both ends.
do $$
begin
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'messages') then
        alter publication supabase_realtime add table public.messages;
    end if;
    if not exists (select 1 from pg_publication_tables where pubname = 'supabase_realtime' and schemaname = 'public' and tablename = 'support_tickets') then
        alter publication supabase_realtime add table public.support_tickets;
    end if;
end $$;
