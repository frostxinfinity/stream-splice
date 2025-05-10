
"use client";

import React, { type FC, useState, useEffect } from 'react'; // Import React
import Image from 'next/image';
import {
  Users,
  AlertCircle,
  GripVertical,
  MessageSquareQuote,
  Film,
  Settings, 
  MessageSquare as ChatIcon,
  Video,
  VideoOff,
  PlayCircle,
  XCircle,
  Maximize,
  X, 
  ShieldBan,
  Clock,
  Trash2,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Stream, AISummary, AIPreviewStill, User } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogTrigger, DialogClose } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TwitchPlayer } from './TwitchPlayer';
import { ChatDisplay } from './ChatDisplay';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast'; 
import { getFormattedThumbnailUrl } from '@/lib/utils'; 
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';


interface StreamCardProps {
  stream: Stream;
  currentQuality: string;
  availableQualities: Array<{ value: string; label: string }>;
  onQualityChange: (streamId: string, quality: string) => void;
  onIgnoreStream: (streamId: string) => void;
  onGetSummary: (streamId: string) => Promise<AISummary>; 
  onGetPreviews: (streamId: string) => Promise<AIPreviewStill[]>; 
  onSelectChat: (streamId: string) => void;
  isFirst?: boolean;
  isLast?: boolean;
  isHeadless: boolean;
  onToggleHeadless: (streamId: string) => void;
  isMasterMuted: boolean;
  currentUser: User | null;
}

const StatusIndicator: FC<{ isLive: boolean; userName: string }> = ({ isLive, userName }) => {
  if (!isLive) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-2 p-2 rounded-md bg-card text-muted-foreground">
        <XCircle className="h-10 w-10" />
        <span className="text-sm font-medium">{userName} - Offline</span>
      </div>
    );
  }

  return (
    <motion.div 
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="flex flex-col items-center justify-center h-full gap-2 p-2 rounded-md bg-green-500/10 text-green-500">
      <PlayCircle className="h-10 w-10" />
      <span className="text-sm font-medium">{userName} - Live</span>
    </motion.div>
  );
};


