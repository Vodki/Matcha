export type Location = {
  city?: string;
  country?: string;
  lat: number;
  lng: number;
};

export interface Profile {
  id: string;
  firstName: string;
  lastName: string;
  images: string[];
  gender: string;
  preferences: string;
  bio: string;
  interests: string[];
  birthdate: Date;
  fameRating: number;
  location?: Location;
}

// Interface pour les profils reçus du backend
export interface BackendUserProfile {
  id: number;
  username: string;
  first_name: string;
  last_name: string;
  email: string;
  gender?: string;
  orientation?: string;
  birthday?: string;
  bio?: string;
  avatar_url?: string;
  fame_rating: number;
  tags?: string[];
  latitude?: number;
  longitude?: number;
  location?: {
    lat: number;
    lon: number;
  };
}

// Fonction pour convertir un profil backend en profil frontend
export function backendUserToProfile(backendUser: BackendUserProfile): Profile {
  // Gérer la localisation depuis différents formats du backend
  let location: Location | undefined = undefined;
  
  if (backendUser.location) {
    // Format de l'endpoint /me: { lat, lon }
    location = { 
      lat: backendUser.location.lat, 
      lng: backendUser.location.lon 
    };
  } else if (backendUser.latitude !== undefined && backendUser.longitude !== undefined) {
    // Format de l'endpoint /users: latitude, longitude
    location = { 
      lat: backendUser.latitude, 
      lng: backendUser.longitude 
    };
  }
  
  return {
    id: backendUser.id.toString(),
    firstName: backendUser.first_name || backendUser.username || 'Unknown',
    lastName: backendUser.last_name || '',
    images: backendUser.avatar_url ? [backendUser.avatar_url] : [],
    gender: backendUser.gender || 'Not specified',
    preferences: backendUser.orientation || 'likes men and women',
    bio: backendUser.bio || 'No bio yet',
    interests: backendUser.tags || [],
    birthdate: backendUser.birthday ? new Date(backendUser.birthday) : new Date(2000, 0, 1),
    fameRating: backendUser.fame_rating || 0,
    location,
  };
}

