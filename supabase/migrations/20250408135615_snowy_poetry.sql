/*
  # Create site generations table

  1. New Tables
    - `site_generations`
      - `id` (uuid, primary key)
      - `created_at` (timestamp)
      - `prompt` (text)
      - `template` (text)
      - `status` (text)
      - `deploy_url` (text)
  2. Security
    - Enable RLS on `site_generations` table
    - Add policy for authenticated users to read their own data
*/

CREATE TABLE IF NOT EXISTS site_generations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  prompt text NOT NULL,
  template text NOT NULL,
  status text NOT NULL,
  deploy_url text,
  user_id uuid REFERENCES auth.users(id)
);

ALTER TABLE site_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can read own generations"
  ON site_generations
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can create generations"
  ON site_generations
  FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);