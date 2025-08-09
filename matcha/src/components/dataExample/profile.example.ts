import type { Profile } from "../types/profile";

export const exampleProfiles: Profile[] = [
  {
    id: "user1",
    firstName: "Justine",
    lastName: "Munoz",
    images: [
      "/jumunoz.jpg",
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=500&q=80",
      "/jumunoz.jpg",
      "/jumunoz.jpg",
      "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=500&q=80",
    ],
    gender: "Woman",
    preferences: "likes men and women",
    bio: "I have 3 cats.",
    interests: ["#cats", "#hiking", "#running"],
  },
  {
    id: "user2",
    firstName: "Louis",
    lastName: "Sylvestre",
    images: [
      "/losylves.jpg",
      "/losylves.jpg",
      "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=500&q=80",
      "/losylves.jpg",
      "https://images.unsplash.com/photo-1517849845537-4d257902454a?w=500&q=80",
    ],
    gender: "Man",
    preferences: "likes women",
    bio: "Sed ut perspiciatis unde omnis iste natus error sit voluptatem accusantium doloremque laudantium...",
    interests: ["#coding", "#running"],
  },
];
