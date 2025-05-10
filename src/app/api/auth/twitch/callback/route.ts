// src/app/api/auth/twitch/callback/route.ts
import { type NextRequest, NextResponse } from 'next/server';
import { exchangeCodeForToken, getTwitchUser } from '@/lib/twitchApi';
import { createSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const error = searchParams.get('error');
  const errorDescription = searchParams.get('error_description');

  const appBaseUrl = process.env.NEXT_PUBLIC_APP_BASE_URL;
  if (!appBaseUrl) {
    console.error("NEXT_PUBLIC_APP_BASE_URL is not set in environment variables.");
    return NextResponse.redirect(`${request.nextUrl.origin}/?error=${encodeURIComponent('Application configuration error: Missing base URL.')}`);
  }
  
  const redirectUriForLog = `${appBaseUrl}/api/auth/twitch/callback`;
  console.log("Callback received. Expected REDIRECT_URI for Twitch app registration:", redirectUriForLog);


  if (error) {
    console.error(`Twitch OAuth Error: ${error} - ${errorDescription}`);
    if (error === 'redirect_mismatch') {
        const detailedError = `Twitch OAuth Error: ${error} - ${errorDescription}. Please ensure your Twitch Application's OAuth Redirect URI is set to: ${redirectUriForLog}`;
        return NextResponse.redirect(`${appBaseUrl}/?error=${encodeURIComponent(detailedError)}`);
    }
    return NextResponse.redirect(`${appBaseUrl}/?error=${encodeURIComponent(errorDescription || 'Twitch login failed')}`);
  }

  if (!code) {
    return NextResponse.json({ error: 'Authorization code missing' }, { status: 400 });
  }

  if (!process.env.AUTH_SECRET) {
    console.error('AUTH_SECRET is not set. Session cannot be created.');
    return NextResponse.redirect(`${appBaseUrl}/?error=${encodeURIComponent('Server configuration error: Cannot create session.')}`);
  }

  try {
    const tokenResponse = await exchangeCodeForToken(code);
    const twitchUser = await getTwitchUser(tokenResponse.access_token);

    if (!twitchUser) {
      throw new Error('Failed to fetch user details from Twitch.');
    }

    await createSession(twitchUser.id, tokenResponse.access_token);
    
    // Redirect to the main page after successful login
    return NextResponse.redirect(appBaseUrl);
  } catch (err: any) {
    console.error('Callback handling error:', err);
    // Check if error message already contains the redirect URI info to avoid duplication
    const errorMessage = (err.message || 'Login process failed').includes(redirectUriForLog) 
        ? err.message 
        : `${err.message || 'Login process failed'}. Ensure Twitch App Redirect URI is: ${redirectUriForLog}`;
    return NextResponse.redirect(`${appBaseUrl}/?error=${encodeURIComponent(errorMessage)}`);
  }
}
