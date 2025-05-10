
"use client";

import type { FC } from 'react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { FileText, Info, AlertTriangle, XCircle } from 'lucide-react';
import type { LogEntry } from '@/types';
import { formatDistanceToNow } from 'date-fns';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';

interface AppLogsProps {
  logs: LogEntry[];
  isLoading: boolean;
}

const LogIcon: FC<{ level: LogEntry['level'] }> = ({ level }) => {
  switch (level) {
    case 'info': return <Info className="h-4 w-4 text-blue-500" />;
    case 'warn': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
    case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    default: return <FileText className="h-4 w-4" />;
  }
};

export const AppLogs: FC<AppLogsProps> = ({ logs, isLoading }) => {
  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <FileText className="h-6 w-6 mr-2 text-primary" />
          Recent Logs
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 w-full rounded-md border p-2">
          {isLoading && logs.length === 0 && (
            <div className="space-y-3 p-2">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="flex items-center space-x-2">
                  <Skeleton className="h-4 w-4 rounded-full" />
                  <Skeleton className="h-4 w-16" />
                  <Skeleton className="h-4 w-full" />
                </div>
              ))}
            </div>
          )}
          {!isLoading && logs.length === 0 && (
            <div className="text-center text-muted-foreground py-10">No logs available.</div>
          )}
          {logs.map(log => (
            <div key={log.id} className="flex items-start gap-3 p-2 border-b border-border/50 last:border-b-0 hover:bg-muted/50 transition-colors text-sm">
              <LogIcon level={log.level} />
              <div className="flex-1">
                <div className="flex justify-between items-center mb-0.5">
                    <Badge variant={log.level === 'error' ? 'destructive' : log.level === 'warn' ? 'secondary' : 'outline'} className="capitalize text-xs px-1.5 py-0.5">{log.level}</Badge>
                    <span className="text-xs text-muted-foreground" title={log.timestamp.toLocaleString()}>
                    {formatDistanceToNow(log.timestamp, { addSuffix: true })}
                    </span>
                </div>
                <p className="text-foreground/90 leading-snug">{log.message}</p>
              </div>
            </div>
          ))}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};

