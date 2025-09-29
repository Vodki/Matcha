"use client";

import React, { createContext, useContext, useReducer, ReactNode } from "react";
import { exampleProfiles } from "../components/dataExample/profile.example";
import { Profile } from "../types/profile";

type User = Profile & { isOnline: boolean; lastSeen: Date | null };

type Like = { likerId: string; likedId: string };
type Visit = { visitorId: string; visitedId: string; timestamp: Date };

export type Message = {
  id: string;
  fromUserId: string;
  toUserId: string;
  content: string;
  timestamp: Date;
  read: boolean;
};

type Notification = {
  id: string;
  recipientId: string;
  fromUser: { id: string; firstName: string; image: string | undefined };
  type: "LIKE" | "VISIT" | "MESSAGE" | "CONNECTION" | "DISCONNECTION";
  read: boolean;
  timestamp: Date;
  message?: string;
};

interface IGlobalState {
  currentUser: User;
  users: User[];
  likes: Like[];
  blockedUserIds: string[];
  visitHistory: Visit[];
  messages: Message[];
  notifications: Notification[];
}

const allUsers: User[] = exampleProfiles.map((p, i) => ({
  ...p,
  isOnline: i % 3 === 0,
  lastSeen: new Date(Date.now() - i * 1000 * 60 * 60 * (24 + i)),
}));

const initialState: IGlobalState = {
  currentUser: {
    id: "me",
    firstName: "Alex",
    lastName: "Dupont",
    images: ["/alex-dupont.jpg"],
    gender: "Woman",
    preferences: "likes men and women",
    bio: "Salut ! Je suis Alex. J'adore le code, les chats et les randonnées. Cherche quelqu'un avec qui partager ces passions (ou m'en faire découvrir de nouvelles !)",
    interests: ["#running", "#cats", "#coding", "#react"],
    birthdate: new Date(2000, 5, 4),
    fameRating: 50,
    isOnline: true,
    lastSeen: null,
  },
  users: allUsers.filter((u) => u.id !== "me"),
  likes: [{ likerId: "user2", likedId: "me" }],
  blockedUserIds: [],
  visitHistory: [],
  messages: [],
  notifications: [],
};

type AppAction =
  | { type: "LIKE_USER"; payload: { userId: string } }
  | { type: "UNLIKE_USER"; payload: { userId: string } }
  | { type: "BLOCK_USER"; payload: { userId: string } }
  | { type: "UNBLOCK_USER"; payload: { userId: string } }
  | { type: "REPORT_USER"; payload: { userId: string } }
  | { type: "RECORD_VISIT"; payload: { userId: string } }
  | { type: "SEND_MESSAGE"; payload: { toUserId: string; content: string } }
  | { type: "RECEIVE_BOT_MESSAGE"; payload: Message }
  | { type: "MARK_NOTIFICATIONS_AS_READ" };

const GlobalAppContext = createContext<{
  state: IGlobalState;
  dispatch: React.Dispatch<AppAction>;
}>({
  state: initialState,
  dispatch: () => null,
});

