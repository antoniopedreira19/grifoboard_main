-- Create table for marketplace reviews/ratings
CREATE TABLE public.marketplace_reviews (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  target_type TEXT NOT NULL CHECK (target_type IN ('empresa', 'profissional', 'fornecedor')),
  target_id UUID NOT NULL,
  rating INTEGER NOT NULL CHECK (rating >= 0 AND rating <= 5),
  comment TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  UNIQUE(user_id, target_type, target_id)
);

-- Enable RLS
ALTER TABLE public.marketplace_reviews ENABLE ROW LEVEL SECURITY;

-- Policy: Any authenticated user can view reviews
CREATE POLICY "Anyone can view reviews"
ON public.marketplace_reviews
FOR SELECT
TO authenticated
USING (true);

-- Policy: Users can insert their own reviews
CREATE POLICY "Users can insert own reviews"
ON public.marketplace_reviews
FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = user_id);

-- Policy: Users can update their own reviews
CREATE POLICY "Users can update own reviews"
ON public.marketplace_reviews
FOR UPDATE
TO authenticated
USING (auth.uid() = user_id);

-- Policy: Users can delete their own reviews
CREATE POLICY "Users can delete own reviews"
ON public.marketplace_reviews
FOR DELETE
TO authenticated
USING (auth.uid() = user_id);

-- Create index for faster lookups
CREATE INDEX idx_marketplace_reviews_target ON public.marketplace_reviews(target_type, target_id);
CREATE INDEX idx_marketplace_reviews_user ON public.marketplace_reviews(user_id);