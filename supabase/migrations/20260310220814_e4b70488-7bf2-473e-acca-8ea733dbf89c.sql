-- Allow gym_admin role to delete chat messages for moderation
CREATE POLICY "Gym admins can delete chat messages"
ON public.chat_messages
FOR DELETE
TO authenticated
USING (has_role(auth.uid(), 'gym_admin'::app_role) OR has_role(auth.uid(), 'admin'::app_role));