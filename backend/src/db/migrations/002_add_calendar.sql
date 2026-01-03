-- Migration: Add Planned Outfits for Calendar Feature
-- Created: 2026-01-02

-- Create planned_outfits table for calendar feature
CREATE TABLE IF NOT EXISTS planned_outfits (
  id SERIAL PRIMARY KEY,
  user_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL,
  outfit_id VARCHAR(100) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, date)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_planned_outfits_user ON planned_outfits(user_id);
CREATE INDEX IF NOT EXISTS idx_planned_outfits_date ON planned_outfits(user_id, date);

-- Add is_favorite column to clothing_items if not exists
ALTER TABLE clothing_items ADD COLUMN IF NOT EXISTS is_favorite BOOLEAN DEFAULT FALSE;