function appReducer(state: IGlobalState, action: AppAction): IGlobalState {
  switch (action.type) {
    case "LIKE_USER": {
      const { userId: likedUserId } = action.payload;
      const currentUserId = state.currentUser.id;

      if (
        likedUserId === currentUserId ||
        state.likes.some(
          (l) => l.likerId === currentUserId && l.likedId === likedUserId
        )
      ) {
        return state;
      }

      const newLike: Like = { likerId: currentUserId, likedId: likedUserId };
      const updatedLikes = [...state.likes, newLike];

      const isMutual = state.likes.some(
        (l) => l.likerId === likedUserId && l.likedId === currentUserId
      );

      const fromUserInfo = {
        id: state.currentUser.id,
        firstName: state.currentUser.firstName,
        image: state.currentUser.images?.[0],
      };

      const newNotifications = [...state.notifications];

      if (isMutual) {
        newNotifications.push({
          id: `notif-${Date.now()}-a`,
          recipientId: likedUserId,
          fromUser: fromUserInfo,
          type: "CONNECTION",
          read: false,
          timestamp: new Date(),
        });
        const likedUserInfo = state.users.find((u) => u.id === likedUserId);
        if (likedUserInfo) {
          newNotifications.push({
            id: `notif-${Date.now()}-b`,
            recipientId: currentUserId,
            fromUser: {
              id: likedUserInfo.id,
              firstName: likedUserInfo.firstName,
              image: likedUserInfo.images?.[0],
            },
            type: "CONNECTION",
            read: false,
            timestamp: new Date(),
          });
        }
      } else {
        newNotifications.push({
          id: `notif-${Date.now()}`,
          recipientId: likedUserId,
          fromUser: fromUserInfo,
          type: "LIKE",
          read: false,
          timestamp: new Date(),
        });
      }

      return {
        ...state,
        likes: updatedLikes,
        notifications: newNotifications,
      };
    }

    case "UNLIKE_USER": {
      const { userId: unlikedUserId } = action.payload;
      const currentUserId = state.currentUser.id;

      const wasMutual = state.likes.some(
        (l) => l.likerId === unlikedUserId && l.likedId === currentUserId
      );

      const updatedLikes = state.likes.filter(
        (l) => !(l.likerId === currentUserId && l.likedId === unlikedUserId)
      );

      let updatedNotifications = state.notifications;

      if (wasMutual) {
        const fromUserInfo = {
          id: state.currentUser.id,
          firstName: state.currentUser.firstName,
          image: state.currentUser.images?.[0],
        };
        updatedNotifications = [
          ...state.notifications,
          {
            id: `notif-${Date.now()}`,
            recipientId: unlikedUserId,
            fromUser: fromUserInfo,
            type: "DISCONNECTION",
            read: false,
            timestamp: new Date(),
          },
        ];
      }

      return {
        ...state,
        likes: updatedLikes,
        notifications: updatedNotifications,
      };
    }

    case "BLOCK_USER":
      return {
        ...state,
        blockedUserIds: [
          ...new Set([...state.blockedUserIds, action.payload.userId]),
        ],
      };

    case "UNBLOCK_USER":
      return {
        ...state,
        blockedUserIds: state.blockedUserIds.filter(
          (id) => id !== action.payload.userId
        ),
      };

    case "REPORT_USER":
      console.log(
        `User ${action.payload.userId} reported by ${state.currentUser.id}`
      );
      return state;

    case "RECORD_VISIT": {
      const visitedUserId = action.payload.userId;
      if (visitedUserId === state.currentUser.id) return state;

      const newVisit: Visit = {
        visitorId: state.currentUser.id,
        visitedId: visitedUserId,
        timestamp: new Date(),
      };

      const fromUserInfo = {
        id: state.currentUser.id,
        firstName: state.currentUser.firstName,
        image: state.currentUser.images?.[0],
      };

      const newNotif: Notification = {
        id: `notif-${Date.now()}`,
        recipientId: visitedUserId,
        fromUser: fromUserInfo,
        type: "VISIT",
        read: false,
        timestamp: new Date(),
      };

      return {
        ...state,
        visitHistory: [...state.visitHistory, newVisit],
        notifications: [...state.notifications, newNotif],
      };
    }

    case "SEND_MESSAGE": {
      const { toUserId, content } = action.payload;
      const newMessage: Message = {
        id: `msg-${Date.now()}`,
        fromUserId: state.currentUser.id,
        toUserId,
        content,
        timestamp: new Date(),
        read: true,
      };

      const fromUserInfo = {
        id: state.currentUser.id,
        firstName: state.currentUser.firstName,
        image: state.currentUser.images?.[0],
      };

      const newNotification: Notification = {
        id: `notif-${Date.now()}`,
        recipientId: toUserId,
        fromUser: fromUserInfo,
        type: "MESSAGE",
        read: false,
        timestamp: new Date(),
      };

      return {
        ...state,
        messages: [...state.messages, newMessage],
        notifications: [...state.notifications, newNotification],
      };
    }

    case "RECEIVE_BOT_MESSAGE": {
      return {
        ...state,
        messages: [...state.messages, action.payload],
      };
    }

    case "MARK_NOTIFICATIONS_AS_READ": {
      return {
        ...state,
        notifications: state.notifications.map((n) =>
          n.recipientId === state.currentUser.id ? { ...n, read: true } : n
        ),
      };
    }

    default:
      return state;
  }
}

export const GlobalAppContextProvider = ({
  children,
}: {
  children: ReactNode;
}) => {
  const [state, dispatch] = useReducer(appReducer, initialState);
  return (
    <GlobalAppContext.Provider value={{ state, dispatch }}>
      {children}
    </GlobalAppContext.Provider>
  );
};

export const useGlobalAppContext = () => {
  return useContext(GlobalAppContext);
};
