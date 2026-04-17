const API_BASE_URL =
  process.env.NEXT_PUBLIC_API_BASE || "http://localhost:8080";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_IMAGE_TYPES.includes(file.type)) {
    return "Invalid file type. Only JPEG, PNG, and WebP are allowed.";
  }

  if (file.size > MAX_IMAGE_SIZE_BYTES) {
    return "Image exceeds the maximum size of 5MB.";
  }

  return null;
}

export function getImageUrl(path: string | undefined): string {
  if (!path) return "";
  if (path.startsWith("http")) return path;
  return `${API_BASE_URL}${path}`;
}

interface ApiResponse<T = any> {
  data?: T;
  error?: string;
  message?: string;
}

class ApiService {
  private baseUrl: string;

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
  }

  private async request<T = any>(
    endpoint: string,
    options: RequestInit = {},
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: "include",
        headers: {
          "Content-Type": "application/json",
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
          console.error(
            "401 Unauthorized on endpoint:",
            endpoint,
            "Method:",
            options.method || "GET",
          );
          console.error("Full URL:", `${this.baseUrl}${endpoint}`);
          window.location.href = "/";
          return { error: "Unauthorized" };
        }
        return { error: data.error || "Une erreur est survenue" };
      }

      return { data, message: data.message };
    } catch (error) {
      console.error("API request failed:", error);
      return { error: "Erreur de connexion au serveur" };
    }
  }

  private async requestForm<T = any>(
    endpoint: string,
    formData: URLSearchParams,
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        method: "POST",
        credentials: "include",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || "Une erreur est survenue" };
      }

      return { data, message: data.message };
    } catch (error) {
      console.error("API form request failed:", error);
      return { error: "Erreur de connexion au serveur" };
    }
  }

  async register(userData: {
    username: string;
    password: string;
    email: string;
    first_name: string;
    last_name: string;
    birthday?: string;
  }): Promise<ApiResponse> {
    const formData = new URLSearchParams();
    Object.entries(userData).forEach(([key, value]) => {
      formData.append(key, value);
    });
    return this.requestForm("/auth/register", formData);
  }

  async login(credentials: {
    username: string;
    password: string;
  }): Promise<ApiResponse> {
    const formData = new URLSearchParams();
    formData.append("username", credentials.username);
    formData.append("password", credentials.password);
    return this.requestForm("/auth/login", formData);
  }

  async logout(): Promise<ApiResponse> {
    return this.request("/logout", {
      method: "POST",
    });
  }

  async verify(token: string): Promise<ApiResponse> {
    return this.request(`/auth/verify?token=${token}`, {
      method: "GET",
    });
  }

  async requestPasswordReset(email: string): Promise<ApiResponse> {
    const formData = new URLSearchParams();
    formData.append("email", email);
    return this.requestForm("/auth/request-reset", formData);
  }

  async resetPassword(
    token: string,
    newPassword: string,
  ): Promise<ApiResponse> {
    const formData = new URLSearchParams();
    formData.append("token", token);
    formData.append("password", newPassword);
    return this.requestForm("/auth/reset-password", formData);
  }

  async getTags(): Promise<
    ApiResponse<{ tags: Array<{ id: number; name: string }> }>
  > {
    return this.request("/tags", {
      method: "GET",
    });
  }

  async addTag(tagName: string): Promise<ApiResponse> {
    return this.request(`/tags?tag=${encodeURIComponent(tagName)}`, {
      method: "POST",
    });
  }

  async deleteTag(tagName: string): Promise<ApiResponse> {
    return this.request(`/tags?tag=${encodeURIComponent(tagName)}`, {
      method: "DELETE",
    });
  }

  async updateLocation(
    latitude: number,
    longitude: number,
    accuracy?: number,
  ): Promise<ApiResponse> {
    return this.request("/location", {
      method: "POST",
      body: JSON.stringify({ latitude, longitude, accuracy }),
    });
  }

  async getUserLocation(userId: string): Promise<
    ApiResponse<{
      location: {
        latitude: number;
        longitude: number;
        accuracy?: number;
        updated_at: string;
      };
    }>
  > {
    return this.request(`/location/${userId}`, {
      method: "GET",
    });
  }

  async getNearbyUsers(
    radius?: number,
    limit?: number,
  ): Promise<
    ApiResponse<{
      nearby_users: Array<{
        user_id: number;
        avatar_url?: string;
        bio?: string;
        latitude: number;
        longitude: number;
        accuracy?: number;
        updated_at: string;
        distance_km: number;
      }>;
      count: number;
      radius_km: number;
      your_location: {
        latitude: number;
        longitude: number;
      };
    }>
  > {
    const params = new URLSearchParams();
    if (radius) params.append("radius", radius.toString());
    if (limit) params.append("limit", limit.toString());

    const queryString = params.toString();
    const endpoint = `/nearby${queryString ? `?${queryString}` : ""}`;

    return this.request(endpoint, {
      method: "GET",
    });
  }

  async recordProfileView(userId: string): Promise<ApiResponse> {
    return this.request(`/profile/${userId}/view`, {
      method: "POST",
    });
  }

  async toggleProfileLike(
    userId: string,
  ): Promise<ApiResponse<{ liked: boolean }>> {
    return this.request(`/profile/${userId}/like`, {
      method: "POST",
    });
  }

  async getProfileStats(userId: string): Promise<
    ApiResponse<{
      views: number;
      likes: number;
      fame_rating: number;
    }>
  > {
    return this.request(`/profile/${userId}/stats`, {
      method: "GET",
    });
  }

  async checkLikeStatus(
    userId: string,
  ): Promise<ApiResponse<{ liked: boolean; liked_back: boolean }>> {
    return this.request(`/profile/${userId}/like-status`, {
      method: "GET",
    });
  }

  async getProfileViewers(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/profile/${userId}/viewers`, {
      method: "GET",
    });
  }

  async getProfileLikers(userId: string): Promise<ApiResponse<any>> {
    return this.request(`/profile/${userId}/likers`, {
      method: "GET",
    });
  }

  async getCurrentUser(): Promise<
    ApiResponse<{
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      gender?: string;
      orientation?: string;
      birthday?: string;
      bio?: string;
      avatar_url?: string;
      fame_rating: number;
      tags?: string[];
      location?: {
        lat: number;
        lon: number;
      };
    }>
  > {
    return this.request("/me", {
      method: "GET",
    });
  }

  async getAllUsers(): Promise<
    ApiResponse<{
      users: Array<{
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        gender?: string;
        orientation?: string;
        birthday?: string;
        bio?: string;
        avatar_url?: string;
        fame_rating: number;
        tags?: string[];
        latitude?: number;
        longitude?: number;
      }>;
    }>
  > {
    return this.request("/users", {
      method: "GET",
    });
  }

  async getSuggestions(filters?: {
    minAge?: number;
    maxAge?: number;
    minFame?: number;
    maxFame?: number;
    maxDistance?: number;
    tags?: string[];
  }): Promise<
    ApiResponse<{
      users: Array<{
        id: number;
        username: string;
        email: string;
        first_name: string;
        last_name: string;
        gender?: string;
        orientation?: string;
        birthday?: string;
        bio?: string;
        avatar_url?: string;
        fame_rating: number;
        tags?: string[];
        latitude?: number;
        longitude?: number;
      }>;
    }>
  > {
    let url = "/suggestions";

    if (filters) {
      const params = new URLSearchParams();
      if (filters.minAge !== undefined)
        params.append("minAge", filters.minAge.toString());
      if (filters.maxAge !== undefined)
        params.append("maxAge", filters.maxAge.toString());
      if (filters.minFame !== undefined)
        params.append("minFame", filters.minFame.toString());
      if (filters.maxFame !== undefined)
        params.append("maxFame", filters.maxFame.toString());
      if (filters.maxDistance !== undefined)
        params.append("maxDistance", filters.maxDistance.toString());
      if (filters.tags && filters.tags.length > 0)
        params.append("tags", filters.tags.join(","));

      const queryString = params.toString();
      if (queryString) {
        url += "?" + queryString;
      }
    }

    return this.request(url, {
      method: "GET",
    });
  }

  async getUserById(userId: string): Promise<
    ApiResponse<{
      id: number;
      username: string;
      email: string;
      first_name: string;
      last_name: string;
      gender?: string;
      orientation?: string;
      birthday?: string;
      bio?: string;
      avatar_url?: string;
      fame_rating: number;
      tags?: string[];
      latitude?: number;
      longitude?: number;
    }>
  > {
    return this.request(`/user/${userId}`, {
      method: "GET",
    });
  }

  async updateProfile(data: {
    gender?: string;
    orientation?: string;
    bio?: string;
    first_name?: string;
    last_name?: string;
    birthday?: string;
  }): Promise<ApiResponse> {
    return this.request("/profile/update", {
      method: "PUT",
      body: JSON.stringify(data),
    });
  }

  async updateEmail(email: string): Promise<ApiResponse> {
    return this.request("/profile/email", {
      method: "PUT",
      body: JSON.stringify({ email }),
    });
  }

  async updateTags(tags: string[]): Promise<ApiResponse> {
    return this.request("/profile/tags", {
      method: "PUT",
      body: JSON.stringify({ tags }),
    });
  }

  async sendMessage(receiverId: number, content: string): Promise<ApiResponse> {
    return this.request("/chat/message", {
      method: "POST",
      body: JSON.stringify({ receiver_id: receiverId, content }),
    });
  }

  async getChatHistory(
    userId: string,
  ): Promise<ApiResponse<{ messages: any[] }>> {
    return this.request(`/chat/history/${userId}`, {
      method: "GET",
    });
  }

  async getConversations(): Promise<ApiResponse<{ conversations: any[] }>> {
    return this.request("/chat/conversations", {
      method: "GET",
    });
  }

  async getNotifications(): Promise<ApiResponse<{ notifications: any[] }>> {
    return this.request("/notifications", {
      method: "GET",
    });
  }

  async markNotificationRead(id: number): Promise<ApiResponse> {
    return this.request(`/notifications/${id}/read`, {
      method: "POST",
    });
  }

  async blockUser(userId: string): Promise<ApiResponse> {
    return this.request(`/user/${userId}/block`, {
      method: "POST",
    });
  }

  async unblockUser(userId: string): Promise<ApiResponse> {
    return this.request(`/user/${userId}/block`, {
      method: "DELETE",
    });
  }

  async getBlockedUsers(): Promise<
    ApiResponse<{
      blocked_users: Array<{
        id: number;
        username: string;
        first_name: string;
        last_name: string;
        avatar_url?: string;
      }>;
    }>
  > {
    return this.request("/user/blocked", {
      method: "GET",
    });
  }

  async reportUser(userId: string, reason: string): Promise<ApiResponse> {
    return this.request(`/user/${userId}/report`, {
      method: "POST",
      body: JSON.stringify({ reason }),
    });
  }

  async uploadImage(file: File): Promise<ApiResponse> {
    const validationError = validateImageFile(file);
    if (validationError) {
      return { error: validationError };
    }

    const formData = new FormData();
    formData.append("image", file);

    try {
      const response = await fetch(`${this.baseUrl}/profile/image`, {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 401 && typeof window !== "undefined") {
          console.error("401 Unauthorized on uploadImage");
          window.location.href = "/";
          return { error: "Unauthorized" };
        }
        return { error: data.error };
      }
      return { data, message: data.message };
    } catch (error) {
      return { error: "Upload failed" };
    }
  }

  async deleteImage(imageId: number): Promise<ApiResponse> {
    return this.request(`/profile/image/${imageId}`, {
      method: "DELETE",
    });
  }

  async getUserImages(userId: string): Promise<ApiResponse<{ images: any[] }>> {
    return this.request(`/user/${userId}/images`, {
      method: "GET",
    });
  }

  async setProfilePicture(imageId: number): Promise<ApiResponse> {
    return this.request(`/profile/image/${imageId}/set-profile`, {
      method: "POST",
    });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
