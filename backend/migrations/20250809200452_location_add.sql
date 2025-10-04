-- +goose Up

-- +goose StatementBegin
-- Table de localisation 1:1 avec users(id)
CREATE TABLE IF NOT EXISTS user_locations (
    user_id     INTEGER PRIMARY KEY
                REFERENCES users(id) ON DELETE CASCADE,
    lat         DOUBLE PRECISION NOT NULL CHECK (lat >= -90 AND lat <= 90),
    lon         DOUBLE PRECISION NOT NULL CHECK (lon >= -180 AND lon <= 180),
    accuracy_m  DOUBLE PRECISION, -- optionnel: précision en mètres
    updated_at  TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Index simples pour aider la "bounding box"
CREATE INDEX IF NOT EXISTS idx_user_locations_lat ON user_locations(lat);
CREATE INDEX IF NOT EXISTS idx_user_locations_lon ON user_locations(lon);

-- Fonction Haversine (km)
CREATE OR REPLACE FUNCTION haversine_km(
    lat1 DOUBLE PRECISION, lon1 DOUBLE PRECISION,
    lat2 DOUBLE PRECISION, lon2 DOUBLE PRECISION
) RETURNS DOUBLE PRECISION
LANGUAGE SQL IMMUTABLE AS $$
  SELECT 2 * 6371.0 * asin(
    sqrt(
      pow(sin(radians(($3 - $1) / 2)), 2) +
      cos(radians($1)) * cos(radians($3)) *
      pow(sin(radians(($4 - $2) / 2)), 2)
    )
  );
$$;
-- +goose StatementEnd


-- +goose Down

-- +goose StatementBegin
DROP FUNCTION IF EXISTS haversine_km(DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION, DOUBLE PRECISION);
DROP INDEX IF EXISTS idx_user_locations_lon;
DROP INDEX IF EXISTS idx_user_locations_lat;
DROP TABLE IF EXISTS user_locations;
-- +goose StatementEnd
