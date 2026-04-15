#!/usr/bin/env python3
"""
Script to populate the Matcha database with 500 realistic users.
Uses Faker for generating realistic data.
"""

import psycopg2
import random
from faker import Faker
from datetime import datetime, timedelta
import bcrypt

# Database configuration
DB_CONFIG = {
    'host': 'localhost',
    'port': 5432,
    'database': 'matcha',
    'user': 'matcha',
    'password': 'matcha'
}

# Initialize Faker with French locale
fake = Faker(['fr_FR', 'en_US'])

# Constants
NUM_USERS = 500
MAX_CREATION_ATTEMPTS = NUM_USERS * 10
TAGS_LIST = [
    "travel", "cooking", "music", "sports", "reading", "movies", "photography",
    "gaming", "yoga", "hiking", "dancing", "art", "coding", "fitness", "fashion",
    "food", "nature", "pets", "running", "cycling", "swimming", "coffee", "wine",
    "beach", "mountains", "cinema", "series", "concerts", "festivals", "guitar",
    "piano", "singing", "painting", "drawing", "writing", "poetry", "science",
    "history", "politics", "philosophy", "psychology", "meditation", "volunteering",
    "languages", "surfing", "skiing", "climbing", "camping", "fishing", "gardening"
]

FRENCH_CITIES = [
    {"name": "Paris", "lat": 48.8566, "lon": 2.3522},
    {"name": "Lyon", "lat": 45.7640, "lon": 4.8357},
    {"name": "Marseille", "lat": 43.2965, "lon": 5.3698},
    {"name": "Toulouse", "lat": 43.6047, "lon": 1.4442},
    {"name": "Nice", "lat": 43.7102, "lon": 7.2620},
    {"name": "Nantes", "lat": 47.2184, "lon": -1.5536},
    {"name": "Bordeaux", "lat": 44.8378, "lon": -0.5792},
    {"name": "Lille", "lat": 50.6292, "lon": 3.0573},
    {"name": "Rennes", "lat": 48.1173, "lon": -1.6778},
    {"name": "Strasbourg", "lat": 48.5734, "lon": 7.7521},
    {"name": "Montpellier", "lat": 43.6108, "lon": 3.8767},
    {"name": "Grenoble", "lat": 45.1885, "lon": 5.7245},
    {"name": "Dijon", "lat": 47.3220, "lon": 5.0415},
    {"name": "Angers", "lat": 47.4784, "lon": -0.5632},
    {"name": "Clermont-Ferrand", "lat": 45.7772, "lon": 3.0870},
]

def hash_password(password: str) -> str:
    """Hash a password using bcrypt with cost 10 (same as Go backend)."""
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt(rounds=10)).decode('utf-8')

def get_random_birthday():
    """Generate a random birthday between 18 and 50 years ago."""
    today = datetime.now()
    start_date = today - timedelta(days=365 * 50)
    end_date = today - timedelta(days=365 * 18)
    time_between = end_date - start_date
    random_days = random.randint(0, time_between.days)
    return start_date + timedelta(days=random_days)

def get_random_orientation():
    """Get a random sexual orientation."""
    orientations = ["likes men", "likes women", "likes men and women"]
    return random.choice(orientations)

def get_random_gender():
    """Get a random gender."""
    return random.choice(["Man", "Woman"])

def create_user(index):
    """Create a single user with all their data."""
    gender = get_random_gender()
    
    # Generate name based on gender
    if gender == "Man":
        first_name = fake.first_name_male()
    else:
        first_name = fake.first_name_female()
    
    last_name = fake.last_name()
    username = f"{first_name.lower()}{last_name.lower()}{index}".replace(" ", "").replace("'", "")
    email = f"{username}@matcha-test.com"
    
    # Password hash (password is "Password123!")
    password_hash = hash_password("Password123!")
    
    # Random birthday (18-50 years old)
    birthday = get_random_birthday()
    
    # Random orientation
    orientation = get_random_orientation()
    
    # Random bio
    bio = fake.text(max_nb_chars=200)
    
    # Random location
    city = random.choice(FRENCH_CITIES)
    # Add some random offset to coordinates (within ~10km)
    lat = city["lat"] + random.uniform(-0.1, 0.1)
    lon = city["lon"] + random.uniform(-0.1, 0.1)
    
    # Random tags (3-8 tags per user)
    num_tags = random.randint(3, 8)
    user_tags = random.sample(TAGS_LIST, num_tags)
    
    # Random fame rating (0.00 to 100.00)
    fame_rating = round(random.uniform(0, 100), 2)
    
    # Generate random profile picture matching gender
    gender_path = "men" if gender == "Man" else "women"
    image_num = random.randint(1, 99)
    avatar_url = f"https://randomuser.me/api/portraits/{gender_path}/{image_num}.jpg"
    
    return {
        'username': username,
        'email': email,
        'password_hash': password_hash,
        'first_name': first_name,
        'last_name': last_name,
        'gender': gender,
        'orientation': orientation,
        'birthday': birthday,
        'bio': bio,
        'lat': lat,
        'lon': lon,
        'tags': user_tags,
        'fame_rating': fame_rating,
        'avatar_url': avatar_url,
        'verified': True  # Auto-verify test users
    }

