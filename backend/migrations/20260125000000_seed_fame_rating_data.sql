-- +goose Up
-- +goose StatementBegin

-- Seed some random profile views and likes for existing users
-- This ensures fame ratings won't reset to 0 when users view each other

DO $$
DECLARE
    user_record RECORD;
    other_user_record RECORD;
    view_count INTEGER;
    like_count INTEGER;
    i INTEGER;
BEGIN
    -- For each verified user
    FOR user_record IN SELECT id FROM users WHERE verified = true LOOP
        -- Generate random number of views (between 5 and 50)
        view_count := 5 + floor(random() * 46)::INTEGER;
        like_count := 0;
        i := 0;
        
        -- Add random views from other users
        FOR other_user_record IN 
            SELECT id FROM users 
            WHERE id != user_record.id AND verified = true
            ORDER BY random()
            LIMIT view_count
        LOOP
            -- Insert view
            INSERT INTO profile_views (viewer_id, viewed_id)
            VALUES (other_user_record.id, user_record.id)
            ON CONFLICT (viewer_id, viewed_id) DO NOTHING;
            
            i := i + 1;
            
            -- Add like with ~40% probability
            IF random() < 0.4 THEN
                INSERT INTO profile_likes (liker_id, liked_id)
                VALUES (other_user_record.id, user_record.id)
                ON CONFLICT (liker_id, liked_id) DO NOTHING;
                like_count := like_count + 1;
            END IF;
        END LOOP;
        
        -- Recalculate fame rating for this user
        PERFORM calculate_fame_rating(user_record.id);
    END LOOP;
END $$;

-- +goose StatementEnd

-- +goose Down
-- +goose StatementBegin
-- We don't delete the seeded data on rollback as it would be destructive
-- +goose StatementEnd
