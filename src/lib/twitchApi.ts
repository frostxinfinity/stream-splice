// src/lib/twitchApi.ts
'use server';
import type { User, Stream, TwitchTokenResponse, ModeratedChannel, TwitchBanUserRequest, TwitchChatSettingsRequest, TwitchChatSettingsResponse, TwitchModerator, TwitchChatter, TwitchPollRequest, TwitchPollResponse, TwitchEndPollRequest, TwitchPredictionRequest, TwitchPredictionResponse, TwitchEndPredictionRequest } from '@/types';

const TWITCH_API_BASE_URL = 'https://api.twitch.tv/helix';
const TWITCH_AUTH_BASE_URL = 'https://id.twitch.tv/oauth2';

const CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const CLIENT_SECRET = process.env.TWITCH_CLIENT_SECRET;

if (!CLIENT_ID || !CLIENT_SECRET) {
  // This error should ideally be caught at application startup or configuration phase
  // rather than at runtime for every API call, but kept here for robustness.
  console.error('CRITICAL: Twitch Client ID or Secret is not configured in environment variables.');
  // For server components/actions, throwing here is fine.
  // If this file were also used client-side directly (it's not currently for core API calls),
  // a different error handling strategy might be needed for client-side resilience.
  throw new Error('Twitch client ID or secret is not configured in environment variables. This is a server configuration issue.');
}


async function fetchTwitchApi<T>(
  endpoint: string,
  accessToken: string,
  options: RequestInit = {}
): Promise<T> {
  if (!CLIENT_ID) { 
    // This check is somewhat redundant due to the module-level check, but harmless.
    throw new Error('Twitch Client ID is not configured for fetchTwitchApi.');
  }
  const response = await fetch(`${TWITCH_API_BASE_URL}${endpoint}`, {
    ...options,
    headers: {
      'Client-ID': CLIENT_ID!,
      'Authorization': `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  if (!response.ok) {
    let errorData;
    try {
        errorData = await response.json();
    } catch (e) {
        errorData = { message: `Twitch API request failed with status ${response.status} and unparseable body.` };
    }

    const errorMessageDetails = errorData.message || `Twitch API request failed with status ${response.status}`;
    // Construct a more informative error message that includes the endpoint.
    const detailedErrorMessage = `Twitch API Error (${response.status} - ${response.statusText}) for ${options.method || 'GET'} ${endpoint}: ${errorMessageDetails}. Details: ${JSON.stringify(errorData)}`;
    console.error(detailedErrorMessage);
    
    
    if (response.status === 401) {
        console.error(`Twitch API Error (401 - Unauthorized) for ${endpoint}. This could be due to missing scopes, an invalid token, or mismatched IDs for the requested operation. For moderator checks, ensure the token has 'user:read:moderated_channels'. If checking moderators for another channel, the API might require the broadcaster_id to match the token owner unless checking specific user_ids. Original message: ${errorData.message}`);
    } else if (response.status === 403) {
        console.error(`Twitch API Error (403 - Forbidden) for ${endpoint}. The authenticated user may not have permission for this action. Original message: ${errorData.message}`);
    }
    // Throw an error that includes the detailed message and potentially the status.
    // Attaching status to the error object can be helpful for the caller.
    const error = new Error(detailedErrorMessage) as any;
    error.status = response.status;
    error.twitchError = errorData; // Attach original Twitch error data
    throw error;
  }
  // For 204 No Content responses, we might not have JSON.
  if (response.status === 204) {
    return {} as T; // Or handle as appropriate for your use case (e.g., return null or a specific success object)
  }
  return response.json() as Promise<T>;
}

export async function getTwitchUser(accessToken: string): Promise<User | null> {
  try {
    const response = await fetchTwitchApi<{ data: User[] }>('/users', accessToken);
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error('Error fetching Twitch user:', error);
    return null;
  }
}

export async function getTwitchUserByLogin(login: string, accessToken: string): Promise<User | null> {
  if (!login) {
    console.warn('getTwitchUserByLogin called with empty login');
    return null;
  }
  try {
    const response = await fetchTwitchApi<{ data: User[] }>(`/users?login=${encodeURIComponent(login)}`, accessToken);
    return response.data && response.data.length > 0 ? response.data[0] : null;
  } catch (error) {
    console.error(`Error fetching Twitch user by login '${login}':`, error);
    return null;
  }
}


export async function getFollowedStreams(userId: string, accessToken: string): Promise<Stream[]> {
  try {
    const response = await fetchTwitchApi<{ data: Stream[] }>(`/streams/followed?user_id=${userId}`, accessToken);
    return response.data.map((stream, index) => ({
        ...stream,
        order: index + 1, 
    }));
  } catch (error) {
    console.error('Error fetching followed streams:', error);
    return [];
  }
}

export async function exchangeCodeForToken(code: string): Promise<TwitchTokenResponse> {
    const REDIRECT_URI = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/auth/twitch/callback`;
    if (!CLIENT_ID || !CLIENT_SECRET || !REDIRECT_URI || !process.env.NEXT_PUBLIC_APP_BASE_URL) {
        throw new Error('Twitch OAuth configuration is incomplete for token exchange. Check CLIENT_ID, CLIENT_SECRET, and NEXT_PUBLIC_APP_BASE_URL.');
    }
    const params = new URLSearchParams({
        client_id: CLIENT_ID!,
        client_secret: CLIENT_SECRET!,
        code: code,
        grant_type: 'authorization_code',
        redirect_uri: REDIRECT_URI,
    });

    const response = await fetch(`${TWITCH_AUTH_BASE_URL}/token`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: params.toString(),
    });

    if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: 'Token exchange failed' }));
        console.error('Twitch Token Exchange Error:', errorData);
        throw new Error(errorData.message || `Token exchange failed with status ${response.status}`);
    }
    return response.json();
}

