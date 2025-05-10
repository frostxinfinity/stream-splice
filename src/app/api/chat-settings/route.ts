// src/app/api/chat-settings/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { getChatSettings } from '@/lib/twitchApi';

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
    // The moderatorId for the getChatSettings API call is the logged-in user.
    const settings = await getChatSettings(broadcasterId, session.userId, session.accessToken);
    return NextResponse.json(settings);
  } catch (error: any) {
    // Log the full error object structure for better debugging
    // JSON.stringify with Object.getOwnPropertyNames can help reveal non-enumerable properties like 'message' or custom ones.
    console.error(`Error in /api/chat-settings for broadcaster ${broadcasterId}. Full error object:`, JSON.stringify(error, Object.getOwnPropertyNames(error), 2));
    
    let specificErrorMessage = 'Failed to get chat settings. Please ensure you have the necessary permissions for this channel.'; // Default message
    const errorStatus = error?.status || 500; // Default to 500 if status is not on the error object

    // Prioritize message from Twitch's own error structure if available (via error.twitchError.message)
    if (error?.twitchError?.message) {
        specificErrorMessage = error.twitchError.message;
    } else if (error?.message) { // Fallback to the general error message from the Error object
        specificErrorMessage = error.message;
    }
    // No 'else if (typeof error === 'string')' as fetchTwitchApi is designed to throw Error objects.

    console.error(`Responding to /api/chat-settings request with status ${errorStatus} and message: "${specificErrorMessage}"`);
    return NextResponse.json({ error: specificErrorMessage }, { status: errorStatus });
  }
}
