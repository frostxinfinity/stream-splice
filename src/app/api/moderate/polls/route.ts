// src/app/api/moderate/polls/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { createPoll } from '@/lib/twitchApi'; // Assuming endPoll will be added here too
import type { TwitchPollRequest } from '@/types';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.userId || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  try {
    const pollData = await request.json() as Omit<TwitchPollRequest, 'broadcaster_id'>;

    if (!pollData.title || !pollData.choices || pollData.choices.length < 2 || pollData.choices.length > 5 || !pollData.duration) {
      return NextResponse.json({ error: 'Invalid poll data. Title, 2-5 choices, and duration are required.' }, { status: 400 });
    }
    if (pollData.choices.some(c => !c.title || c.title.length > 25)) {
      return NextResponse.json({ error: 'Invalid choice title. Max 25 characters per choice.' }, { status: 400 });
    }
    if (pollData.title.length > 60) {
      return NextResponse.json({ error: 'Poll title exceeds 60 characters.' }, { status: 400 });
    }
    if (pollData.duration < 15 || pollData.duration > 1800) {
      return NextResponse.json({ error: 'Poll duration must be between 15 and 1800 seconds.' }, { status: 400 });
    }
    if (pollData.channel_points_voting_enabled && (!pollData.channel_points_per_vote || pollData.channel_points_per_vote < 1)) {
        return NextResponse.json({ error: 'Channel points per vote must be at least 1 if enabled.' }, { status: 400 });
    }


    // The broadcaster_id for createPoll is the ID of the channel where the poll is created.
    // This should be passed from the client, typically stream.user_id
    const broadcasterId = request.headers.get('X-Broadcaster-ID');
    if (!broadcasterId) {
        return NextResponse.json({ error: 'X-Broadcaster-ID header is required.' }, { status: 400 });
    }

    const fullPollData: TwitchPollRequest = {
      ...pollData,
      broadcaster_id: broadcasterId,
    };

    const createdPoll = await createPoll(fullPollData, session.accessToken);
    return NextResponse.json({ success: true, poll: createdPoll, message: 'Poll created successfully.' });
  } catch (error: any) {
    console.error('Error in /api/moderate/polls POST:', error);
    const errorMessage = error.twitchError?.message || error.message || 'Failed to create poll.';
    const errorStatus = error.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}

// PATCH handler for ending polls could be added here if needed later
// import { endPoll } from '@/lib/twitchApi';
// import type { TwitchEndPollRequest } from '@/types';
// export async function PATCH(request: NextRequest) { ... }