export async function checkUserModeratorStatus(
  broadcasterIdToCheckAgainst: string, 
  loggedInUserId: string,              
  accessToken: string
): Promise<boolean> {
  // A user is always a moderator of their own channel.
  if (broadcasterIdToCheckAgainst === loggedInUserId) {
    return true;
  }
  try {
    // Fetches the list of channels the loggedInUserId moderates.
    // Scope: user:read:moderated_channels
    const response = await fetchTwitchApi<{ data: ModeratedChannel[]; pagination?: { cursor?: string } }>(
      `/moderation/channels?user_id=${loggedInUserId}&first=100`, 
      accessToken
    );

    if (response.data && response.data.some(channel => channel.broadcaster_id === broadcasterIdToCheckAgainst)) {
      return true; 
    }
    return false;
  } catch (error: any) {
    console.error(`Error in checkUserModeratorStatus for user ${loggedInUserId} on channel ${broadcasterIdToCheckAgainst}: ${error.message}`);
    if (error.status === 401 || error.status === 403) {
        console.warn(`Permission issue in checkUserModeratorStatus: Status ${error.status}. This might be due to missing 'user:read:moderated_channels' scope or other permission restrictions.`);
    }
    return false;
  }
}


// Timeout a user
export async function timeoutUser(
  broadcasterId: string,
  moderatorId: string,
  targetUserId: string,
  durationInSeconds: number,
  reason: string | null,
  accessToken: string
): Promise<void> {
  const body: TwitchBanUserRequest = {
    data: {
      user_id: targetUserId,
      duration: durationInSeconds,
      reason: reason || undefined, 
    },
  };
  await fetchTwitchApi<void>(
    `/moderation/bans?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

// Ban a user
export async function banUser(
  broadcasterId: string,
  moderatorId: string,
  targetUserId: string,
  reason: string | null,
  accessToken: string
): Promise<void> {
  const body: TwitchBanUserRequest = {
    data: {
      user_id: targetUserId,
      reason: reason || undefined,
    },
  };
  await fetchTwitchApi<void>(
    `/moderation/bans?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}`,
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(body),
    }
  );
}

// Unban a user
export async function unbanUser(
  broadcasterId: string,
  moderatorId: string,
  targetUserId: string,
  accessToken: string
): Promise<void> {
  await fetchTwitchApi<void>(
    `/moderation/bans?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}&user_id=${targetUserId}`,
    accessToken,
    {
      method: 'DELETE',
    }
  );
}

// Get Chat Settings for a broadcaster
export async function getChatSettings(
  broadcasterId: string,
  moderatorId: string, 
  accessToken: string
): Promise<TwitchChatSettingsResponse> { 
  const response = await fetchTwitchApi<{ data: TwitchChatSettingsResponse[] }>(
    `/chat/settings?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}`,
    accessToken,
    { method: 'GET' }
  );
  if (response.data && response.data.length > 0) {
    return response.data[0];
  }
  throw new Error(`Chat settings data for broadcaster ${broadcasterId} (requested by mod ${moderatorId}) was unexpectedly empty or not found in the API response.`);
}


// Update Chat Settings
export async function updateChatSettings(
  broadcasterId: string,
  moderatorId: string, 
  settings: Partial<TwitchChatSettingsRequest>, 
  accessToken: string
): Promise<TwitchChatSettingsResponse> { 
  const response = await fetchTwitchApi<{ data: TwitchChatSettingsResponse[] }>(
    `/chat/settings?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}`,
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify(settings),
    }
  );
  if (response.data && response.data.length > 0) {
    return response.data[0];
  }
  throw new Error(`Failed to update chat settings for broadcaster ${broadcasterId} (by mod ${moderatorId}) or parse response.`);
}

// Send a whisper
export async function sendWhisper(
  fromUserId: string, 
  toUserId: string,   
  message: string,
  accessToken: string
): Promise<void> {
  const endpoint = `/whispers?from_user_id=${fromUserId}&to_user_id=${toUserId}`;
  const body = { message };

  await fetchTwitchApi<void>(endpoint, accessToken, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

// Get Channel Chatters
export async function getChannelChatters(
  broadcasterId: string,
  moderatorId: string, // The user ID of the moderator making the request
  accessToken: string
): Promise<TwitchChatter[]> {
  // Endpoint: GET /chat/chatters?broadcaster_id=<broadcaster_id>&moderator_id=<moderator_id>
  // Scopes: moderator:read:chatters
  // Returns up to 1000 chatters. For more, pagination would be needed.
  try {
    const response = await fetchTwitchApi<{ data: TwitchChatter[]; total: number; pagination?: { cursor?: string } }>(
      `/chat/chatters?broadcaster_id=${broadcasterId}&moderator_id=${moderatorId}&first=1000`, // Fetch up to 1000
      accessToken,
      { method: 'GET' }
    );
    return response.data || [];
  } catch (error: any) {
    console.error(`Error fetching chatters for broadcaster ${broadcasterId}:`, error);
    // If the error is a permission issue (e.g., 401/403), log it specifically
    if (error.status === 401 || error.status === 403) {
      console.warn(`Permission issue fetching chatters for broadcaster ${broadcasterId}. Status: ${error.status}. Ensure 'moderator:read:chatters' scope is granted and the moderatorId (${moderatorId}) has permissions for this channel.`);
    }
    // Re-throw the error to be handled by the calling component
    throw error;
  }
}

// Create a Poll
export async function createPoll(
  pollData: TwitchPollRequest,
  accessToken: string
): Promise<TwitchPollResponse> {
  const response = await fetchTwitchApi<{ data: TwitchPollResponse[] }>(
    '/polls',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(pollData),
    }
  );
  if (response.data && response.data.length > 0) {
    return response.data[0];
  }
  throw new Error('Failed to create poll or parse response.');
}

// End a Poll
export async function endPoll(
  endPollData: TwitchEndPollRequest,
  accessToken: string
): Promise<TwitchPollResponse> {
  const response = await fetchTwitchApi<{ data: TwitchPollResponse[] }>(
    '/polls', // Twitch uses the same endpoint for POST (create) and PATCH (end)
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify(endPollData),
    }
  );
   if (response.data && response.data.length > 0) {
    return response.data[0];
  }
  throw new Error('Failed to end poll or parse response.');
}

// Create a Prediction
export async function createPrediction(
  predictionData: TwitchPredictionRequest,
  accessToken: string
): Promise<TwitchPredictionResponse> {
  const response = await fetchTwitchApi<{ data: TwitchPredictionResponse[] }>(
    '/predictions',
    accessToken,
    {
      method: 'POST',
      body: JSON.stringify(predictionData),
    }
  );
  if (response.data && response.data.length > 0) {
    return response.data[0];
  }
  throw new Error('Failed to create prediction or parse response.');
}

// End a Prediction
export async function endPrediction(
  endPredictionData: TwitchEndPredictionRequest,
  accessToken: string
): Promise<TwitchPredictionResponse> {
   const response = await fetchTwitchApi<{ data: TwitchPredictionResponse[] }>(
    '/predictions', // Twitch uses the same endpoint for POST (create) and PATCH (end)
    accessToken,
    {
      method: 'PATCH',
      body: JSON.stringify(endPredictionData),
    }
  );
  if (response.data && response.data.length > 0) {
    return response.data[0];
  }
  throw new Error('Failed to end prediction or parse response.');
}