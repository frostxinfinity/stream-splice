
"use client";

import type { FC } from 'react';
import { StreamCard } from './StreamCard';
import type { Stream, AISummary, AIPreviewStill, User } from '@/types';
import { Skeleton } from '@/components/ui/skeleton'; 
import { AnimatePresence, Reorder } from 'framer-motion'; 
import type { Theme } from '@/components/twitch-eye/AppHeader';

interface StreamListProps {
  streams: Stream[];
  setStreams: React.Dispatch<React.SetStateAction<Stream[]>>; 
  streamQualities: Record<string, string>; 
  masterQuality: string; 
  availableQualities: Array<{ value: string; label: string }>;
  onQualityChange: (streamId: string, quality: string) => void; 
  onIgnoreStream: (streamId: string) => void;
  onGetSummary: (streamId: string) => Promise<AISummary>;
  onGetPreviews: (streamId: string) => Promise<AIPreviewStill[]>;
  onSelectChat: (streamId: string) => void;
  isLoading: boolean;
  headlessStates: Record<string, boolean>; 
  onToggleHeadless: (streamId: string) => void;
  masterHeadless: boolean; 
  masterMute: boolean;
  currentUser: User | null;
  parentDomain: string | null;
  currentTheme: Theme;
}

export const StreamList: FC<StreamListProps> = ({
  streams,
  setStreams,
  streamQualities,
  masterQuality,
  availableQualities,
  onQualityChange,
  onIgnoreStream,
  onGetSummary,
  onGetPreviews,
  onSelectChat,
  isLoading,
  headlessStates,
  onToggleHeadless,
  masterHeadless, 
  masterMute,
  currentUser,
  parentDomain,
  currentTheme,
}) => {
  if (isLoading && streams.length === 0) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4">
        {[...Array(6)].map((_, i) => (
          <CardSkeleton key={i} />
        ))}
      </div>
    );
  }

  if (!streams.length && !isLoading) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-center p-6 bg-card rounded-lg shadow-md">
        <p className="text-xl text-muted-foreground mb-2">No followed streams are live or being monitored.</p>
        <p className="text-sm text-muted-foreground">You might need to log in or refresh. If logged in, check your followed channels on Twitch.</p>
      </div>
    );
  }

  return (
    <Reorder.Group
      values={streams}
      onReorder={setStreams}
      className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 p-4"
    >
      <AnimatePresence>
        {streams.map((stream, index) => {
          const effectiveQuality = streamQualities[stream.id] || masterQuality;
          
          const individualHeadlessOverride = headlessStates[stream.id];
          let effectiveIsHeadless: boolean;
          if (typeof individualHeadlessOverride === 'boolean') {
            effectiveIsHeadless = individualHeadlessOverride; 
          } else {
            effectiveIsHeadless = masterHeadless; 
          }
          
          const streamForCard = { ...stream, isLive: stream.type === 'live' };

          return (
              <Reorder.Item
                key={stream.id} 
                value={stream} 
                dragListener={true} 
                layoutId={stream.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20, transition: { duration: 0.2 } }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
                className="w-full" 
              >
                <StreamCard
                  stream={streamForCard}
                  currentQuality={effectiveQuality}
                  availableQualities={availableQualities}
                  onQualityChange={onQualityChange}
                  onIgnoreStream={onIgnoreStream}
                  onGetSummary={onGetSummary}
                  onGetPreviews={onGetPreviews}
                  onSelectChat={onSelectChat}
                  isFirst={index === 0} 
                  isLast={index === streams.length - 1} 
                  isHeadless={effectiveIsHeadless}
                  onToggleHeadless={onToggleHeadless}
                  isMasterMuted={masterMute}
                  currentUser={currentUser}
                  parentDomain={parentDomain}
                  currentTheme={currentTheme}
                />
              </Reorder.Item>
          );
        })}
      </AnimatePresence>
    </Reorder.Group>
  );
};

const CardSkeleton: FC = () => (
  <div className="bg-card p-4 rounded-lg shadow-md">
    <Skeleton className="aspect-video bg-muted rounded-md mb-3" />
    <Skeleton className="h-5 bg-muted rounded w-3/4 mb-2" />
    <Skeleton className="h-4 bg-muted rounded w-1/2 mb-4" />
    <div className="grid grid-cols-2 gap-2 mb-3">
      <Skeleton className="h-9 bg-muted rounded w-full" />
      <Skeleton className="h-9 bg-muted rounded w-full" />
    </div>
    <div className="flex flex-wrap gap-2">
      <Skeleton className="h-8 bg-muted rounded w-24" />
      <Skeleton className="h-8 bg-muted rounded w-24" />
      <Skeleton className="h-8 bg-muted rounded w-24" />
    </div>
  </div>
);

