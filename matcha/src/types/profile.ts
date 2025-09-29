export type Location = {
  city: string;
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