def populate_database():
    """Main function to populate the database."""
    print("🚀 Starting database population...")
    
    try:
        # Connect to the database
        conn = psycopg2.connect(**DB_CONFIG)
        cur = conn.cursor()
        
        print("📝 Connected to database")
        
        # First, ensure all tags exist
        print("🏷️  Creating tags...")
        for tag in TAGS_LIST:
            cur.execute(
                "INSERT INTO tags (name) VALUES (%s) ON CONFLICT (name) DO NOTHING",
                (tag,)
            )
        conn.commit()
        print(f"✅ {len(TAGS_LIST)} tags created/verified")
        
        # Create users
        print(f"👥 Creating {NUM_USERS} users...")
        users_created = 0
        user_ids = []
        attempts = 0

        while users_created < NUM_USERS and attempts < MAX_CREATION_ATTEMPTS:
            attempts += 1
            try:
                cur.execute("SAVEPOINT sp_create_user")
                user = create_user(attempts)
                
                # Insert user
                cur.execute("""
                    INSERT INTO users (
                        username, email, password_hash, first_name, last_name,
                        gender, orientation, birthday, bio, verified, fame_rating, avatar_url
                    ) VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s)
                    RETURNING id
                """, (
                    user['username'], user['email'], user['password_hash'],
                    user['first_name'], user['last_name'], user['gender'],
                    user['orientation'], user['birthday'], user['bio'],
                    user['verified'], user['fame_rating'], user['avatar_url']
                ))
                
                user_id = cur.fetchone()[0]
                
                # Insert profile picture into user_images table
                cur.execute("""
                    INSERT INTO user_images (user_id, path, is_profile_picture)
                    VALUES (%s, %s, true)
                """, (user_id, user['avatar_url']))
                
                # Insert location
                cur.execute("""
                    INSERT INTO user_locations (user_id, lat, lon, updated_at)
                    VALUES (%s, %s, %s, NOW())
                """, (user_id, user['lat'], user['lon']))
                
                # Insert tags
                for tag in user['tags']:
                    cur.execute("""
                        INSERT INTO user_tags (user_id, tag_id)
                        SELECT %s, id FROM tags WHERE name = %s
                    """, (user_id, tag))

                user_ids.append(user_id)
                cur.execute("RELEASE SAVEPOINT sp_create_user")
                
                users_created += 1
                
                if users_created % 50 == 0:
                    print(f"   ✓ {users_created} users created...")
                    conn.commit()
                
            except Exception as e:
                print(f"   ⚠️  Error creating user at attempt {attempts}: {e}")
                cur.execute("ROLLBACK TO SAVEPOINT sp_create_user")
                cur.execute("RELEASE SAVEPOINT sp_create_user")
                continue

        conn.commit()

        if users_created < NUM_USERS:
            print(
                f"❌ Could not create {NUM_USERS} users after {attempts} attempts "
                f"(created {users_created})"
            )
            return False
        
        # Populate views and likes to set realistic fame ratings
        print("👁️  Generating realistic profile views and likes to establish fame ratings...")
        views_created = 0
        likes_created = 0
        
        for u_id in user_ids:
            # Each user receives between 10 and 100 views to build their fame
            total_receive_views = random.randint(10, 100)
            candidates = [x for x in user_ids if x != u_id]
            if not candidates:
                continue
            total_receive_views = min(total_receive_views, len(candidates))
            
            # They will get likes based on a random target rating
            target_rating = round(random.uniform(0.1, 0.9), 2)  # Between 10% and 90% fame
            total_receive_likes = int(total_receive_views * target_rating)
            
            viewers = random.sample(candidates, total_receive_views)
            likers = random.sample(viewers, total_receive_likes) # Likers must be a subset of viewers
            
            # Insert views
            for viewer_id in viewers:
                cur.execute("""
                    INSERT INTO profile_views (viewer_id, viewed_id, viewed_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (viewer_id, viewed_id) DO NOTHING
                """, (viewer_id, u_id, datetime.now() - timedelta(days=random.randint(0, 30))))
                views_created += 1
                
            # Insert likes
            for liker_id in likers:
                cur.execute("""
                    INSERT INTO profile_likes (liker_id, liked_id, liked_at)
                    VALUES (%s, %s, %s)
                    ON CONFLICT (liker_id, liked_id) DO NOTHING
                """, (liker_id, u_id, datetime.now() - timedelta(days=random.randint(0, 30))))
                likes_created += 1
                
            # Database triggers will automatically recalculate user's `fame_rating` and cap it at 100
        
        conn.commit()
        print(f"   ✓ Generated {views_created} profile views and {likes_created} profile likes")
        
        print(f"\n✅ Successfully created {users_created} users!")
        print(f"📍 All users have locations assigned")
        print(f"🏷️  All users have tags assigned")
        print(f"⭐ All users have fame ratings")
        print(f"\n🔑 Test credentials:")
        print(f"   Email: any user email @matcha-test.com")
        print(f"   Password: Password123!")
        
    except psycopg2.Error as e:
        print(f"❌ Database error: {e}")
        return False
    except Exception as e:
        print(f"❌ Error: {e}")
        return False
    finally:
        try:
            if 'cur' in locals() and cur:
                cur.close()
            if 'conn' in locals() and conn:
                conn.close()
        except:
            pass
    
    return True

if __name__ == "__main__":
    success = populate_database()
    exit(0 if success else 1)
