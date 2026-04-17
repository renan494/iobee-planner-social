ALTER TABLE public.clients
ADD COLUMN active_strategy_id UUID REFERENCES public.strategies(id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_clients_active_strategy_id ON public.clients(active_strategy_id);