// src/app/api/moderate/chat-settings/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { getSession } from '@/lib/session';
import { updateChatSettings } from '@/lib/twitchApi';
import type { TwitchChatSettingsRequest } from '@/types';

export async function POST(request: NextRequest) {
  const session = await getSession();
  if (!session || !session.userId || !session.accessToken) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const {
    broadcaster_id,
    settings, // This should be an object matching Partial<TwitchChatSettingsRequest>
  } = await request.json() as { broadcaster_id: string; settings: Partial<TwitchChatSettingsRequest> };

  if (!broadcaster_id || !settings || typeof settings !== 'object') {
    return NextResponse.json({ error: 'Missing required fields: broadcaster_id or valid settings object.' }, { status: 400 });
  }

  // Validate settings object structure if necessary (e.g., check for valid keys/values)
  // For now, we assume the client sends a correctly structured Partial<TwitchChatSettingsRequest>

  try {
    // The moderatorId for the updateChatSettings API call is the logged-in user.
    const updatedSettings = await updateChatSettings(broadcaster_id, session.userId, settings, session.accessToken);
    return NextResponse.json({ success: true, settings: updatedSettings, message: 'Chat settings updated successfully.' });
  } catch (error: any) {
    console.error(`Error in /api/moderate/chat-settings for broadcaster ${broadcaster_id}:`, error);
    const errorMessage = error.response?.data?.message || error.message || 'Failed to update chat settings.';
    const errorStatus = error.response?.status || 500;
    return NextResponse.json({ error: errorMessage }, { status: errorStatus });
  }
}
