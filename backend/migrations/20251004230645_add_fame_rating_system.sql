-- +goose Up
-- +goose StatementBegin

-- Table pour tracker les vues de profil
CREATE TABLE IF NOT EXISTS profile_views (
    id SERIAL PRIMARY KEY,
    viewer_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    viewed_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(viewer_id, viewed_id) -- Un utilisateur ne peut voir qu'une fois un profil (évite le spam)
);

CREATE INDEX idx_profile_views_viewed_id ON profile_views(viewed_id);
CREATE INDEX idx_profile_views_viewer_id ON profile_views(viewer_id);

-- Table pour tracker les likes
CREATE TABLE IF NOT EXISTS profile_likes (
    id SERIAL PRIMARY KEY,
    liker_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    liked_at TIMESTAMP NOT NULL DEFAULT NOW(),
    UNIQUE(liker_id, liked_id) -- Un utilisateur ne peut liker qu'une fois
);

CREATE INDEX idx_profile_likes_liked_id ON profile_likes(liked_id);
CREATE INDEX idx_profile_likes_liker_id ON profile_likes(liker_id);

-- Ajouter la colonne fame_rating à la table users
ALTER TABLE users ADD COLUMN fame_rating DECIMAL(5,2) DEFAULT 0.00;

-- Fonction pour calculer le fame rating d'un utilisateur
-- Formule: (nombre_de_likes / max(1, nombre_de_vues)) * 100
CREATE OR REPLACE FUNCTION calculate_fame_rating(user_id_param INTEGER)
RETURNS DECIMAL AS $$
DECLARE
    likes_count INTEGER;
    views_count INTEGER;
    rating DECIMAL;
BEGIN
    -- Compter les likes reçus
    SELECT COUNT(*) INTO likes_count
    FROM profile_likes
    WHERE liked_id = user_id_param;
    
    -- Compter les vues reçues
    SELECT COUNT(*) INTO views_count
    FROM profile_views
    WHERE viewed_id = user_id_param;
    
    -- Calculer le ratio (éviter division par zéro)
    IF views_count = 0 THEN
        rating := 0.00;
    ELSE
        rating := (likes_count::DECIMAL / views_count::DECIMAL) * 100.0;
    END IF;
    
    -- Limiter à 100 max
    IF rating > 100 THEN
        rating := 100.00;
    END IF;
    
    -- Mettre à jour la colonne fame_rating
    UPDATE users SET fame_rating = rating WHERE id = user_id_param;
    
    RETURN rating;
END;
$$ LANGUAGE plpgsql;

-- Trigger pour mettre à jour automatiquement le fame_rating après un like
CREATE OR REPLACE FUNCTION update_fame_rating_on_like()
RETURNS TRIGGER AS $$
BEGIN
    IF TG_OP = 'DELETE' THEN
        PERFORM calculate_fame_rating(OLD.liked_id);
        RETURN OLD;
    ELSE
        PERFORM calculate_fame_rating(NEW.liked_id);
        RETURN NEW;
    END IF;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fame_on_like
AFTER INSERT OR DELETE ON profile_likes
FOR EACH ROW
EXECUTE FUNCTION update_fame_rating_on_like();

-- Trigger pour mettre à jour automatiquement le fame_rating après une vue
CREATE OR REPLACE FUNCTION update_fame_rating_on_view()
RETURNS TRIGGER AS $$
BEGIN
    PERFORM calculate_fame_rating(NEW.viewed_id);
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_fame_on_view
AFTER INSERT ON profile_views
FOR EACH ROW
EXECUTE FUNCTION update_fame_rating_on_view();

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin

DROP TRIGGER IF EXISTS trigger_update_fame_on_view ON profile_views;
DROP TRIGGER IF EXISTS trigger_update_fame_on_like ON profile_likes;
DROP FUNCTION IF EXISTS update_fame_rating_on_view();
DROP FUNCTION IF EXISTS update_fame_rating_on_like();
DROP FUNCTION IF EXISTS calculate_fame_rating(INTEGER);
ALTER TABLE users DROP COLUMN IF EXISTS fame_rating;
DROP TABLE IF EXISTS profile_likes;
DROP TABLE IF EXISTS profile_views;

-- +goose StatementEnd
