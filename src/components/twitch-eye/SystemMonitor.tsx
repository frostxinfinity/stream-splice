
"use client";

import type { FC } from 'react';
import { BarChart, Server, Clock, RefreshCw } from 'lucide-react'; 
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useEffect, useState } from 'react';

interface SystemMonitorProps {
  activeStreamCount: number;
  lastStreamUpdateTime: Date | null;
  nextStreamUpdateTime: Date | null;
}

export const SystemMonitor: FC<SystemMonitorProps> = ({ activeStreamCount, lastStreamUpdateTime, nextStreamUpdateTime }) => {
  const [, setCurrentTime] = useState(new Date()); 

  useEffect(() => {
    const timeInterval = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000 * 30); 

    return () => {
      clearInterval(timeInterval);
    };
  }, []);

  const formatTime = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });
  };
  
  const formatDate = (date: Date | null) => {
    if (!date) return 'N/A';
    return date.toLocaleDateString([], { year: 'numeric', month: 'short', day: 'numeric' });
  }

  return (
    <Card className="shadow-md">
      <CardHeader>
        <CardTitle className="flex items-center text-xl">
          <BarChart className="h-6 w-6 mr-2 text-primary" />
          Information
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <Server className="h-5 w-5 mr-2 text-muted-foreground" />
            <span className="text-sm font-medium">Active Streams</span>
          </div>
          {activeStreamCount === undefined ? (
            <Skeleton className="h-5 w-10" />
          ) : (
            <span className="text-lg font-semibold text-primary">{activeStreamCount}</span>
          )}
        </div>
        
        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <Clock className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Last Stream Update</span>
            </div>
            {lastStreamUpdateTime ? (
                <span className="text-sm font-semibold text-primary" title={formatDate(lastStreamUpdateTime)}>{formatTime(lastStreamUpdateTime)}</span>
            ) : (
                 activeStreamCount > 0 || lastStreamUpdateTime === null ? <Skeleton className="h-5 w-20" /> : 'N/A'
            )}
        </div>

        <div className="flex items-center justify-between">
            <div className="flex items-center">
                <RefreshCw className="h-5 w-5 mr-2 text-muted-foreground" />
                <span className="text-sm font-medium">Next Stream Update</span>
            </div>
            {nextStreamUpdateTime ? (
                 <span className="text-sm font-semibold text-primary" title={formatDate(nextStreamUpdateTime)}>{formatTime(nextStreamUpdateTime)}</span>
            ) : (
                activeStreamCount > 0 || nextStreamUpdateTime === null ? <Skeleton className="h-5 w-20" /> : 'N/A'
            )}
        </div>
         <p className="text-xs text-muted-foreground pt-2">
            System monitor provides an overview of stream activity. Hotkeys: (R)efresh, (M)ute, (H)eadless.
        </p>
      </CardContent>
    </Card>
  );
};

