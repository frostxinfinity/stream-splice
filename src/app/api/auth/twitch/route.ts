// src/app/api/auth/twitch/route.ts
import { NextResponse } from 'next/server';

const TWITCH_CLIENT_ID = process.env.TWITCH_CLIENT_ID;
const REDIRECT_URI =  `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/auth/twitch/callback`;
const TWITCH_AUTH_URL = 'https://id.twitch.tv/oauth2/authorize';

export async function GET() {
  if (!TWITCH_CLIENT_ID || !REDIRECT_URI) {
    return NextResponse.json({ error: 'Twitch configuration missing' }, { status: 500 });
  }

   const scopes = [
    'user:read:follows', 
    'user:read:email', 
    'moderation:read', // To check if user is a mod
    'user:read:moderated_channels', // To get channels user moderates
    'channel:moderate', // For various mod actions like timeout
    'moderator:manage:banned_users', // For ban/unban
    'moderator:manage:chat_messages', // For deleting messages
    'moderator:read:chat_settings', // For reading chat settings
    'moderator:manage:chat_settings', // For chat modes (slow, followers, subs, emote, unique, non-mod delay)
    'user:manage:whispers', // For sending whispers (used for warnings and DMs)
    'moderator:read:chatters', // For fetching chatter list
    'channel:manage:polls', // For creating and managing polls
    'channel:manage:predictions', // For creating and managing predictions
].join(' ');

  const authUrl = new URL(TWITCH_AUTH_URL);
  authUrl.searchParams.append('client_id', TWITCH_CLIENT_ID);
  authUrl.searchParams.append('redirect_uri', REDIRECT_URI);
  authUrl.searchParams.append('response_type', 'code');
  authUrl.searchParams.append('scope', scopes);
  authUrl.searchParams.append('force_verify', 'true'); // Force re-prompting for consent to ensure new scopes are granted

  return NextResponse.redirect(authUrl.toString());
}