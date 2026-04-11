-- +goose Up
-- +goose StatementBegin

-- Seed placeholder images for existing users who don't have any images
-- Uses randomuser.me placeholder images

DO $$
DECLARE
    user_record RECORD;
    random_gender TEXT;
    image_num INTEGER;
    image_url TEXT;
BEGIN
    -- For each verified user without an avatar or images
    FOR user_record IN 
        SELECT u.id, u.gender
        FROM users u
        WHERE u.verified = true
        AND u.avatar_url IS NULL
        AND NOT EXISTS (SELECT 1 FROM user_images WHERE user_id = u.id)
    LOOP
        -- Determine gender for random image
        IF user_record.gender = 'Man' OR user_record.gender = 'man' OR user_record.gender = 'Male' OR user_record.gender = 'male' THEN
            random_gender := 'men';
        ELSE
            random_gender := 'women';
        END IF;
        
        -- Generate random image number (1-99)
        image_num := 1 + floor(random() * 99)::INTEGER;
        
        -- Construct image URL using randomuser.me portraits
        image_url := 'https://randomuser.me/api/portraits/' || random_gender || '/' || image_num || '.jpg';
        
        -- Update avatar_url in users table
        UPDATE users SET avatar_url = image_url WHERE id = user_record.id;
        
        -- Also insert into user_images table
        INSERT INTO user_images (user_id, path, is_profile_picture)
        VALUES (user_record.id, image_url, true);
    END LOOP;
END $$;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- We don't remove seeded images on rollback
-- +goose StatementEnd
