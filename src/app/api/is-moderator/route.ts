// src/app/api/is-moderator/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { checkUserModeratorStatus } from '@/lib/twitchApi'; // Updated import

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const broadcasterId = searchParams.get('broadcaster_id'); // The channel being viewed

  if (!broadcasterId) {
    return NextResponse.json({ error: 'broadcaster_id is required' }, { status: 400 });
  }

  const session = await getSession();

  if (!session || !session.userId || !session.accessToken) {
    return NextResponse.json({ isModerator: false, error: 'Unauthorized - No active session' }, { status: 401 });
  }

  // The broadcaster of a channel is always a moderator of their own channel.
  // This check remains valid.
  if (session.userId === broadcasterId) {
    return NextResponse.json({ isModerator: true });
  }

  try {
    // Use checkUserModeratorStatus to determine if the logged-in user (session.userId)
    // is a moderator for the specified broadcasterId (the channel being viewed).
    const isModerator = await checkUserModeratorStatus(broadcasterId, session.userId, session.accessToken);
    return NextResponse.json({ isModerator });
  } catch (error) {
    // This catch block is for unexpected errors within this route handler itself,
    // as checkUserModeratorStatus is expected to handle its own API call errors and return boolean.
    console.error(`Unexpected error in /api/is-moderator route for broadcaster ${broadcasterId}, user ${session.userId}:`, error);
    return NextResponse.json({ isModerator: false, error: 'Server error while checking moderator status' }, { status: 500 });
  }
}