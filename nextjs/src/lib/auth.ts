import { cookies } from 'next/headers';

export async function getUser() {
  const cookieStore = cookies();
  const token = cookieStore.get('token');

  if (!token) {
    return null;
  }

  try {
    const response = await fetch(`${process.env.API_URL}/api/auth/check`, {
      headers: {
        Cookie: `token=${token.value}`,
      },
    });

    if (!response.ok) {
      return null;
    }

    return response.json();
  } catch (error) {
    console.error('Auth check error:', error);
    return null;
  }
}

export async function isAuthenticated() {
  const user = await getUser();
  return !!user;
} 