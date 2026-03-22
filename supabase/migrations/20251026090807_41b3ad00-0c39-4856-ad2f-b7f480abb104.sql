-- Add message type enum
CREATE TYPE message_type AS ENUM ('text', 'voice', 'sticker');

-- Add message_type and media_url columns to chat_messages
ALTER TABLE chat_messages 
ADD COLUMN message_type message_type DEFAULT 'text',
ADD COLUMN media_url TEXT;

-- Create storage bucket for voice messages
INSERT INTO storage.buckets (id, name, public) 
VALUES ('voice-messages', 'voice-messages', true)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for voice messages
CREATE POLICY "Voice messages are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'voice-messages');

CREATE POLICY "Users can upload their own voice messages"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voice-messages' AND
  auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own voice messages"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voice-messages' AND
  auth.uid()::text = (storage.foldername(name))[1]
);