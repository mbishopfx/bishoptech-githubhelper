// Single User Configuration
// This system is designed for personal/single-user use

export const SINGLE_USER = {
  id: '550e8400-e29b-41d4-a716-446655440000', // Fixed UUID for consistency
  email: process.env.SINGLE_USER_EMAIL || 'user@example.com', 
  github_username: process.env.SINGLE_USER_GITHUB_USERNAME || 'your-github-username',
  name: process.env.SINGLE_USER_NAME || 'GitHub Helper User',
  created_at: new Date().toISOString(),
  updated_at: new Date().toISOString()
};

// Helper function to get the single user ID
export function getSingleUserId(): string {
  return SINGLE_USER.id;
}

// Helper function to get user info
export function getSingleUser() {
  return SINGLE_USER;
}

// For API responses that need user context
export function withSingleUser<T>(data: T): T & { user_id: string } {
  return {
    ...data,
    user_id: SINGLE_USER.id
  };
}
