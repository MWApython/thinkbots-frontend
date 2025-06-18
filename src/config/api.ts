// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'https://thinkbots-backend-1045152789168.me-west1.run.app';

export const API_CONFIG = {
  BASE_URL: API_BASE_URL,
  TIMEOUT: 30000,
  HEADERS: {
    // Content-Type will be set dynamically based on request type
  },
};

// OpenAI Configuration
export const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions';
export const OPENAI_API_KEY = process.env.REACT_APP_OPENAI_API_KEY || '';

export default API_CONFIG; 