# Stats Feature Audit & Implementation Plan

**Date**: November 4, 2025  
**Branch**: profile-saw/liked  
**Status**: ✅ COMPLETED - All endpoints and frontend integration done

---

## Summary

The Stats feature (profile views and likes) is **partially implemented**. We can track and display the **COUNT** of views/likes, but cannot yet display the actual **PROFILES** of who viewed/liked the profile.

---

## What Already Exists ✅

### Database Layer (PostgreSQL)
- ✅ `profile_views` table: tracks viewer_id → viewed_id relationships
- ✅ `profile_likes` table: tracks liker_id → liked_id relationships
- ✅ `fame_rating` column in `users` table
- ✅ Unique constraints to prevent duplicate views/likes per user pair
- ✅ Indexes on `viewed_id`, `viewer_id`, `liked_id`, `liker_id` for performance
- ✅ `calculate_fame_rating()` function: returns (likes / max(1, views)) * 100
- ✅ Triggers to auto-update fame_rating after insert/delete on profile_likes and profile_views

### Backend (Go/Gin) - `backend/server/handler.go`
```go
✅ RecordProfileViewHandler (line 607)
   - Route: POST /profile/:userId/view
   - Inserts into profile_views table
   - Increments view count
   
✅ ToggleProfileLikeHandler (line 653)
   - Route: POST /profile/:userId/like
   - INSERT or DELETE on profile_likes
   - Returns { liked: true/false }
   
✅ GetProfileStatsHandler (line 721)
   - Route: GET /profile/:userId/stats
   - Returns { views: int, likes: int, fame_rating: float }
   
✅ CheckLikeStatusHandler (line 763)
   - Route: GET /profile/:userId/like-status
   - Returns { liked: true/false }
```

All routes registered in `backend/server/routes.go` under protected group.

### Frontend API Service - `matcha/src/services/api.ts`
```typescript
✅ recordProfileView(userId: string)
   - POST /profile/:userId/view
   
✅ toggleProfileLike(userId: string)
   - POST /profile/:userId/like
   - Returns { data: { liked: boolean } }
   
✅ getProfileStats(userId: string)
   - GET /profile/:userId/stats
   - Returns { data: { views, likes, fame_rating } }
   
✅ checkLikeStatus(userId: string)
   - GET /profile/:userId/like-status
   - Returns { data: { liked: boolean } }
```

### Frontend Hooks - `matcha/src/hooks/useFameRating.ts`
```typescript
✅ useFameRating(userId: string)
   Returns:
   - stats: { views, likes, fame_rating }
   - isLiked: boolean
   - loading, error
   - recordView(): records a view and refreshes stats
   - toggleLike(): toggles like and refreshes stats
   - refreshStats(): manual refresh
```

---

## What's Missing ❌

### The Core Problem

**StatsInformation Component** (`matcha/src/components/profile/StatsInformation.tsx`) still uses **hardcoded mock data**:

```typescript
// Current (BROKEN) - lines 48-49
const viewsCount = exampleProfiles.length;  // ❌ Mock data!
const likesCount = profilesThatLiked.length; // ❌ Mock data!

// Should be using real data from API
// But we need endpoints to GET the actual profiles!
```

`ProfileCarousel` component receives:
- `exampleProfiles` - list of profiles that supposedly viewed
- `profilesThatLiked` - list of profiles that supposedly liked

But these are from `dataExample/profile.example.ts`, not actual data!

### Missing Backend Endpoints

1. **GET `/profile/:userId/viewers`** ❌
   - Should return array of user profiles who viewed this profile
   - Query: `SELECT u.* FROM users u JOIN profile_views pv ON u.id = pv.viewer_id WHERE pv.viewed_id = $1`
   - Return format: `{ viewers: [Profile, Profile, ...] }`

2. **GET `/profile/:userId/likers`** ❌
   - Should return array of user profiles who liked this profile
   - Query: `SELECT u.* FROM users u JOIN profile_likes pl ON u.id = pl.liker_id WHERE pl.liked_id = $1`
   - Return format: `{ likers: [Profile, Profile, ...] }`

### Missing Frontend API Methods

In `matcha/src/services/api.ts`:

```typescript
❌ async getProfileViewers(userId: string): Promise<ApiResponse<Profile[]>>
   Should call: GET /profile/:userId/viewers

❌ async getProfileLikers(userId: string): Promise<ApiResponse<Profile[]>>
   Should call: GET /profile/:userId/likers
```

### Missing/Incomplete Frontend Hook

`useFameRating` hook needs to be extended to fetch:
- List of viewers
- List of likers

Options:
- **Option A**: Extend `useFameRating` to include viewers/likers
- **Option B**: Create new `useProfileStats` hook that combines everything

### Frontend Component Updates

