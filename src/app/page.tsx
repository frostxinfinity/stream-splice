
"use client";

import React, { useState, useEffect, useCallback } from 'react';
import type { Stream, LogEntry, AISummary, AIPreviewStill, User } from '@/types';
import { AppHeader, type Theme } from '@/components/twitch-eye/AppHeader';
import { StreamList } from '@/components/twitch-eye/StreamList';
import { SystemMonitor } from '@/components/twitch-eye/SystemMonitor';
import { AppLogs } from '@/components/twitch-eye/AppLogs';
import { Toaster } from '@/components/ui/toaster';
import { useToast } from '@/hooks/use-toast';
import * as AppLogService from '@/lib/mockApi';
import { availableQualities, refreshIntervalOptions } from '@/lib/constants';
import { getFormattedThumbnailUrl, cn } from '@/lib/utils';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { MessageSquare, Loader2 } from 'lucide-react';

interface IgnoredStreamInfo {
  id: string;
  userName: string;
}

const themes: Theme[] = ['light', 'dark', 'dark-red'];

export default function StreamSplicePage() {
  const [streams, setStreams] = useState<Stream[]>([]);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [ignoredStreams, setIgnoredStreams] = useState<IgnoredStreamInfo[]>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('ignoredStreams');
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (Array.isArray(parsed) && parsed.every(item => typeof item === 'object' && item !== null && 'id' in item && 'userName' in item)) {
            return parsed;
          }
        } catch (e) {
          console.error("Failed to parse ignoredStreams from localStorage", e);
        }
      }
    }
    return [];
  });
  const [isLoading, setIsLoading] = useState(true);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [selectedChatStreamId, setSelectedChatStreamId] = useState<string | null>(null);
  const [streamQualities, setStreamQualities] = useState<Record<string, string>>({});
  const [masterQuality, setMasterQuality] = useState<string>(() => {
    if (typeof window !== 'undefined') {
      const savedMasterQuality = localStorage.getItem('masterQuality');
      return savedMasterQuality ? savedMasterQuality : 'chunked';
    }
    return 'chunked';
  });
  const [headlessStates, setHeadlessStates] = useState<Record<string, boolean>>({});
  const [masterHeadless, setMasterHeadless] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem('masterHeadless');
        return saved ? JSON.parse(saved) : false;
    }
    return false;
  });
  const { toast } = useToast();

  const [refreshIntervalMinutes, setRefreshIntervalMinutes] = useState<number>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('refreshIntervalMinutes');
      return saved ? parseInt(saved, 10) : 30;
    }
    return 30;
  });

  const [masterMute, setMasterMute] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('masterMute');
      return saved ? JSON.parse(saved) : false;
    }
    return false;
  });

  const [lastStreamUpdateTime, setLastStreamUpdateTime] = useState<Date | null>(null);
  const [nextStreamUpdateTime, setNextStreamUpdateTime] = useState<Date | null>(null);

  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem('theme') as Theme;
      return themes.includes(savedTheme) ? savedTheme : 'dark-red'; 
    }
    return 'dark-red'; 
  });

  const [parentDomain, setParentDomain] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        setParentDomain(window.location.hostname);
    }
  }, []);

  const addLog = useCallback(async (message: string, level: LogEntry['level']) => {
    AppLogService.addAppLog(message, level);
  }, []);

  const fetchCurrentUser = useCallback(async () => {
    try {
      const response = await fetch('/api/user');
      if (response.ok) {
        const data = await response.json();
        setCurrentUser(data.user);
        if (data.user) {
            addLog(`User ${data.user.display_name} session active.`, 'info');
        }
      } else {
        setCurrentUser(null);
      }
    } catch (error) {
      console.error("Error fetching current user:", error);
      addLog('Failed to fetch current user state.', 'error');
      setCurrentUser(null);
    }
  }, [addLog]);

  const fetchStreams = useCallback(async () => {
    if (!currentUser) {
      setStreams([]);
      setIsLoading(false);
      return;
    }
    setIsLoading(true);
    try {
      const response = await fetch('/api/streams');
      if (response.ok) {
        const data = await response.json();
        const fetchedStreamsFromApi: Stream[] = data.streams || [];

        let processedStreams = fetchedStreamsFromApi
            .filter(stream => !ignoredStreams.some(ignored => ignored.id === stream.id))
            .map((stream) => ({
              ...stream,
              thumbnail_url: getFormattedThumbnailUrl(stream.thumbnail_url, 320, 180),
            }));

        const savedOrderJSON = typeof window !== 'undefined' ? localStorage.getItem('streamOrder') : null;
        const savedOrder: string[] | null = savedOrderJSON ? JSON.parse(savedOrderJSON) : null;

        if (savedOrder && Array.isArray(savedOrder)) {
            processedStreams.sort((a, b) => {
                const indexA = savedOrder.indexOf(a.id);
                const indexB = savedOrder.indexOf(b.id);
                if (indexA === -1 && indexB === -1) return 0;
                if (indexA === -1) return 1;
                if (indexB === -1) return -1;
                return indexA - indexB;
            });
        }

        processedStreams = processedStreams.map((stream, index) => ({
            ...stream,
            order: index + 1,
        }));

        addLog(`Displaying ${processedStreams.length} followed streams. Order applied from storage or API default.`, 'info');
        setStreams(processedStreams);
        setLastStreamUpdateTime(new Date());

      } else {
        const errorData = await response.json().catch(() => ({}));
        addLog(`Failed to fetch streams: ${errorData.error || response.statusText}`, 'error');
        toast({ title: "Error", description: `Could not fetch streams. ${errorData.error || ''}`, variant: "destructive" });
        setStreams([]);
      }
    } catch (error) {
      console.error("Error fetching streams:", error);
      addLog('Failed to fetch streams due to a network or parsing error.', 'error');
      toast({ title: "Error", description: "Could not fetch streams.", variant: "destructive" });
      setStreams([]);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser, addLog, toast, ignoredStreams]);

  const fetchLogs = useCallback(async () => {
    try {
      const appLogs = await AppLogService.getAppLogs();
      setLogs(appLogs.map(log => ({...log, id: log.id || crypto.randomUUID()})));
    } catch (error) {
      console.error("Error fetching logs:", error);
      toast({ title: "Error", description: "Could not fetch logs.", variant: "destructive" });
    }
  }, [toast]);

  const handleSetStreams = useCallback((newStreams: Stream[] | ((prevState: Stream[]) => Stream[])) => {
    setStreams(prevStreams => {
        const updatedStreams = typeof newStreams === 'function' ? newStreams(prevStreams) : newStreams;
        if (typeof window !== 'undefined' && updatedStreams.length > 0) {
            const streamOrderToSave = updatedStreams.map(s => s.id);
            localStorage.setItem('streamOrder', JSON.stringify(streamOrderToSave));
        }
        return updatedStreams;
    });
  }, []);

  useEffect(() => {
    fetchCurrentUser();
    fetchLogs();
  }, [fetchCurrentUser, fetchLogs]);

  useEffect(() => {
    if (lastStreamUpdateTime) {
      const nextUpdate = new Date(lastStreamUpdateTime.getTime() + refreshIntervalMinutes * 60 * 1000);
      setNextStreamUpdateTime(nextUpdate);
    }
  }, [lastStreamUpdateTime, refreshIntervalMinutes]);

  useEffect(() => {
    if (!currentUser) return;
    addLog(`Stream refresh interval set to ${refreshIntervalMinutes} minutes.`, 'info');
    const streamIntervalId = setInterval(() => {
      fetchStreams();
    }, refreshIntervalMinutes * 60 * 1000);
    return () => clearInterval(streamIntervalId);
  }, [currentUser, fetchStreams, refreshIntervalMinutes, addLog]);

  useEffect(() => {
    const logIntervalId = setInterval(() => {
      fetchLogs();
    }, 30000);
    return () => clearInterval(logIntervalId);
  }, [fetchLogs]);

  useEffect(() => {
    if (currentUser) {
      fetchStreams();
    } else {
      setStreams([]);
    }
  }, [currentUser, fetchStreams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('ignoredStreams', JSON.stringify(ignoredStreams));
    }
  }, [ignoredStreams]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('refreshIntervalMinutes', String(refreshIntervalMinutes));
    }
  }, [refreshIntervalMinutes]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('masterMute', JSON.stringify(masterMute));
    }
  }, [masterMute]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('masterQuality', masterQuality);
    }
  }, [masterQuality]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
        localStorage.setItem('masterHeadless', JSON.stringify(masterHeadless));
    }
  }, [masterHeadless]);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      document.documentElement.className = currentTheme;
      localStorage.setItem('theme', currentTheme);
      addLog(`Theme changed to ${currentTheme}.`, 'info');
    }
  }, [currentTheme, addLog]);


  const handleRefreshStreams = useCallback(() => {
    addLog('Manual stream refresh triggered.', 'info');
    if (currentUser) {
      fetchStreams();
    } else {
      toast({ title: "Login Required", description: "Please login to refresh streams.", variant: "default" });
    }
  }, [addLog, currentUser, fetchStreams, toast]);

  const handleLogin = () => {
    window.location.href = '/api/auth/twitch';
  };

  const handleLogout = async () => {
    try {
      await fetch('/api/logout', { method: 'POST' });
      const userDisplayName = currentUser?.display_name;
      setCurrentUser(null);
      setStreams([]);
      setSelectedChatStreamId(null);
      addLog(`User ${userDisplayName || 'user'} logged out.`, 'info');
      toast({ title: "Logout Successful", description: `Goodbye, ${userDisplayName || 'user'}!` });
    } catch (error) {
      addLog('Logout failed.', 'error');
      toast({ title: "Logout Error", description: "Could not log out.", variant: "destructive" });
    }
  };

  const handleIndividualQualityChange = useCallback((streamId: string, quality: string) => {
    setStreamQualities(prev => ({ ...prev, [streamId]: quality }));
    const stream = streams.find(s => s.id === streamId);
    addLog(`Quality for stream ${stream?.user_name || streamId} set to ${quality}.`, 'info');
    toast({ title: "Quality Changed", description: `Stream ${stream?.user_name || streamId} quality set to ${quality}.` });
  }, [streams, addLog, toast]);

  const handleMasterQualityChange = useCallback((quality: string) => {
    setMasterQuality(quality);
    setStreamQualities({});
    addLog(`Master quality set to ${quality}. All streams will use this. Individual overrides cleared.`, 'info');
    toast({ title: "Master Quality Changed", description: `Master quality set to ${quality}. Individual overrides cleared.` });
  }, [addLog, toast]);

  const handleSelectChat = useCallback((streamId: string) => {
    setSelectedChatStreamId(streamId);
    const stream = streams.find(s => s.id === streamId);
    addLog(`Displaying chat for ${stream?.user_name || streamId}.`, 'info');
  }, [streams, addLog]);

  const handleIgnoreStream = useCallback(async (streamId: string) => {
    const streamToIgnore = streams.find(s => s.id === streamId);
    if (!streamToIgnore) return;

    setIgnoredStreams(prev => [...prev, { id: streamId, userName: streamToIgnore.user_name }]);
    toast({ title: "Stream Ignored", description: `Stream ${streamToIgnore.user_name} will no longer be shown.` });
    handleSetStreams(prevStreams => prevStreams.filter(s => s.id !== streamId));
    if (selectedChatStreamId === streamId) {
      setSelectedChatStreamId(null);
    }
    addLog(`Stream ${streamToIgnore.user_name} ignored.`, 'info');
  }, [streams, selectedChatStreamId, addLog, toast, handleSetStreams]);

  const handleUnignoreStream = useCallback(async (streamIdToUnignore: string) => {
    const unignoredStreamInfo = ignoredStreams.find(s => s.id === streamIdToUnignore);
    setIgnoredStreams(prev => prev.filter(ignored => ignored.id !== streamIdToUnignore));
    toast({ title: "Stream Unignored", description: `Stream ${unignoredStreamInfo?.userName || streamIdToUnignore} will now be shown.` });
    if (currentUser) fetchStreams();
    addLog(`Stream ${unignoredStreamInfo?.userName || streamIdToUnignore} unignored.`, 'info');
  }, [currentUser, ignoredStreams, addLog, toast, fetchStreams]);

  const handleGetSummary = useCallback(async (streamId: string): Promise<AISummary> => {
    addLog(`Fetching AI summary for stream ${streamId}.`, 'info');
    toast({ title: "AI Feature", description: "AI Summaries are not implemented with live data in this version.", variant: "default" });
    return AppLogService.getStreamSummary(streamId);
  }, [addLog, toast]);

  const handleGetPreviews = useCallback(async (streamId: string): Promise<AIPreviewStill[]> => {
    addLog(`Fetching AI previews for stream ${streamId}.`, 'info');
    toast({ title: "AI Feature", description: "AI Previews are not implemented with live data in this version.", variant: "default" });
    return AppLogService.getAIPreviewStills(streamId);
  }, [addLog, toast]);

  const handleToggleHeadless = useCallback((streamId: string) => {
    setHeadlessStates(prev => {
      const currentVal = prev[streamId];
      const newVal = currentVal === undefined ? true : !currentVal;

      const newState = { ...prev, [streamId]: newVal };
      const stream = streams.find(s => s.id === streamId);
      addLog(`Stream ${stream?.user_name || streamId} individual headless mode set to ${newVal}.`, 'info');
      toast({
        title: `Individual Mode Changed`,
        description: `Stream ${stream?.user_name || streamId} is now ${newVal ? 'headless (individual)' : 'video (individual)'}.`,
      });
      return newState;
    });
  }, [streams, addLog, toast]);

  const handleToggleMasterHeadless = useCallback(() => {
    setMasterHeadless(prev => {
        const newMasterHeadlessState = !prev;
        addLog(`Master headless mode ${newMasterHeadlessState ? 'enabled' : 'disabled'}.`, 'info');
        toast({
        title: "Master Headless Mode",
        description: `All streams will now be ${newMasterHeadlessState ? 'headless' : 'video'} (unless individually set).`,
        });
        return newMasterHeadlessState;
    });
  }, [addLog, toast]);

  const handleRefreshIntervalChange = useCallback((interval: number) => {
    setRefreshIntervalMinutes(interval);
    addLog(`Stream refresh interval changed to ${interval} minutes.`, 'info');
    toast({ title: "Refresh Interval Updated", description: `Streams will now refresh every ${interval} minutes.` });
  }, [addLog, toast]);

  const handleToggleMasterMute = useCallback(() => {
    setMasterMute(prev => {
      const newMuteState = !prev;
      addLog(`Master mute ${newMuteState ? 'enabled' : 'disabled'}.`, 'info');
      toast({ title: "Master Mute Changed", description: `All streams are now ${newMuteState ? 'muted' : 'unmuted'}.` });
      return newMuteState;
    });
  }, [addLog, toast]);

  const handleThemeChange = useCallback((newTheme: Theme) => {
    setCurrentTheme(newTheme);
  }, []);

  const cycleTheme = useCallback(() => {
    setCurrentTheme(prevTheme => {
      const currentIndex = themes.indexOf(prevTheme);
      const nextIndex = (currentIndex + 1) % themes.length;
      return themes[nextIndex];
    });
  }, []);

  const handleClearAllSettings = useCallback(() => {
    addLog('User initiated clearing all settings and customizations.', 'warn');
    if (typeof window !== 'undefined') {
      localStorage.removeItem('ignoredStreams');
      localStorage.removeItem('streamOrder');
      localStorage.removeItem('masterQuality');
      localStorage.removeItem('masterHeadless');
      localStorage.removeItem('refreshIntervalMinutes');
      localStorage.removeItem('masterMute');
      localStorage.removeItem('theme');
      localStorage.removeItem('streamQualities');
      localStorage.removeItem('headlessStates');
      toast({
        title: "Settings Cleared",
        description: "All your customizations have been reset. The page will now reload to apply default settings.",
        duration: 3000,
      });
      setTimeout(() => {
        window.location.reload();
      }, 1500); 
    }
  }, [addLog, toast]);


  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (document.activeElement && ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName)) {
        return;
      }
      if (!currentUser) return;

      switch (event.key.toUpperCase()) {
        case 'R':
          event.preventDefault();
          handleRefreshStreams();
          break;
        case 'M':
          event.preventDefault();
          handleToggleMasterMute();
          break;
        case 'H':
          event.preventDefault();
          handleToggleMasterHeadless();
          break;
        case 'T':
          event.preventDefault();
          cycleTheme();
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [currentUser, handleRefreshStreams, handleToggleMasterMute, handleToggleMasterHeadless, cycleTheme]);


  const liveStreams = streams.filter(stream => stream.type === 'live');
  const selectedLiveStreamForChat = liveStreams.find(s => s.id === selectedChatStreamId);


  return (
    <div className="min-h-screen flex flex-col bg-background text-foreground">
      <AppHeader
        currentUser={currentUser}
        onLogin={handleLogin}
        onLogout={handleLogout}
        onRefreshStreams={handleRefreshStreams}
        ignoredStreams={ignoredStreams}
        onUnignoreStream={handleUnignoreStream}
        isLoading={isLoading && !!currentUser}
        masterQuality={masterQuality}
        availableQualities={availableQualities}
        onMasterQualityChange={handleMasterQualityChange}
        masterHeadless={masterHeadless}
        onToggleMasterHeadless={handleToggleMasterHeadless}
        refreshIntervalMinutes={refreshIntervalMinutes}
        refreshIntervalOptions={refreshIntervalOptions}
        onRefreshIntervalChange={handleRefreshIntervalChange}
        masterMute={masterMute}
        onToggleMasterMute={handleToggleMasterMute}
        currentTheme={currentTheme}
        onThemeChange={handleThemeChange}
        onClearAllSettings={handleClearAllSettings}
      />
      <main className="flex-grow container mx-auto py-6 px-4">
        {!currentUser && !isLoading && (
            <div className="flex flex-col items-center justify-center h-64 text-center p-8 bg-card rounded-lg shadow-lg">
                <h2 className="text-2xl font-semibold mb-4 text-primary">Welcome to Stream Splice!</h2>
                <p className="text-lg text-muted-foreground mb-6">Please log in with your Twitch account to see your followed streams.</p>
                <Button onClick={handleLogin} size="lg">Login with Twitch</Button>
            </div>
        )}
        {currentUser && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StreamList
                streams={streams}
                setStreams={handleSetStreams}
                streamQualities={streamQualities}
                masterQuality={masterQuality}
                availableQualities={availableQualities}
                onQualityChange={handleIndividualQualityChange}
                onIgnoreStream={handleIgnoreStream}
                onGetSummary={handleGetSummary}
                onGetPreviews={handleGetPreviews}
                onSelectChat={handleSelectChat}
                isLoading={isLoading}
                headlessStates={headlessStates}
                onToggleHeadless={handleToggleHeadless}
                masterHeadless={masterHeadless}
                masterMute={masterMute}
                currentUser={currentUser}
                parentDomain={parentDomain}
                currentTheme={currentTheme}
              />
            </div>
            <div className="lg:col-span-1 space-y-6">
              <div className="relative" style={{ minHeight: '500px' }}>
                {parentDomain && liveStreams.length > 0 && liveStreams.map(stream => (
                  <div
                    key={`chat-container-${stream.id}`}
                    className={cn(
                      "absolute top-0 left-0 w-full h-full transition-opacity duration-300 ease-in-out",
                      selectedChatStreamId === stream.id ? "opacity-100 z-10" : "opacity-0 z-1 pointer-events-none"
                    )}
                  >
                    <Card className="shadow-md h-full flex flex-col">
                      <CardHeader>
                        <CardTitle className="flex items-center text-xl">
                          <MessageSquare className="h-6 w-6 mr-2 text-primary" />
                          Chat: {stream.user_name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="flex-grow p-0 overflow-hidden">
                        <iframe
                          key={`chat-main-${stream.id}-${parentDomain}`} // Re-key to force re-render if parentDomain changes
                          src={`https://www.twitch.tv/embed/${stream.user_login}/chat?parent=${parentDomain}&darkpopout`}
                          width="100%"
                          height="100%"
                          frameBorder="0"
                          scrolling="yes"
                          title={`Twitch Chat - ${stream.user_login}`}
                          className="w-full h-full min-h-[400px]"
                          // allow="autoplay; fullscreen"
                        />
                      </CardContent>
                    </Card>
                  </div>
                ))}

                {/* Placeholder card - shown if no chat is active or ready */}
                 {((!parentDomain && liveStreams.length > 0) || (parentDomain && !selectedLiveStreamForChat && liveStreams.length > 0) || (liveStreams.length === 0)) && (
                  <Card className="shadow-md h-full flex flex-col absolute inset-0 z-5">
                    <CardHeader><CardTitle className="flex items-center text-xl"><MessageSquare className="h-6 w-6 mr-2 text-primary" /> Twitch Chat</CardTitle></CardHeader>
                    <CardContent className="flex-grow flex items-center justify-center">
                      {!parentDomain && liveStreams.length > 0 && selectedChatStreamId ? (
                        <>
                          <Loader2 className="h-8 w-8 animate-spin text-primary mr-2" />
                          <p className="text-muted-foreground">Initializing chat...</p>
                        </>
                      ) : parentDomain && liveStreams.length > 0 && !selectedLiveStreamForChat ? (
                        <p className="text-muted-foreground">Select a stream to view chat.</p>
                      ) : (
                        <p className="text-muted-foreground">No active streams to display chat for.</p>
                      )}
                    </CardContent>
                  </Card>
                )}
              </div>
              <SystemMonitor
                activeStreamCount={streams.length}
                lastStreamUpdateTime={lastStreamUpdateTime}
                nextStreamUpdateTime={nextStreamUpdateTime}
              />
              <AppLogs logs={logs} isLoading={logs.length === 0 && isLoading} />
            </div>
          </div>
        )}
      </main>
      <footer className="border-t border-border text-center p-4 text-sm text-muted-foreground">
        Stream Splice &copy; {new Date().getFullYear()} | Alpha Version 0.7 | Hotkeys: (R)efresh, (M)ute, (H)eadless, (T)heme Cycle
      </footer>
      <Toaster />
    </div>
  );
}

