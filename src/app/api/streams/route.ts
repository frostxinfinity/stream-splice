// src/app/api/streams/route.ts
import { NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getFollowedStreams } from '@/lib/twitchApi';

export async function GET() {
  const session = await getSession();

  if (!session || !session.userId || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const streams = await getFollowedStreams(session.userId, session.accessToken);
    return NextResponse.json({ streams });
  } catch (error) {
    console.error('Error fetching streams in /api/streams:', error);
    return NextResponse.json({ error: 'Failed to fetch streams' }, { status: 500 });
  }
}
