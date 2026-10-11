-- Allow receivers to mark DMs as read (needed for read receipts)
CREATE POLICY "Receivers can mark DMs as read"
ON public.direct_messages FOR UPDATE
USING (auth.uid() = receiver_id)
WITH CHECK (auth.uid() = receiver_id);
-- Allow authenticated users to see all profiles (needed for user picker, community feed)
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
CREATE POLICY "Authenticated users can view profiles"
ON public.profiles FOR SELECT
USING (auth.role() = 'authenticated');