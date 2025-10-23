-- Migration: add_color_to_classes
-- Description: Adds a color field to the classes table for visual differentiation in the schedule UI
-- Date: 2025-10-23

-- Add color column to classes table
-- Color should be stored in hex format (e.g., #3b82f6)
ALTER TABLE public.classes
ADD COLUMN color text NOT NULL DEFAULT '#3b82f6';

-- Add constraint to ensure color is in valid hex format
ALTER TABLE public.classes
ADD CONSTRAINT color_hex_format CHECK (color ~* '^#[0-9a-f]{6}$');

COMMENT ON COLUMN public.classes.color IS 'hex color code for visual differentiation in the schedule UI (e.g., #3b82f6)';

-- Update existing classes with different colors
-- These are example colors from the Dark Slate Fitness palette
UPDATE public.classes
SET color = CASE 
    WHEN name ILIKE '%yoga%' THEN '#10b981'      -- emerald-500
    WHEN name ILIKE '%pilates%' THEN '#8b5cf6'    -- violet-500
    WHEN name ILIKE '%spinning%' OR name ILIKE '%cycling%' THEN '#ef4444'  -- red-500
    WHEN name ILIKE '%crossfit%' OR name ILIKE '%hiit%' THEN '#f97316'     -- orange-500
    WHEN name ILIKE '%zumba%' OR name ILIKE '%dance%' THEN '#ec4899'       -- pink-500
    WHEN name ILIKE '%box%' THEN '#dc2626'        -- red-600
    WHEN name ILIKE '%strength%' OR name ILIKE '%weights%' THEN '#0891b2'  -- cyan-600
    WHEN name ILIKE '%cardio%' THEN '#f59e0b'     -- amber-500
    WHEN name ILIKE '%stretch%' OR name ILIKE '%flexibility%' THEN '#06b6d4'  -- cyan-500
    ELSE '#3b82f6'  -- blue-500 (default)
END;