export const StreamCard: FC<StreamCardProps> = React.memo(({
  stream,
  currentQuality,
  availableQualities,
  onQualityChange,
  onIgnoreStream,
  onGetSummary,
  onGetPreviews,
  onSelectChat,
  isFirst,
  isLast,
  isHeadless,
  onToggleHeadless,
  isMasterMuted,
  currentUser,
}) => {
  const { toast } = useToast(); 
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [previews, setPreviews] = useState<AIPreviewStill[] | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [isEnlargeModalOpen, setIsEnlargeModalOpen] = useState(false);
  
  const formattedThumbnailUrl = getFormattedThumbnailUrl(stream.thumbnail_url, 320, 180);

  const handleGetSummaryClick = async () => {
    setIsLoadingSummary(true);
    toast({ title: "AI Feature", description: "AI Summaries are not fully implemented with live data yet.", variant: "default" });
    const result = await onGetSummary(stream.id); 
    setSummary(result); 
    setIsLoadingSummary(false);
  };

  const handleGetPreviewsClick = async () => {
    setIsLoadingPreviews(true);
    toast({ title: "AI Feature", description: "AI Previews are not fully implemented with live data yet.", variant: "default" });
    const result = await onGetPreviews(stream.id); 
    setPreviews(result); 
    setIsLoadingPreviews(false);
  };

  useEffect(() => {
    if (stream.type === 'live' && !isHeadless && (isEnlargeModalOpen || document.visibilityState === 'visible')) {
      const playerIframeId = isEnlargeModalOpen 
        ? `twitch-player-enlarged-${stream.user_login}` 
        : `twitch-player-${stream.user_login}`;
      const playerIframe = document.getElementById(playerIframeId) as HTMLIFrameElement;
      
      if (playerIframe) {
         setTimeout(() => {
            if (playerIframe.contentWindow) {
                 // Attempt to interact with the player to click "Start Watching"
                // This is a best-effort approach and might be blocked by browser security or Twitch's iframe policies
                try {
                  const startWatchingButton = playerIframe.contentWindow?.document.querySelector('button[data-a-target="player-overlay-mature-accept"]');
                  if (startWatchingButton) {
                    (startWatchingButton as HTMLElement).click();
                    console.log(`Attempted to click "Start Watching" for ${stream.user_login}`);
                  }
                } catch (error) {
                  console.warn(`Could not interact with player iframe for ${stream.user_login} due to:`, error);
                }
            }
        }, 3000); // Increased delay to allow iframe to fully load
      }
    }
  }, [stream.type, stream.user_login, isHeadless, isEnlargeModalOpen, currentQuality]);


  const isCurrentUserBroadcaster = currentUser?.id === stream.user_id;

  return (
    <Card className="w-full overflow-hidden shadow-lg hover:shadow-primary/30 transition-shadow duration-300 flex flex-col group">
      <CardHeader className="p-4 relative">
        <AnimatePresence mode="wait">
          {isHeadless ? (
            <motion.div
              key="status-indicator"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
              className="aspect-video bg-card flex items-center justify-center rounded-md border border-border"
            >
              <StatusIndicator isLive={stream.type === 'live'} userName={stream.user_name} />
            </motion.div>
          ) : (
            <motion.div
              key="twitch-player"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{ duration: 0.2 }}
            >
              <TwitchPlayer 
                channelName={stream.user_login} 
                quality={currentQuality} 
                isMasterMuted={isMasterMuted} 
                playerId={`twitch-player-${stream.user_login}`}
              />
            </motion.div>
          )}
        </AnimatePresence>
        
        <div className="absolute top-2 right-2 z-10 flex flex-col space-y-1">
           {!isHeadless && stream.type === 'live' && (
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                    <Button
                        variant="outline"
                        size="icon"
                        className="h-7 w-7 bg-background/70 hover:bg-background/90"
                        onClick={() => setIsEnlargeModalOpen(true)}
                        aria-label="Enlarge Player"
                    >
                        <Maximize className="h-4 w-4" />
                    </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Enlarge player &amp; chat.</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          )}
        </div>
         <Badge variant={stream.type === 'live' ? "destructive" : "secondary"} className="absolute top-2 left-2 z-10">
            {stream.type === 'live' ? "LIVE" : "OFFLINE"}
        </Badge>
        {stream.type === 'live' && (
            <Badge variant="secondary" className="absolute bottom-2 right-2 z-10 bg-black/50 text-white">
                <Users className="h-3 w-3 mr-1" /> {stream.viewer_count.toLocaleString()}
            </Badge>
        )}
        
        <Image src={formattedThumbnailUrl} alt={stream.title} width={320} height={180} className="hidden" data-ai-hint="gameplay stream" priority={Boolean(isFirst)}/>

      </CardHeader>
      
      <CardContent className="p-4 flex-grow">
        <CardTitle className="text-lg leading-tight truncate mb-1">{stream.title}</CardTitle>
        <p className="text-sm text-muted-foreground truncate">{stream.user_name} playing <span className="font-semibold text-accent">{stream.game_name}</span></p>
        
        <div className="mt-3 grid grid-cols-2 gap-2">
            <Select value={currentQuality} onValueChange={(value) => onQualityChange(stream.id, value)} disabled={isHeadless && stream.type === 'live'}>
                <SelectTrigger className="w-full h-9 text-xs" aria-label="Select stream quality">
                    <Settings className="h-3 w-3 mr-1.5" /> <SelectValue placeholder="Select quality" />
                </SelectTrigger>
                <SelectContent>
                    {availableQualities.map(q => (
                        <SelectItem key={q.value} value={q.value} className="text-xs">{q.label}</SelectItem>
                    ))}
                </SelectContent>
            </Select>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button 
                    variant="outline" 
                    size="sm" 
                    className="w-full h-9 text-xs" 
                    onClick={() => onToggleHeadless(stream.id)}
                    disabled={stream.type !== 'live'}
                    aria-label={isHeadless ? "Switch to video mode" : "Switch to headless mode"}
                  >
                    {isHeadless ? <Video className="h-4 w-4 mr-1.5" /> : <VideoOff className="h-4 w-4 mr-1.5" />}
                    {isHeadless ? 'Show Video' : 'Go Headless'}
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{isHeadless ? 'Switch to video player mode.' : 'Switch to headless (status only) mode.'}</p>
                  {stream.type !== 'live' && <p className="text-xs text-muted-foreground">(Disabled for offline streams)</p>}
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
        </div>
      </CardContent>

      <CardFooter className="p-4 flex flex-col sm:flex-row justify-between items-center gap-2 border-t">
        <div className="flex gap-2 flex-wrap">
          <Button variant="outline" size="sm" onClick={() => onSelectChat(stream.id)}>
            <ChatIcon className="h-4 w-4 mr-2" /> Show Chat
          </Button>
          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={summary ? undefined : handleGetSummaryClick} disabled={isLoadingSummary || stream.type !== 'live'}>
                <MessageSquareQuote className="h-4 w-4 mr-2" />
                {isLoadingSummary ? 'Loading...' : (summary ? 'View Summary' : 'AI Summary')}
              </Button>
            </DialogTrigger>
            {summary && (
              <DialogContent className="sm:max-w-[525px]">
                <DialogHeader>
                  <DialogTitle>AI Summary: {stream.user_name}</DialogTitle>
                  <DialogDescription>Generated summary of the current stream content.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[200px] w-full rounded-md border p-4 text-sm">
                  <p className="mb-2">{summary.summaryText}</p>
                  <Separator className="my-2" />
                  <p className="font-semibold">Keywords:</p>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {summary.keywords.map(kw => <Badge key={kw} variant="secondary">{kw}</Badge>)}
                  </div>
                </ScrollArea>
              </DialogContent>
            )}
          </Dialog>

          <Dialog>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" onClick={previews ? undefined : handleGetPreviewsClick} disabled={isLoadingPreviews || stream.type !== 'live'}>
                <Film className="h-4 w-4 mr-2" />
                {isLoadingPreviews ? 'Loading...' : (previews ? 'View Previews' : 'AI Previews')}
              </Button>
            </DialogTrigger>
             {previews && (
              <DialogContent className="sm:max-w-[625px]">
                <DialogHeader>
                  <DialogTitle>AI Previews: {stream.user_name}</DialogTitle>
                   <DialogDescription>Interesting moments captured from the stream.</DialogDescription>
                </DialogHeader>
                <ScrollArea className="h-[300px] w-full">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 p-1">
                  {previews.map(p => (
                    <div key={p.id} className="border rounded-md p-2">
                      <Image src={p.imageUrl} alt={`Preview at ${p.timestamp}s`} width={160} height={90} className="rounded w-full aspect-video object-cover mb-2" data-ai-hint="gameplay highlight"/>
                      <p className="text-xs text-muted-foreground">Time: {new Date(p.timestamp * 1000).toISOString().substr(11, 8)}</p>
                      <p className="text-xs">{p.reason}</p>
                    </div>
                  ))}
                </div>
                </ScrollArea>
              </DialogContent>
            )}
          </Dialog>
        </div>
        <Button variant="ghost" size="sm" onClick={() => onIgnoreStream(stream.id)} className="text-muted-foreground hover:text-destructive">
          <AlertCircle className="h-4 w-4 mr-2" />
          Ignore
        </Button>
      </CardFooter>
       <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-50 transition-opacity cursor-grab group-data-[headless=true]:cursor-default" title="Drag to re-order stream">
          <GripVertical className="h-6 w-6" />
        </div>

      <Dialog open={isEnlargeModalOpen} onOpenChange={setIsEnlargeModalOpen}>
        <DialogContent className="w-[95vw] max-w-[1800px] h-[90vh] p-2 bg-background border flex flex-col sm:flex-row gap-2">
          <div className="sm:w-[70%] h-full flex flex-col">
            <DialogHeader className="flex-shrink-0 p-2 border-b flex flex-row justify-between items-center">
                <DialogTitle className="text-lg truncate">
                    {stream.user_name} - {stream.title}
                </DialogTitle>
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" aria-label="Close enlarged player">
                        <X className="h-5 w-5" />
                    </Button>
                </DialogClose>
            </DialogHeader>
            <div className="flex-grow relative bg-black">
                 {isEnlargeModalOpen && ( 
                    <TwitchPlayer
                        channelName={stream.user_login}
                        quality={currentQuality} 
                        isMasterMuted={isMasterMuted}
                        playerId={`twitch-player-enlarged-${stream.user_login}`}
                    />
                )}
            </div>
            {isCurrentUserBroadcaster && stream.type === 'live' && isEnlargeModalOpen && (
              <div className="p-3 border-t bg-card">
                <h3 className="text-md font-semibold mb-2 text-card-foreground">Moderation Tools</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
                  <Input 
                    placeholder="Username to moderate" 
                    className="sm:col-span-2 lg:col-span-1" 
                    aria-label="Username for moderation action"
                    data-ai-hint="username input" 
                  />
                  <Button variant="outline" size="sm" data-ai-hint="timeout button">
                    <Clock className="h-4 w-4 mr-2" /> Timeout User
                  </Button>
                  <Button variant="destructive" size="sm" data-ai-hint="ban button">
                    <ShieldBan className="h-4 w-4 mr-2" /> Ban User
                  </Button>
                   <Button variant="secondary" size="sm" data-ai-hint="clear chat button">
                    <Trash2 className="h-4 w-4 mr-2" /> Clear Chat
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  Note: Full moderation functionality requires additional API integration and permissions. These are placeholder controls.
                </p>
              </div>
            )}
          </div>
          <div className="sm:w-[30%] h-full flex flex-col">
            {isEnlargeModalOpen && stream.type === 'live' && (
              <ChatDisplay channelName={stream.user_login} />
            )}
            {stream.type !== 'live' && (
                <div className="flex-grow flex items-center justify-center bg-card rounded-md">
                    <p className="text-muted-foreground">Chat is unavailable for offline streams.</p>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </Card>
  );
});

StreamCard.displayName = 'StreamCard';
