// src/app/api/logout/route.ts
import { NextResponse } from 'next/server';
import { deleteSession } from '@/lib/session';

export async function POST() {
  await deleteSession();
  // Optionally, you can also revoke the Twitch token here if desired:
  // https://dev.twitch.tv/docs/authentication/revoke-tokens/
  // This requires storing the access token and making a POST request to Twitch.
  // For simplicity, this example just clears the local session.
  return NextResponse.json({ success: true });
}
