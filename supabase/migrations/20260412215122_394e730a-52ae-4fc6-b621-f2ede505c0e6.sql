CREATE TABLE public.session_ble_chunks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  session_id uuid NOT NULL REFERENCES public.sessions(id) ON DELETE CASCADE,
  chunk_index integer NOT NULL,
  data jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (session_id, chunk_index)
);

ALTER TABLE public.session_ble_chunks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can insert their own session chunks"
  ON public.session_ble_chunks FOR INSERT TO authenticated
  WITH CHECK (
    EXISTS (SELECT 1 FROM public.sessions WHERE id = session_id AND user_id = auth.uid())
  );

CREATE POLICY "Users can view their own session chunks"
  ON public.session_ble_chunks FOR SELECT TO authenticated
  USING (
    EXISTS (SELECT 1 FROM public.sessions WHERE id = session_id AND user_id = auth.uid())
  );