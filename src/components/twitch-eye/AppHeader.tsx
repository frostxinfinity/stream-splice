
"use client";

import type { FC } from 'react';
import React from 'react'; // Ensure React is imported for useState
import Image from 'next/image';
import type { User } from '@/types';
import { RefreshCw, Settings2, LogIn, LogOut, User as UserIcon, VideoOff, Volume2, VolumeX, Clock, Palette, Trash2, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuPortal,
  DropdownMenuCheckboxItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import type { availableQualities as AvailableQualitiesType, refreshIntervalOptions as RefreshIntervalOptionsType } from '@/lib/constants';

interface IgnoredStreamInfo {
  id: string;
  userName: string;
}

export type Theme = 'light' | 'dark' | 'dark-red';

interface AppHeaderProps {
  currentUser: User | null;
  onLogin: () => void;
  onLogout: () => void;
  onRefreshStreams: () => void;
  ignoredStreams: IgnoredStreamInfo[];
  onUnignoreStream: (streamId: string) => void;
  isLoading: boolean;
  masterQuality: string;
  availableQualities: typeof AvailableQualitiesType;
  onMasterQualityChange: (quality: string) => void;
  masterHeadless: boolean;
  onToggleMasterHeadless: () => void;
  refreshIntervalMinutes: number;
  refreshIntervalOptions: typeof RefreshIntervalOptionsType;
  onRefreshIntervalChange: (interval: number) => void;
  masterMute: boolean;
  onToggleMasterMute: () => void;
  currentTheme: Theme;
  onThemeChange: (theme: Theme) => void;
  onClearAllSettings: () => void;
}

const themeOptions: Array<{ value: Theme; label: string }> = [
  { value: 'light', label: 'Light' },
  { value: 'dark', label: 'Dark' },
  { value: 'dark-red', label: 'Dark Red' },
];

export const AppHeader: FC<AppHeaderProps> = ({
  currentUser,
  onLogin,
  onLogout,
  onRefreshStreams,
  ignoredStreams,
  onUnignoreStream,
  isLoading,
  masterQuality,
  availableQualities,
  onMasterQualityChange,
  masterHeadless,
  onToggleMasterHeadless,
  refreshIntervalMinutes,
  refreshIntervalOptions,
  onRefreshIntervalChange,
  masterMute,
  onToggleMasterMute,
  currentTheme,
  onThemeChange,
  onClearAllSettings,
}) => {
  const [isClearSettingsAlertOpen, setIsClearSettingsAlertOpen] = React.useState(false);

  const currentMasterQualityLabel = availableQualities.find(q => q.value === masterQuality)?.label || masterQuality;
  const currentRefreshIntervalLabel = refreshIntervalOptions.find(opt => opt.value === refreshIntervalMinutes)?.label || `${refreshIntervalMinutes} min`;
  const currentThemeLabel = themeOptions.find(t => t.value === currentTheme)?.label || 'Theme';

  const handleConfirmClearSettings = () => {
    onClearAllSettings();
    setIsClearSettingsAlertOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 bg-background/80 backdrop-blur-md border-b border-border p-4 shadow-md">
      <div className="container mx-auto flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Image src="/src/app/stream-splice-s-192x192.png" alt="Stream Splice Logo" width={32} height={32} data-ai-hint="logo abstract"/>
          <h1 className="text-2xl font-bold text-foreground">Stream Splice</h1>
        </div>
        <div className="flex items-center gap-2 sm:gap-4">
           <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label={`Current theme: ${currentThemeLabel}. Change theme.`}>
                <Palette className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Select Theme</DropdownMenuLabel>
              <DropdownMenuRadioGroup value={currentTheme} onValueChange={(value) => onThemeChange(value as Theme)}>
                {themeOptions.map((themeOpt) => (
                  <DropdownMenuRadioItem key={themeOpt.value} value={themeOpt.value}>
                    {themeOpt.label}
                  </DropdownMenuRadioItem>
                ))}
              </DropdownMenuRadioGroup>
            </DropdownMenuContent>
          </DropdownMenu>

          {currentUser && (
             <Button variant="outline" size="icon" onClick={onToggleMasterMute} aria-label={masterMute ? "Unmute All Streams" : "Mute All Streams"}>
              {masterMute ? <VolumeX className="h-5 w-5" /> : <Volume2 className="h-5 w-5" />}
            </Button>
          )}
          {currentUser ? (
            <div className="flex items-center gap-2">
              <Avatar className="h-8 w-8">
                <AvatarImage src={currentUser.profile_image_url} alt={currentUser.display_name} data-ai-hint="abstract avatar"/>
                <AvatarFallback><UserIcon className="h-4 w-4" /></AvatarFallback>
              </Avatar>
              <span className="text-sm font-medium text-foreground hidden sm:inline">{currentUser.display_name}</span>
              <Button variant="outline" size="sm" onClick={onLogout}>
                <LogOut className="h-4 w-4 mr-0 sm:mr-2" />
                <span className="hidden sm:inline">Logout</span>
              </Button>
            </div>
          ) : (
            <Button variant="default" size="sm" onClick={onLogin}>
              <LogIn className="h-4 w-4 mr-2" />
              Login with Twitch
            </Button>
          )}
          <Button variant="outline" size="icon" onClick={onRefreshStreams} disabled={isLoading || !currentUser} aria-label="Refresh Streams">
            <RefreshCw className={`h-5 w-5 ${isLoading && currentUser ? 'animate-spin' : ''}`} />
          </Button>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" aria-label="Settings and Ignored Streams" disabled={!currentUser}>
                <Settings2 className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72">
              <DropdownMenuLabel>Global Settings</DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={!currentUser}>
                  <Settings2 className="h-4 w-4 mr-2"/> Master Quality: {currentMasterQualityLabel}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup value={masterQuality} onValueChange={onMasterQualityChange}>
                      {availableQualities.map((quality) => (
                        <DropdownMenuRadioItem key={quality.value} value={quality.value}>
                          {quality.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuCheckboxItem
                checked={masterHeadless}
                onCheckedChange={onToggleMasterHeadless}
                className="flex items-center gap-2"
                disabled={!currentUser}
              >
                <VideoOff className="h-4 w-4" />
                <span>Master Headless Mode</span>
              </DropdownMenuCheckboxItem>
               <DropdownMenuSub>
                <DropdownMenuSubTrigger disabled={!currentUser}>
                 <Clock className="h-4 w-4 mr-2"/> Stream Refresh: {currentRefreshIntervalLabel}
                </DropdownMenuSubTrigger>
                <DropdownMenuPortal>
                  <DropdownMenuSubContent>
                    <DropdownMenuRadioGroup
                        value={String(refreshIntervalMinutes)}
                        onValueChange={(value) => onRefreshIntervalChange(parseInt(value,10))}
                    >
                      {refreshIntervalOptions.map((option) => (
                        <DropdownMenuRadioItem key={option.value} value={String(option.value)}>
                          {option.label}
                        </DropdownMenuRadioItem>
                      ))}
                    </DropdownMenuRadioGroup>
                  </DropdownMenuSubContent>
                </DropdownMenuPortal>
              </DropdownMenuSub>
              <DropdownMenuSeparator />
              <DropdownMenuLabel>Ignored Streams ({ignoredStreams.length})</DropdownMenuLabel>
              {ignoredStreams.map(ignoredStream => (
                <DropdownMenuItem key={ignoredStream.id} className="flex justify-between items-center">
                  <span>{ignoredStream.userName}</span>
                  <Button variant="ghost" size="sm" onClick={() => onUnignoreStream(ignoredStream.id)}>Unignore</Button>
                </DropdownMenuItem>
              ))}
               {ignoredStreams.length === 0 && (
                <DropdownMenuItem disabled>No streams ignored.</DropdownMenuItem>
              )}
              <DropdownMenuSeparator />
                <AlertDialog open={isClearSettingsAlertOpen} onOpenChange={setIsClearSettingsAlertOpen}>
                  <AlertDialogTrigger asChild>
                    <DropdownMenuItem
                      onSelect={(e) => e.preventDefault()} // Prevent menu from closing
                      className="text-destructive focus:bg-destructive/10 focus:text-destructive"
                      disabled={!currentUser}
                    >
                      <Trash2 className="h-4 w-4 mr-2" />
                      Clear All Settings
                    </DropdownMenuItem>
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle className="flex items-center">
                        <AlertTriangle className="h-5 w-5 mr-2 text-destructive" />
                        Are you absolutely sure?
                        </AlertDialogTitle>
                      <AlertDialogDescription>
                        This action cannot be undone. This will permanently delete all your
                        customizations including ignored streams, quality settings, theme preferences,
                        and stream order.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel>Cancel</AlertDialogCancel>
                      <AlertDialogAction
                        onClick={handleConfirmClearSettings}
                        className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
                      >
                        Yes, clear settings
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    </header>
  );
};

