CREATE TABLE public.design_conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

GRANT SELECT, INSERT, UPDATE ON public.design_conversations TO authenticated;
GRANT ALL ON public.design_conversations TO service_role;

ALTER TABLE public.design_conversations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own conversation" ON public.design_conversations
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id OR public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'));

CREATE POLICY "Users create own conversation" ON public.design_conversations
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.design_messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid NOT NULL REFERENCES public.design_conversations(id) ON DELETE CASCADE,
  sender_id uuid NOT NULL,
  sender_role text NOT NULL DEFAULT 'client',
  body text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT design_messages_role_check CHECK (sender_role IN ('client', 'designer')),
  CONSTRAINT design_messages_body_check CHECK (char_length(body) BETWEEN 1 AND 2000)
);

CREATE INDEX design_messages_conversation_created_idx ON public.design_messages (conversation_id, created_at);
CREATE INDEX design_conversations_user_idx ON public.design_conversations (user_id);

GRANT SELECT, INSERT ON public.design_messages TO authenticated;
GRANT ALL ON public.design_messages TO service_role;

ALTER TABLE public.design_messages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users read own conversation messages" ON public.design_messages
  FOR SELECT TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.design_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
    OR public.has_role(auth.uid(), 'admin')
    OR public.has_role(auth.uid(), 'moderator')
  );

CREATE POLICY "Clients send in own conversation" ON public.design_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'client'
    AND EXISTS (
      SELECT 1 FROM public.design_conversations c
      WHERE c.id = conversation_id AND c.user_id = auth.uid()
    )
  );

CREATE POLICY "Designers reply in any conversation" ON public.design_messages
  FOR INSERT TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND sender_role = 'designer'
    AND (public.has_role(auth.uid(), 'admin') OR public.has_role(auth.uid(), 'moderator'))
  );