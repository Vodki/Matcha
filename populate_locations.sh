#!/bin/bash

# Script to populate the database with test users and locations
# This helps test the geolocation features

echo "🌍 Populating database with test locations..."

# Cities in France with coordinates
declare -A cities=(
  ["Paris"]="48.8566,2.3522"
  ["Lyon"]="45.7640,4.8357"
  ["Marseille"]="43.2965,5.3698"
  ["Toulouse"]="43.6047,1.4442"
  ["Nice"]="43.7102,7.2620"
  ["Nantes"]="47.2184,-1.5536"
  ["Bordeaux"]="44.8378,-0.5792"
  ["Lille"]="50.6292,3.0573"
)

# Get existing users
echo "📋 Fetching existing users..."
USERS=$(docker exec matcha_db psql -U matcha -d matcha -t -c "SELECT id FROM users ORDER BY id;")

if [ -z "$USERS" ]; then
  echo "❌ No users found in database. Please create some users first."
  exit 1
fi

echo "👥 Found users:"
echo "$USERS"

# Assign random locations to users
counter=0
for user_id in $USERS; do
  # Get random city
  cities_array=(Paris Lyon Marseille Toulouse Nice Nantes Bordeaux Lille)
  random_city=${cities_array[$RANDOM % ${#cities_array[@]}]}
  coords=${cities[$random_city]}
  lat=$(echo $coords | cut -d',' -f1)
  lon=$(echo $coords | cut -d',' -f2)
  
  # Add small random offset (±0.1 degrees ≈ ±11km)
  lat_offset=$(awk -v seed=$RANDOM 'BEGIN{srand(seed); printf "%.4f", (rand()-0.5)/5}')
  lon_offset=$(awk -v seed=$RANDOM 'BEGIN{srand(seed); printf "%.4f", (rand()-0.5)/5}')
  
  final_lat=$(awk "BEGIN {printf \"%.6f\", $lat + $lat_offset}")
  final_lon=$(awk "BEGIN {printf \"%.6f\", $lon + $lon_offset}")
  
  # Random accuracy between 10-100m
  accuracy=$((10 + RANDOM % 90))
  
  echo "📍 Setting location for user $user_id near $random_city ($final_lat, $final_lon)"
  
  docker exec matcha_db psql -U matcha -d matcha -c \
    "INSERT INTO user_locations (user_id, lat, lon, accuracy_m, updated_at) 
     VALUES ($user_id, $final_lat, $final_lon, $accuracy, NOW())
     ON CONFLICT (user_id) 
     DO UPDATE SET lat = $final_lat, lon = $final_lon, accuracy_m = $accuracy, updated_at = NOW();" \
    > /dev/null
  
  ((counter++))
done

echo ""
echo "✅ Successfully set locations for $counter users!"
echo ""
echo "📊 Location distribution:"
docker exec matcha_db psql -U matcha -d matcha -c "
  SELECT 
    COUNT(*) as total_users_with_location,
    ROUND(AVG(accuracy_m)::numeric, 2) as avg_accuracy_m
  FROM user_locations;
"

echo ""
echo "🎯 You can now test the nearby users feature!"
echo "   Try: http://localhost:3000/test-location"
