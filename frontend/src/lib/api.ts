import { 
  User, 
  LoginRequest, 
  RegisterRequest, 
  SearchRequest, 
  SearchResult 
} from '../types/api';

// TODO: Replace with your actual API URL
const API_BASE_URL = process.env.NODE_ENV === 'production' 
  ? 'https://your-backend-api.com/api' 
  : 'https://dev-backend-api.com/api';

// Helper function for API requests
async function apiRequest<T>(
  endpoint: string, 
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' = 'GET',
  data?: any
): Promise<T> {
  const token = localStorage.getItem('auth_token');
  
  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    method,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    },
    ...(data ? { body: JSON.stringify(data) } : {})
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'An error occurred');
  }

  return response.json();
}

// Auth API
export const authApi = {
  login: (data: LoginRequest) => apiRequest<{ user: User; token: string }>('/auth/login', 'POST', data),
  register: (data: RegisterRequest) => apiRequest<{ user: User; token: string }>('/auth/register', 'POST', data),
  getCurrentUser: () => apiRequest<User>('/auth/me'),
  logout: () => {
    localStorage.removeItem('auth_token');
    return Promise.resolve();
  }
};

// Search API
export const searchApi = {
  createSearch: (data: SearchRequest) => apiRequest<SearchResult>('/search', 'POST', data),
  getUserSearches: () => apiRequest<SearchResult[]>('/search/user'),
  getSearchById: (id: number) => apiRequest<SearchResult>(`/search/${id}`),
};

// User API
export const userApi = {
  getUserProfile: () => apiRequest<User>('/user/profile'),
  updateUserProfile: (data: Partial<User>) => apiRequest<User>('/user/profile', 'PUT', data),
}; 