`StatsInformation.tsx` needs to:
- Call `getProfileViewers()` instead of using mock
- Call `getProfileLikers()` instead of using mock
- Pass real Profile arrays to `ProfileCarousel` components

---

## Implementation Plan

### Step 1: Backend - Add Viewers/Likers Handlers
**File**: `backend/server/handler.go`

Create two new handlers:

```go
func GetProfileViewersHandler(db *sql.DB) gin.HandlerFunc {
  return func(c *gin.Context) {
    userIDVal, exists := c.Get("userID")
    if !exists { c.JSON(401, gin.H{"error": "Unauthorized"}); return }
    
    userID := c.Param("userId")
    
    // Query: get all users who viewed this profile
    rows, err := db.Query(`
      SELECT u.id, u.username, u.first_name, u.last_name, u.email, 
             u.gender, u.orientation, u.birthday, u.bio, u.fame_rating,
             ul.latitude, ul.longitude, string_agg(t.name, ',') as tags
      FROM users u
      JOIN profile_views pv ON u.id = pv.viewer_id
      LEFT JOIN user_locations ul ON u.id = ul.user_id
      LEFT JOIN user_tags ut ON u.id = ut.user_id
      LEFT JOIN tags t ON ut.tag_id = t.id
      WHERE pv.viewed_id = $1
      GROUP BY u.id, ul.latitude, ul.longitude
    `, userID)
    
    // Parse and return array of profiles
    c.JSON(200, gin.H{"viewers": profiles})
  }
}

func GetProfileLikersHandler(db *sql.DB) gin.HandlerFunc {
  // Same pattern as GetProfileViewersHandler but query profile_likes instead
}
```

**Register in routes.go**:
```go
protected.GET("/profile/:userId/viewers", GetProfileViewersHandler(db))
protected.GET("/profile/:userId/likers", GetProfileLikersHandler(db))
```

### Step 2: Frontend - Add API Methods
**File**: `matcha/src/services/api.ts`

Add at end of ApiService class:

```typescript
async getProfileViewers(userId: string): Promise<ApiResponse<Profile[]>> {
  return this.request(`/profile/${userId}/viewers`, {
    method: 'GET',
  });
}

async getProfileLikers(userId: string): Promise<ApiResponse<Profile[]>> {
  return this.request(`/profile/${userId}/likers`, {
    method: 'GET',
  });
}
```

### Step 3: Frontend - Update Hook or Create New One
**File**: `matcha/src/hooks/useFameRating.ts` (or create `useProfileStats.ts`)

Option: Extend existing hook:

```typescript
export function useFameRating(userId: string) {
  const [stats, setStats] = useState<ProfileStats>({...})
  const [isLiked, setIsLiked] = useState(false)
  const [viewers, setViewers] = useState<Profile[]>([])  // NEW
  const [likers, setLikers] = useState<Profile[]>([])    // NEW
  const [loading, setLoading] = useState(true)

  const fetchViewers = useCallback(async () => {
    const result = await api.getProfileViewers(userId)
    if (result.data) setViewers(result.data)
  }, [userId])

  const fetchLikers = useCallback(async () => {
    const result = await api.getProfileLikers(userId)
    if (result.data) setLikers(result.data)
  }, [userId])

  useEffect(() => {
    fetchStats()
    fetchLikeStatus()
    fetchViewers()    // NEW
    fetchLikers()     // NEW
  }, [fetchStats, fetchLikeStatus, fetchViewers, fetchLikers])

  return {
    stats,
    isLiked,
    viewers,     // NEW
    likers,      // NEW
    loading,
    error,
    recordView,
    toggleLike,
    refreshStats: fetchStats,
  }
}
```

### Step 4: Frontend - Update StatsInformation Component
**File**: `matcha/src/components/profile/StatsInformation.tsx`

Replace mock data usage:

```typescript
export default function StatsInformation({
  onSeeProfile,
}: StatsInformationProps) {
  const { stats, viewers, likers, loading } = useFameRating(userId)  // userId from useCurrentUser

  return (
    <section className="min-w-0">
      <h2 className="text-xl font-semibold">✨ Stats ✨</h2>
      <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2 md:gap-6 items-stretch">
        <ProfileCarousel
          title="Who saw your profile 👀"
          profiles={viewers}  // REAL DATA instead of exampleProfiles
          onSeeProfile={onSeeProfile}
        />
        <ProfileCarousel
          title="Who liked your profile"
          profiles={likers}   // REAL DATA instead of profilesThatLiked
          onSeeProfile={onSeeProfile}
        />
      </div>
      <div className="mt-4">
        {loading ? (
          <div className="flex justify-center items-center p-4">
            <span className="loading loading-spinner loading-md"></span>
          </div>
        ) : (
          <FameRating views={stats.views} likes={stats.likes} />
        )}
      </div>
    </section>
  )
}
```

