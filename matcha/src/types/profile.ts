import { getImageUrl } from "../services/api";

export interface Location {
  lat: number;
  lng: number;
  city?: string;
}

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  images: string[];
  gender: string;
  preferences: string;
  bio: string;
  interests: string[];
  birthdate: Date;
  fameRating: number;
  location?: Location;
  isOnline: boolean;
  lastSeen: Date | null;
  matchScore?: number;
  distanceKm?: number;
  commonTags?: number;
}

export interface BackendUserProfile {
  id: number;
  username: string;
  first_name?: string;
  last_name?: string;
  email?: string;
  gender?: string;
  orientation?: string;
  birthday?: string;
  bio?: string;
  avatar_url?: string;
  images?: string[];
  fame_rating?: number;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  location?: {
    lat: number;
    lon: number;
  };
  last_seen?: string;
  is_online?: boolean;
  match_score?: number;
  distance_km?: number;
  common_tags?: number;
}

export function backendUserToProfile(backendUser: BackendUserProfile): Profile {
  let location: Location | undefined = undefined;

  if (backendUser.location) {
    location = {
      lat: backendUser.location.lat,
      lng: backendUser.location.lon,
    };
  } else if (
    backendUser.latitude !== undefined &&
    backendUser.longitude !== undefined
  ) {
    location = {
      lat: backendUser.latitude,
      lng: backendUser.longitude,
    };
  }

  const images = backendUser.images?.length
    ? backendUser.images.map((img) => getImageUrl(img))
    : backendUser.avatar_url
      ? [getImageUrl(backendUser.avatar_url)]
      : [];

  return {
    id: backendUser.id.toString(),
    firstName: backendUser.first_name || backendUser.username || "Unknown",
    lastName: backendUser.last_name || "",
    email: backendUser.email || "",
    username: backendUser.username,
    images,
    gender: backendUser.gender || "Not specified",
    preferences: backendUser.orientation || "likes men and women",
    bio: backendUser.bio || "No bio yet",
    interests: backendUser.tags || [],
    birthdate: backendUser.birthday
      ? (() => {
          const [year, month, day] = backendUser.birthday
            .split("-")
            .map(Number);
          return new Date(year, month - 1, day);
        })()
      : new Date(2000, 0, 1),
    fameRating: backendUser.fame_rating || 0,
    location,
    isOnline: backendUser.is_online || false,
    lastSeen: backendUser.last_seen ? new Date(backendUser.last_seen) : null,
    matchScore: backendUser.match_score,
    distanceKm: backendUser.distance_km,
    commonTags: backendUser.common_tags,
  };
}
