// src/app/api/moderate/timeout/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { timeoutUser, getTwitchUserByLogin } from '@/lib/twitchApi';
import type { User } from '@/types';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.userId || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { 
    broadcaster_id, // ID of the channel where action takes place
    target_username,  // Username of the user to be timed out
    duration,         // Duration in seconds
    reason            // Optional reason for timeout
  } = await request.json();

  if (!broadcaster_id || !target_username || typeof duration !== 'number' || duration <= 0) {
    return NextResponse.json({ error: 'Missing required fields: broadcaster_id, target_username, or valid duration.' }, { status: 400 });
  }

  try {
    // 1. Get the target user's ID from their username
    const targetUser: User | null = await getTwitchUserByLogin(target_username, session.accessToken);
    if (!targetUser || !targetUser.id) {
      return NextResponse.json({ error: `User '${target_username}' not found.` }, { status: 404 });
    }
    const target_user_id = targetUser.id;

    // 2. Perform the timeout action
    // The moderator ID is the ID of the logged-in user (from the session)
    await timeoutUser(broadcaster_id, session.userId, target_user_id, duration, reason || null, session.accessToken);
    
    return NextResponse.json({ success: true, message: `User ${target_username} timed out for ${duration} seconds.` });
  } catch (error: any) {
    console.error(`Error in /api/moderate/timeout for target ${target_username} on channel ${broadcaster_id}:`, error);
    // Pass Twitch API specific error messages if available
    const errorMessage = error.response?.data?.message || error.message || 'Failed to timeout user.';
    const errorStatus = error.response?.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
