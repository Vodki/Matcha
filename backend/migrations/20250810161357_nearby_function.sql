-- +goose Up
-- +goose StatementBegin
CREATE OR REPLACE FUNCTION nearby_users(
  lat0 double precision,
  lon0 double precision,
  r_km double precision,
  lim integer DEFAULT 50
)
RETURNS TABLE (
  user_id integer,
  avatar_url text,
  bio text,
  lat double precision,
  lon double precision,
  accuracy_m double precision,
  updated_at timestamp,
  distance_km double precision
)
LANGUAGE sql STABLE AS $$
  WITH bbox AS (
    SELECT
      (r_km / 111.32) AS dlat,
      (r_km / (111.32 * GREATEST(0.0001, cos(radians(lat0))))) AS dlon
  )
  SELECT
    u.id, u.avatar_url, u.bio,
    l.lat, l.lon, l.accuracy_m, l.updated_at,
    haversine_km(lat0, lon0, l.lat, l.lon) AS distance_km
  FROM users u
  JOIN user_locations l ON l.user_id = u.id
  JOIN bbox b ON TRUE
  WHERE l.lat BETWEEN lat0 - b.dlat AND lat0 + b.dlat
    AND l.lon BETWEEN lon0 - b.dlon AND lon0 + b.dlon
    AND haversine_km(lat0, lon0, l.lat, l.lon) <= r_km
  ORDER BY distance_km
  LIMIT lim;
$$;
-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
DROP FUNCTION IF EXISTS nearby_users(double precision,double precision,double precision,integer);
-- +goose StatementEnd