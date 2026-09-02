-- Create chat_messages table
CREATE TABLE chat_messages (
  id BIGSERIAL PRIMARY KEY,
  user_id UUID NOT NULL,
  email TEXT NOT NULL,
  nickname TEXT NOT NULL,
  message TEXT NOT NULL,
  is_admin BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_chat_messages_created_at ON chat_messages(created_at DESC);
CREATE INDEX idx_chat_messages_user_id ON chat_messages(user_id);

-- Enable RLS
ALTER TABLE chat_messages ENABLE ROW LEVEL SECURITY;

-- RLS Policy: Allow all authenticated users to read all messages
CREATE POLICY "Allow read all messages" ON chat_messages
FOR SELECT USING (true);

-- RLS Policy: Allow users to insert their own messages
CREATE POLICY "Allow insert own messages" ON chat_messages
FOR INSERT WITH CHECK (auth.uid() = user_id);

-- RLS Policy: Allow users to delete their own messages
CREATE POLICY "Allow delete own messages" ON chat_messages
FOR DELETE USING (auth.uid() = user_id);
