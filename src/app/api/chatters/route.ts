// src/app/api/chatters/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getChannelChatters } from '@/lib/twitchApi';
import type { TwitchChatter } from '@/types';

export async function GET(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.userId || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const broadcasterId = searchParams.get('broadcaster_id');

  if (!broadcasterId) {
    return NextResponse.json({ error: 'Missing required field: broadcaster_id.' }, { status: 400 });
  }

  try {
    // The moderatorId for getChannelChatters is the logged-in user (session.userId).
    const chatters: TwitchChatter[] = await getChannelChatters(broadcasterId, session.userId, session.accessToken);
    return NextResponse.json({ chatters });
  } catch (error: any) {
    console.error(`Error in /api/chatters for broadcaster ${broadcasterId}:`, error);
    const errorMessage = error.twitchError?.message || error.message || 'Failed to get chatters.';
    const errorStatus = error.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
