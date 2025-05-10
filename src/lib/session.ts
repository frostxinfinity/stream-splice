'use server';
import type { JWTPayload } from 'jose';
import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';

const secretKey = process.env.AUTH_SECRET;

if (!secretKey) {
  throw new Error('AUTH_SECRET environment variable is not set. Please set it in your .env file.');
}
const key = new TextEncoder().encode(secretKey);

export interface SessionPayload extends JWTPayload {
  userId: string;
  accessToken: string;
  // Add other session data here if needed, e.g., refreshToken, scopes
  // Be mindful of cookie size limits
}

export async function encrypt(payload: SessionPayload) {
  return new SignJWT(payload)
    .setProtectedHeader({ alg: 'HS256' })
    .setIssuedAt()
    .setExpirationTime('1d') // Token valid for 1 day, adjust as needed
    .sign(key);
}

export async function decrypt(input: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(input, key, {
      algorithms: ['HS256'],
    });
    return payload as SessionPayload;
  } catch (error) {
    console.error('Failed to verify session:', error);
    // It's important to clear the invalid cookie if decryption fails
    // to prevent redirect loops or persistent errors for the user.
    // This operation needs to be awaited if cookies() itself returns a promise.
    const cookieStore = await cookies();
    await cookieStore.delete('session');
    return null;
  }
}

export async function createSession(userId: string, accessToken: string) {
  const expires = new Date(Date.now() + 24 * 60 * 60 * 1000); // 1 day
  const sessionToken = await encrypt({ userId, accessToken, exp: expires.getTime() / 1000 });

  const cookieStore = await cookies();
  await cookieStore.set('session', sessionToken, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    expires,
    path: '/',
    sameSite: 'lax',
  });
}

export async function getSession(): Promise<SessionPayload | null> {
  const cookieStore = await cookies();
  const sessionCookie = cookieStore.get('session')?.value;
  if (!sessionCookie) return null;
  return decrypt(sessionCookie);
}

export async function deleteSession() {
  const cookieStore = await cookies();
  // To delete a cookie, set its expiration date to the past.
  // The `delete` method might also be available depending on the Next.js version and context.
  // Using `set` with a past expiry is a common way.
  await cookieStore.set('session', '', { expires: new Date(0), path: '/' });
}
