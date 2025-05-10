// src/app/api/moderate/whisper/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { sendWhisper, getTwitchUserByLogin } from '@/lib/twitchApi';
import type { User } from '@/types';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.userId || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { 
    target_username,  // Username of the user to receive the whisper
    message           // The message content
    // broadcaster_id might be passed for logging/context, but not directly used by Twitch whisper API here
  } = await request.json();

  if (!target_username || !message) {
    return NextResponse.json({ error: 'Missing required fields: target_username or message.' }, { status: 400 });
  }

  if (message.length > 500) { // Twitch whisper character limit
    return NextResponse.json({ error: 'Message exceeds 500 character limit.' }, { status: 400 });
  }

  try {
    // 1. Get the target user's ID from their username
    const targetUser: User | null = await getTwitchUserByLogin(target_username, session.accessToken);
    if (!targetUser || !targetUser.id) {
      return NextResponse.json({ error: `User '${target_username}' not found.` }, { status: 404 });
    }
    const target_user_id = targetUser.id;

    // Ensure user is not trying to whisper themselves (Twitch API might disallow this)
    if (session.userId === target_user_id) {
        return NextResponse.json({ error: "You cannot send a whisper to yourself." }, { status: 400 });
    }

    // 2. Send the whisper
    // The `from_user_id` is the ID of the logged-in user (from the session)
    await sendWhisper(session.userId, target_user_id, message, session.accessToken);
    
    return NextResponse.json({ success: true, message: `Whisper sent to ${target_username}.` });
  } catch (error: any) {
    console.error(`Error in /api/moderate/whisper to target ${target_username}:`, error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to send whisper.';
    // Twitch API can return 403 if whispers are disabled between users, or 429 for rate limits.
    const errorStatus = error.response?.status || (error.message?.includes("whisper to yourself") ? 400 : 500);
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
