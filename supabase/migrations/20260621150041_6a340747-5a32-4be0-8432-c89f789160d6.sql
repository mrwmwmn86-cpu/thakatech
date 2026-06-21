CREATE POLICY "Users can view own rate limits" ON public.rate_limits FOR SELECT TO authenticated USING (auth.uid() = user_id);
REVOKE ALL ON public.rate_limits FROM anon, authenticated;
GRANT ALL ON public.rate_limits TO service_role;