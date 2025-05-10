import type { LogEntry, AISummary, AIPreviewStill } from '@/types';

// Client-side log store (in-memory)
let mockLogs: LogEntry[] = [
  { id: 'log1', timestamp: new Date(), message: 'Application started.', level: 'info' },
];

export const addAppLog = (message: string, level: 'info' | 'warn' | 'error'): LogEntry => {
  const newLog: LogEntry = { id: `log${mockLogs.length + 1}`, timestamp: new Date(), message, level };
  mockLogs.push(newLog);
  if (mockLogs.length > 100) { // Keep last 100 logs
    mockLogs.shift();
  }
  return newLog;
};

export const getAppLogs = async (): Promise<LogEntry[]> => {
  // This remains a client-side accessible function, but data isn't persisted server-side.
  await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
  return [...mockLogs].sort((a,b) => b.timestamp.getTime() - a.timestamp.getTime());
};


// --- Stubbed AI Features ---
// These functions will now indicate that the feature is not fully implemented with live data.

export const getStreamSummary = async (streamId: string): Promise<AISummary> => {
  addAppLog(`Attempted to fetch AI summary for ${streamId}. Feature not fully implemented for live data.`, 'warn');
  // Simulating what might have been fetched, but the core functionality is a placeholder
  return {
    streamId,
    summaryText: "AI-powered summaries are not available for live data in this version. This is a placeholder.",
    keywords: ['placeholder', 'AI', 'feature'],
  };
};

export const getAIPreviewStills = async (streamId: string): Promise<AIPreviewStill[]> => {
  addAppLog(`Attempted to fetch AI previews for ${streamId}. Feature not fully implemented for live data.`, 'warn');
  return [
    {
      id: `still_${streamId}_placeholder`,
      timestamp: 0,
      imageUrl: 'https://picsum.photos/160/90?grayscale&blur=2', // Placeholder image
      reason: 'AI Previews not available for live data.',
    }
  ];
};

// --- Deprecated/Removed Mock User and Stream Data Functions ---
// The following functions are no longer needed as we'll use actual API calls:
// - fetchActiveStreams (replaced by /api/streams)
// - getIgnoredStreams (client-side state, not mock API)
// - ignoreStream (client-side state)
// - unignoreStream (client-side state)
// - updateStreamOrder (client-side state)
// - loginWithTwitch (replaced by /api/auth/twitch flow)
// - logoutTwitch (replaced by /api/logout)
// - getCurrentUser (replaced by /api/user)

addAppLog('Client-side logging initialized. Mock API for user/stream data removed.', 'info');
