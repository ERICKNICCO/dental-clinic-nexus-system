-- Add target_role and target_user columns to notifications table
ALTER TABLE public.notifications 
ADD COLUMN IF NOT EXISTS target_role text,
ADD COLUMN IF NOT EXISTS target_user text;

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notifications_target_role ON public.notifications(target_role);
CREATE INDEX IF NOT EXISTS idx_notifications_target_user ON public.notifications(target_user);
CREATE INDEX IF NOT EXISTS idx_notifications_read ON public.notifications(read);

-- Enable RLS (Row Level Security) for notifications table
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policy to allow authenticated users to read their own notifications
CREATE POLICY "Users can read their own notifications" ON public.notifications
    FOR SELECT USING (
        auth.role() = 'authenticated' AND (
            target_role = auth.jwt() ->> 'role' OR
            target_user = auth.jwt() ->> 'name' OR
            target_role IS NULL
        )
    );

-- Create policy to allow authenticated users to update their own notifications
CREATE POLICY "Users can update their own notifications" ON public.notifications
    FOR UPDATE USING (
        auth.role() = 'authenticated' AND (
            target_role = auth.jwt() ->> 'role' OR
            target_user = auth.jwt() ->> 'name' OR
            target_role IS NULL
        )
    );

-- Create policy to allow service role to insert notifications
CREATE POLICY "Service role can insert notifications" ON public.notifications
    FOR INSERT WITH CHECK (auth.role() = 'service_role'); 