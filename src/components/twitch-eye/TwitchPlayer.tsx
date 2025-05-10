
"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';

interface TwitchPlayerProps {
  channelName: string;
  quality?: string; 
  width?: string | number;
  height?: string | number;
  isMasterMuted?: boolean;
  playerId: string; 
  parentDomain: string | null;
}

export const TwitchPlayer: FC<TwitchPlayerProps> = ({
  channelName,
  quality = 'chunked', 
  width = '100%',
  height = '100%',
  isMasterMuted = false,
  playerId,
  parentDomain,
}) => {

  if (!channelName || !parentDomain) return (
    <div className="aspect-video bg-black rounded-md overflow-hidden flex items-center justify-center">
      <p className="text-muted-foreground text-sm">Player loading...</p>
    </div>
  );

  const mutedState = isMasterMuted ? 'true' : 'false';
  // Ensure parentDomain is used directly from props
  const src = `https://player.twitch.tv/?channel=${channelName}&parent=${parentDomain}&quality=${quality}&muted=${mutedState}&autoplay=true`;
  
  const iframeKey = `${playerId}-${channelName}-${quality}-${mutedState}-${parentDomain}`;

  return (
    <div className="aspect-video bg-black rounded-md overflow-hidden">
      <iframe
        id={playerId}
        key={iframeKey} 
        src={src}
        width={width}
        height={height}
        allowFullScreen={true}
        scrolling="no"
        frameBorder="0"
        allow="autoplay; fullscreen"
        title={`Twitch Player - ${channelName}`}
        className="w-full h-full"
      ></iframe>
    </div>
  );
};
