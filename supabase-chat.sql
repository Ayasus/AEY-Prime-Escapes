create table if not exists public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id text not null,
  property_id text not null,
  agent_id text not null,
  sender_id uuid references auth.users(id) on delete set null,
  sender_role text not null check (sender_role in ('user', 'agent')),
  message text not null check (char_length(trim(message)) > 0),
  created_at timestamptz not null default now()
);

create index if not exists chat_messages_conversation_created_idx
  on public.chat_messages (conversation_id, created_at);

alter table public.chat_messages enable row level security;

create or replace function public.user_has_chat_conversation(target_conversation_id text)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.chat_messages
    where conversation_id = target_conversation_id
      and sender_id = auth.uid()
  );
$$;

create policy "Users can read their conversations"
on public.chat_messages for select
to authenticated
using (
  public.user_has_chat_conversation(conversation_id)
);

create policy "Users can send their own messages"
on public.chat_messages for insert
to authenticated
with check (
  sender_id = auth.uid()
  and sender_role = 'user'
);

alter table public.chat_messages replica identity full;

-- Enable Realtime for this table in Supabase Dashboard if it is not already enabled.
-- Agent replies should be inserted by a protected server-side agent tool using the service role.
