// src/app/api/user/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getTwitchUser } from '@/lib/twitchApi';
import type { User } from '@/types';


export async function GET() {
  const session = await getSession();

  if (!session || !session.accessToken) {
    return NextResponse.json({ user: null }, { status: 200 });
  }

  try {
    // Optionally re-fetch user from Twitch to ensure data is fresh,
    // or return stored data if sufficient.
    // For simplicity, we'll re-fetch.
    const user = await getTwitchUser(session.accessToken);
    if (user) {
      // Map Twitch API user to our User type if necessary
      const appUser: User = {
        id: user.id,
        login: user.login,
        display_name: user.display_name,
        profile_image_url: user.profile_image_url,
        // email: user.email, // if email scope was requested and present
      };
      return NextResponse.json({ user: appUser });
    } else {
      // Token might be invalid or user not found
      return NextResponse.json({ user: null }, { status: 401 }); // Or clear session
    }
  } catch (error) {
    console.error('Error fetching user in /api/user:', error);
    return NextResponse.json({ user: null, error: 'Failed to fetch user data' }, { status: 500 });
  }
}
