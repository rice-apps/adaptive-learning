-- Migration: Add diagnostic_results column to Students table
-- Run this SQL in your Supabase SQL editor

ALTER TABLE public.Students
ADD COLUMN IF NOT EXISTS diagnostic_results JSONB;

-- Optional: Add a comment to document the column
COMMENT ON COLUMN public.Students.diagnostic_results IS 'Stores diagnostic quiz results including strengths, weaknesses, performance data, and completion timestamp';
