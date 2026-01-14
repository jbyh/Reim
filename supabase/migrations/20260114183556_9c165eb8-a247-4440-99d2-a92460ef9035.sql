-- Add encrypted key columns (the old plaintext columns will be replaced)
-- First check if we have the old columns and migrate to encrypted versions

-- Create helper columns for encrypted storage
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS alpaca_api_key_encrypted text,
ADD COLUMN IF NOT EXISTS alpaca_secret_key_encrypted text;

-- Drop the old plaintext columns if they exist
ALTER TABLE public.profiles DROP COLUMN IF EXISTS alpaca_api_key;
ALTER TABLE public.profiles DROP COLUMN IF EXISTS alpaca_secret_key;