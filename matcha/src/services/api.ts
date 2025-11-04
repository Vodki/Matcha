// API Service to communicate with the backend

const API_BASE_URL = process.env.NEXT_PUBLIC_API_BASE || 'http://localhost:8080';

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
    options: RequestInit = {}
  ): Promise<ApiResponse<T>> {
    try {
      const response = await fetch(`${this.baseUrl}${endpoint}`, {
        ...options,
        credentials: 'include', // Important pour les cookies
        headers: {
          'Content-Type': 'application/json',
          ...options.headers,
        },
      });

      const data = await response.json();

      if (!response.ok) {
        return { error: data.error || 'Une erreur est survenue' };
      }

      return { data, message: data.message };
    } catch (error) {
      console.error('API request failed:', error);
      return { error: 'Erreur de connexion au serveur' };
    }
  }

  // Auth endpoints
  async register(userData: {
    username: string;
    password: string;
    email: string;
    first_name: string;
    last_name: string;
  }): Promise<ApiResponse> {
    const formData = new URLSearchParams();
    Object.entries(userData).forEach(([key, value]) => {
      formData.append(key, value);
    });

    const response = await fetch(`${this.baseUrl}/auth/register`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Registration failed' };
    }

    return { message: data.message };
  }

  async login(credentials: {
    username: string;
    password: string;
  }): Promise<ApiResponse> {
    const formData = new URLSearchParams();
    formData.append('username', credentials.username);
    formData.append('password', credentials.password);

    const response = await fetch(`${this.baseUrl}/auth/login`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Login failed' };
    }

    return { message: data.message };
  }

  async logout(): Promise<ApiResponse> {
    return this.request('/logout', {
      method: 'POST',
    });
  }

  async verify(token: string): Promise<ApiResponse> {
    return this.request(`/auth/verify?token=${token}`, {
      method: 'GET',
    });
  }

  // Password reset endpoints
  async requestPasswordReset(email: string): Promise<ApiResponse> {
    const formData = new URLSearchParams();
    formData.append('email', email);

    const response = await fetch(`${this.baseUrl}/auth/request-reset`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to request password reset' };
    }

    return { message: data.message };
  }

  async resetPassword(token: string, newPassword: string): Promise<ApiResponse> {
    const formData = new URLSearchParams();
    formData.append('token', token);
    formData.append('password', newPassword);

    const response = await fetch(`${this.baseUrl}/auth/reset-password`, {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    });

    const data = await response.json();

    if (!response.ok) {
      return { error: data.error || 'Failed to reset password' };
    }

    return { message: data.message };
  }

  // Tags endpoints
  async getTags(): Promise<ApiResponse<{ tags: Array<{ id: number; name: string }> }>> {
    return this.request('/tags', {
      method: 'GET',
    });
  }

  async addTag(tagName: string): Promise<ApiResponse> {
    return this.request(`/tags?tag=${encodeURIComponent(tagName)}`, {
      method: 'POST',
    });
  }

  async deleteTag(tagName: string): Promise<ApiResponse> {
    return this.request(`/tags?tag=${encodeURIComponent(tagName)}`, {
      method: 'DELETE',
    });
  }

  // Location endpoints
  async updateLocation(
    latitude: number,
    longitude: number,
    accuracy?: number
  ): Promise<ApiResponse> {
    return this.request('/location', {
      method: 'POST',
      body: JSON.stringify({ latitude, longitude, accuracy }),
    });
  }

  async getUserLocation(userId: string): Promise<ApiResponse<{
    location: {
      latitude: number;
      longitude: number;
      accuracy?: number;
      updated_at: string;
    };
  }>> {
    return this.request(`/location/${userId}`, {
      method: 'GET',
    });
  }

  async getNearbyUsers(
    radius?: number,
    limit?: number
  ): Promise<ApiResponse<{
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
  }>> {
    const params = new URLSearchParams();
    if (radius) params.append('radius', radius.toString());
    if (limit) params.append('limit', limit.toString());
    
    const queryString = params.toString();
    const endpoint = `/nearby${queryString ? `?${queryString}` : ''}`;
    
    return this.request(endpoint, {
      method: 'GET',
    });
  }

  // Fame rating endpoints
  async recordProfileView(userId: string): Promise<ApiResponse> {
    return this.request(`/profile/${userId}/view`, {
      method: 'POST',
    });
  }

  async toggleProfileLike(userId: string): Promise<ApiResponse<{ liked: boolean }>> {
    return this.request(`/profile/${userId}/like`, {
      method: 'POST',
    });
  }

  async getProfileStats(userId: string): Promise<ApiResponse<{
    views: number;
    likes: number;
    fame_rating: number;
  }>> {
    return this.request(`/profile/${userId}/stats`, {
      method: 'GET',
    });
  }

  async checkLikeStatus(userId: string): Promise<ApiResponse<{ liked: boolean }>> {
    return this.request(`/profile/${userId}/like-status`, {
      method: 'GET',
    });
  }

  // User endpoints
  async getCurrentUser(): Promise<ApiResponse<{
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
  }>> {
    return this.request('/me', {
      method: 'GET',
    });
  }

  async getAllUsers(): Promise<ApiResponse<{
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
  }>> {
    return this.request('/users', {
      method: 'GET',
    });
  }

  async getUserById(userId: string): Promise<ApiResponse<{
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
  }>> {
    return this.request(`/user/${userId}`, {
      method: 'GET',
    });
  }

  // Profile update endpoints
  async updateProfile(data: {
    gender?: string;
    orientation?: string;
    bio?: string;
    first_name?: string;
    last_name?: string;
    birthday?: string;
  }): Promise<ApiResponse> {
    return this.request('/profile/update', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  }

  async updateEmail(email: string): Promise<ApiResponse> {
    return this.request('/profile/email', {
      method: 'PUT',
      body: JSON.stringify({ email }),
    });
  }

  async updateTags(tags: string[]): Promise<ApiResponse> {
    return this.request('/profile/tags', {
      method: 'PUT',
      body: JSON.stringify({ tags }),
    });
  }
}

export const api = new ApiService(API_BASE_URL);
export default api;
