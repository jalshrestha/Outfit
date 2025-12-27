-- Outfit App Database Schema
-- PostgreSQL

-- Clothing items (wardrobe)
CREATE TABLE IF NOT EXISTS clothing_items (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  image_url TEXT NOT NULL,
  category VARCHAR(50) NOT NULL CHECK (category IN ('top', 'bottom', 'shoes', 'full-outfit')),
  color VARCHAR(100),
  brand VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Model images for try-on
CREATE TABLE IF NOT EXISTS model_images (
  id SERIAL PRIMARY KEY,
  image_url TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Saved outfit history
CREATE TABLE IF NOT EXISTS saved_outfits (
  id VARCHAR(255) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  generated_image_url TEXT NOT NULL,
  model_image_url TEXT NOT NULL,
  top_item_id VARCHAR(255) REFERENCES clothing_items(id) ON DELETE SET NULL,
  bottom_item_id VARCHAR(255) REFERENCES clothing_items(id) ON DELETE SET NULL,
  shoes_item_id VARCHAR(255) REFERENCES clothing_items(id) ON DELETE SET NULL,
  full_outfit_item_id VARCHAR(255) REFERENCES clothing_items(id) ON DELETE SET NULL,
  ai_rating DECIMAL(3,1),
  style VARCHAR(100),
  occasion VARCHAR(100),
  tags TEXT[],
  is_favorite BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- User preferences (intro state, settings, etc.)
CREATE TABLE IF NOT EXISTS user_preferences (
  id SERIAL PRIMARY KEY,
  key VARCHAR(255) UNIQUE NOT NULL,
  value TEXT,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_clothing_category ON clothing_items(category);
CREATE INDEX IF NOT EXISTS idx_outfits_created ON saved_outfits(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_outfits_favorite ON saved_outfits(is_favorite);
CREATE INDEX IF NOT EXISTS idx_preferences_key ON user_preferences(key);
