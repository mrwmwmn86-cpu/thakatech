CREATE TABLE public.rate_limits (
  user_id uuid NOT NULL,
  window_start timestamptz NOT NULL,
  count integer NOT NULL DEFAULT 0,
  PRIMARY KEY (user_id, window_start)
);

GRANT ALL ON public.rate_limits TO service_role;

ALTER TABLE public.rate_limits ENABLE ROW LEVEL SECURITY;

CREATE INDEX rate_limits_window_idx ON public.rate_limits (window_start);

CREATE OR REPLACE FUNCTION public.check_and_increment_rate_limit(
  _user_id uuid,
  _max_requests integer,
  _window_seconds integer
) RETURNS TABLE(allowed boolean, current_count integer, reset_at timestamptz)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  _window_start timestamptz;
  _count integer;
BEGIN
  _window_start := date_trunc('second', now()) - (extract(epoch from now())::bigint % _window_seconds) * interval '1 second';

  INSERT INTO public.rate_limits (user_id, window_start, count)
  VALUES (_user_id, _window_start, 1)
  ON CONFLICT (user_id, window_start)
  DO UPDATE SET count = public.rate_limits.count + 1
  RETURNING public.rate_limits.count INTO _count;

  DELETE FROM public.rate_limits
  WHERE window_start < now() - interval '1 hour';

  RETURN QUERY SELECT
    (_count <= _max_requests) AS allowed,
    _count AS current_count,
    (_window_start + (_window_seconds || ' seconds')::interval) AS reset_at;
END;
$$;