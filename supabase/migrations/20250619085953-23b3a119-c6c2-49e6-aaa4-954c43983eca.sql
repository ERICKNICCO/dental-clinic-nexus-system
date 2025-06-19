
-- Create the notifications table
CREATE TABLE public.notifications (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  type text NOT NULL,
  title text NOT NULL,
  message text NOT NULL,
  read boolean NOT NULL DEFAULT false,
  timestamp timestamp with time zone NOT NULL DEFAULT now(),
  appointment_id text,
  target_doctor_name text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

-- Enable Row Level Security
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Create policies for notifications
CREATE POLICY "Users can view notifications targeted to them" 
  ON public.notifications 
  FOR SELECT 
  USING (true); -- For now, allow all users to read notifications

CREATE POLICY "Users can update notifications" 
  ON public.notifications 
  FOR UPDATE 
  USING (true);

-- Enable realtime for notifications table
ALTER TABLE public.notifications REPLICA IDENTITY FULL;

-- Add the table to the realtime publication
ALTER PUBLICATION supabase_realtime ADD TABLE public.notifications;

-- Create trigger to update updated_at column
CREATE TRIGGER update_notifications_updated_at 
  BEFORE UPDATE ON public.notifications 
  FOR EACH ROW 
  EXECUTE FUNCTION public.update_updated_at_column();
