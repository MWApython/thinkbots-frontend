import API_CONFIG from '../config/api';
import { auth } from '../firebase';

// API utility functions
export const apiCall = async (endpoint: string, options: RequestInit = {}) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const defaultOptions: RequestInit = {
    headers: {
      'Content-Type': 'application/json',
      ...API_CONFIG.HEADERS,
      ...options.headers,
    },
    ...options,
  };

  // Get fresh token from Firebase auth
  let token = null;
  try {
    const currentUser = auth.currentUser;
    if (currentUser) {
      token = await currentUser.getIdToken(true); // Force refresh
      localStorage.setItem('token', token);
    } else {
      token = localStorage.getItem('token');
    }
  } catch (error) {
    console.error('Error getting token:', error);
    token = localStorage.getItem('token');
  }

  if (token) {
    defaultOptions.headers = {
      ...defaultOptions.headers,
      'Authorization': `Bearer ${token}`,
    };
    console.log(`Making API call to ${url} with token: ${token.substring(0, 20)}...`);
  } else {
    console.log(`Making API call to ${url} without token`);
  }

  const response = await fetch(url, defaultOptions);
  
  if (!response.ok) {
    console.error(`API call failed: ${response.status} ${response.statusText} for ${url}`);
    console.error('Response headers:', Object.fromEntries(response.headers.entries()));
    
    // If token is expired, try to refresh and retry once
    if (response.status === 401 && token) {
      try {
        const currentUser = auth.currentUser;
        if (currentUser) {
          const newToken = await currentUser.getIdToken(true);
          localStorage.setItem('token', newToken);
          
          // Retry with new token
          const retryOptions = {
            ...defaultOptions,
            headers: {
              ...defaultOptions.headers,
              'Authorization': `Bearer ${newToken}`,
            },
          };
          
          const retryResponse = await fetch(url, retryOptions);
          if (!retryResponse.ok) {
            throw new Error(`API call failed: ${retryResponse.status} ${retryResponse.statusText}`);
          }
          return retryResponse;
        }
      } catch (refreshError) {
        console.error('Error refreshing token:', refreshError);
      }
    }
    
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response;
};

export const apiGet = async (endpoint: string) => {
  const response = await apiCall(endpoint);
  return response.json();
};

export const apiPost = async (endpoint: string, data: any) => {
  const response = await apiCall(endpoint, {
    method: 'POST',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const apiPut = async (endpoint: string, data: any) => {
  const response = await apiCall(endpoint, {
    method: 'PUT',
    body: JSON.stringify(data),
  });
  return response.json();
};

export const apiDelete = async (endpoint: string) => {
  const response = await apiCall(endpoint, {
    method: 'DELETE',
  });
  return response.json();
};

export const apiUpload = async (endpoint: string, formData: FormData) => {
  const url = `${API_CONFIG.BASE_URL}${endpoint}`;
  
  const token = localStorage.getItem('token');
  const headers: Record<string, string> = {};
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    method: 'POST',
    body: formData,
    headers,
  });
  
  if (!response.ok) {
    throw new Error(`API call failed: ${response.status} ${response.statusText}`);
  }
  
  return response.json();
};

export const getApiUrl = (endpoint: string) => {
  return `${API_CONFIG.BASE_URL}${endpoint}`;
}; 