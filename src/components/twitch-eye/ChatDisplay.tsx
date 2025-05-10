"use client";

import type { FC } from 'react';
import { useEffect, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Loader2 } from 'lucide-react'; // Added Loader2

interface ChatDisplayProps {
  channelName?: string | null;
}

export const ChatDisplay: FC<ChatDisplayProps> = ({ channelName }) => {
  const [parentDomain, setParentDomain] = useState<string | null>(null);
  const [iframeKey, setIframeKey] = useState<string>(Date.now().toString());

  useEffect(() => {
    // This ensures parentDomain is set only on the client side after mount
    // and only if it hasn't been set yet or needs to be re-validated.
    if (typeof window !== 'undefined') {
        setParentDomain(window.location.hostname);
    }
  }, []);

  useEffect(() => {
    // When channelName or parentDomain validly changes, update the iframe key to force re-render/reload
    if (channelName && parentDomain) {
      setIframeKey(`${channelName}-${parentDomain}-${Date.now()}`);
    } else if (!channelName) {
      // If channelName becomes null (no chat selected), reset key or handle as needed
      setIframeKey(Date.now().toString());
    }
  }, [channelName, parentDomain]);


  if (!channelName) {
    return (
      <Card className="shadow-md h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MessageSquare className="h-6 w-6 mr-2 text-primary" />
            Twitch Chat
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <p className="text-muted-foreground">Select a stream to view chat.</p>
        </CardContent>
      </Card>
    );
  }

  if (!parentDomain) {
    // Render a loading state until parentDomain is determined client-side
    return (
      <Card className="shadow-md h-full flex flex-col">
        <CardHeader>
          <CardTitle className="flex items-center text-xl">
            <MessageSquare className="h-6 w-6 mr-2 text-primary" />
            Chat: {channelName}
          </CardTitle>
        </CardHeader>
        <CardContent className="flex-grow flex items-center justify-center">
          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
          <p className="text-muted-foreground">Initializing chat...</p>
        </CardContent>
      </Card>
    );
  }

  const src = `https://www.twitch.tv/embed/${channelName}/chat?parent=${parentDomain}&darkpopout`;

  return (
    <Card className="shadow-md h-full flex flex-col">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <MessageSquare className="h-6 w-6 mr-2 text-primary" />
          Chat: {channelName}
        </CardTitle>
      </CardHeader>
      <CardContent className="flex-grow p-0 overflow-hidden">
        <iframe
          key={iframeKey} // Force re-render if key changes, ensuring new src or params take effect
          src={src}
          width="100%"
          height="100%"
          frameBorder="0"
          scrolling="yes"
          title={`Twitch Chat - ${channelName}`}
          className="w-full h-full min-h-[400px]" // Ensure a minimum height for usability
        ></iframe>
      </CardContent>
    </Card>
  );
};
