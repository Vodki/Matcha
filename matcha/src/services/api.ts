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
}

export const api = new ApiService(API_BASE_URL);
export default api;