---

## Testing Checklist

- [ ] Backend: POST `/profile/19/view` with different user cookies → should insert into profile_views
- [ ] Backend: GET `/profile/19/viewers` → should return array of profiles
- [ ] Backend: GET `/profile/19/likers` → should return array of profiles  
- [ ] Frontend: StatsInformation shows real viewers/likers instead of mock data
- [ ] Frontend: Carousels populate correctly with real profiles
- [ ] Frontend: Clicking viewer/liker profile opens their detail page
- [ ] Frontend: Stats update in real-time as views/likes are added

---

## Test Account

Username: `louisejacquet17`  
Password: `Password123!`  
User ID: 19  
Use for all testing without security concerns.

---

## Notes

- The database layer is rock solid with proper triggers and functions
- Backend handlers for stats retrieval exist but viewers/likers list retrieval is missing
- Frontend infrastructure is in place (API service, hooks) - just needs the data source
- Main blocker: Backend endpoints to fetch viewer/liker profiles don't exist yet
- Once backend handlers are added, frontend integration should be straightforward

---

## Implementation Summary ✅

All 4 implementation steps have been completed successfully!

### Step 1 ✅ Backend Handlers Added
- `GetProfileViewersHandler` - GET `/profile/:userId/viewers`
  - Queries profile_views + users table with JOINs
  - Returns array of user profiles with location and tags
  - Ordered by most recent view first
  
- `GetProfileLikersHandler` - GET `/profile/:userId/likers`
  - Queries profile_likes + users table with JOINs
  - Returns array of user profiles with location and tags
  - Ordered by most recent like first

**File**: `backend/server/handler.go` (added ~165 lines)  
**Added imports**: `"strings"` for tag parsing

### Step 2 ✅ Routes Registered
**File**: `backend/server/routes.go`
```go
protected.GET("/profile/:userId/viewers", GetProfileViewersHandler(db))
protected.GET("/profile/:userId/likers", GetProfileLikersHandler(db))
```

### Step 3 ✅ Frontend API Methods Added
**File**: `matcha/src/services/api.ts`
```typescript
async getProfileViewers(userId: string): Promise<ApiResponse<any>>
async getProfileLikers(userId: string): Promise<ApiResponse<any>>
```

### Step 4 ✅ Hook Extended
**File**: `matcha/src/hooks/useFameRating.ts`
- Added state: `viewers: any[]`, `likers: any[]`
- Added callbacks: `fetchViewers()`, `fetchLikers()`
- Modified `recordView()` to refresh viewers list
- Modified `toggleLike()` to refresh likers list
- Return value now includes: `{ stats, isLiked, viewers, likers, loading, error, ... }`

### Step 5 ✅ Component Updated
**File**: `matcha/src/components/profile/StatsInformation.tsx`
- Removed hardcoded mock data imports
- Added `useCurrentUser()` to get authenticated user ID
- Added `useFameRating(userId)` to get real viewers/likers
- Replaced `exampleProfiles` with `viewers` prop
- Replaced `profilesThatLiked` with `likers` prop
- ProfileCarousel components now display real profile data

---

## Technical Details

### Query Optimization
Both handlers use efficient PostgreSQL queries with:
- `DISTINCT` to remove duplicate rows from joins
- `GROUP BY` with aggregate functions for tags
- `LEFT JOIN` for optional location and tags data
- `string_agg()` to concatenate tags
- Proper indexing on viewed_id, viewer_id, liked_id, liker_id

### Data Format
Viewers/Likers array contains full user objects:
```json
{
  "id": number,
  "username": string,
  "first_name": string,
  "last_name": string,
  "email": string,
  "gender": string,
  "orientation": string,
  "birthday": Date,
  "bio": string,
  "fame_rating": number,
  "latitude": number,
  "longitude": number,
  "tags": string[]
}
```

### Schema Mapping
Fixed issue with column names:
- `user_locations.lat` and `user_locations.lon` (not latitude/longitude)
- Database uses `string_agg()` for tags aggregation
- Must include MAX(timestamp) in GROUP BY for ORDER BY compatibility

---

## Testing Results ✅

### Backend Endpoints
- ✅ GET `/profile/19/viewers` → Returns `{"viewers": [...]}` (or null if empty)
- ✅ GET `/profile/19/likers` → Returns `{"likers": [...]}` (or null if empty)
- ✅ Both endpoints authenticated (require session_token cookie)
- ✅ Proper error handling for invalid user IDs

### Frontend Integration
- ✅ `useFameRating` hook fetches all required data
- ✅ `StatsInformation` component loads real viewers/likers
- ✅ ProfileCarousel receives proper profile arrays
- ✅ Mock data completely replaced

---


