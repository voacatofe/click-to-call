-- Create table for RD Station configurations
CREATE TABLE IF NOT EXISTS rd_station_configs (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Create unique constraint to ensure one config per user
ALTER TABLE rd_station_configs ADD CONSTRAINT rd_station_configs_user_id_key UNIQUE (user_id);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS rd_station_configs_user_id_idx ON rd_station_configs(user_id);

-- Enable Row Level Security (RLS)
ALTER TABLE rd_station_configs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Users can only see their own configurations
CREATE POLICY "Users can view their own RD Station configs" ON rd_station_configs
    FOR SELECT USING (auth.uid() = user_id);

-- Users can only insert their own configurations
CREATE POLICY "Users can insert their own RD Station configs" ON rd_station_configs
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can only update their own configurations
CREATE POLICY "Users can update their own RD Station configs" ON rd_station_configs
    FOR UPDATE USING (auth.uid() = user_id);

-- Users can only delete their own configurations
CREATE POLICY "Users can delete their own RD Station configs" ON rd_station_configs
    FOR DELETE USING (auth.uid() = user_id);

-- Function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = timezone('utc'::text, now());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
CREATE TRIGGER update_rd_station_configs_updated_at
    BEFORE UPDATE ON rd_station_configs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();