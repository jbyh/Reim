
-- Create options chain cache table for shared read-through caching
CREATE TABLE public.options_chain_cache (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  cache_key TEXT NOT NULL UNIQUE,
  data JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Index on cache_key for fast lookups
CREATE INDEX idx_options_chain_cache_key ON public.options_chain_cache (cache_key);

-- Index on updated_at for TTL cleanup
CREATE INDEX idx_options_chain_cache_updated ON public.options_chain_cache (updated_at);

-- No RLS - only accessed by edge functions via service role
ALTER TABLE public.options_chain_cache ENABLE ROW LEVEL SECURITY;

-- Allow service role full access (edge functions use service role key)
CREATE POLICY "Service role full access" ON public.options_chain_cache
  FOR ALL USING (true) WITH CHECK (true);

-- Trigger to auto-update updated_at
CREATE TRIGGER update_options_chain_cache_updated_at
  BEFORE UPDATE ON public.options_chain_cache
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
