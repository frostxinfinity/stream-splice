"use client";

import React, { type FC, useState, useEffect, useCallback, useRef } from 'react';
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
  UserX,
  UserCheck,
  MicOff,
  ShieldAlert,
  EyeOff,
  Send,
  ListFilter,
  BarChart2,
  HelpCircle,
  Settings2 as CogIcon,
  Volume2,
  Users2,
  SmilePlus,
  Hourglass,
  Loader2,
  RefreshCw,
  AlertTriangle,
  RadioTower,
  Speech,
  ToggleLeft,
  ToggleRight,
  Sparkles,
  CircleSlash,
  Rabbit,
  Turtle,
  UsersRound,
  ChevronsUpDown,
  CheckIcon as Check,
  Vote,
  TrendingUp,
  PlusCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import type { Stream, AISummary, AIPreviewStill, User, TwitchChatSettingsResponse, TwitchChatter, TwitchPollRequest, TwitchPredictionRequest, TwitchChatSettingsRequest as TwitchApiChatSettingsRequest } from '@/types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogClose, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { TwitchPlayer } from './TwitchPlayer';
import { Tooltip, TooltipProvider, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { getFormattedThumbnailUrl, cn } from '@/lib/utils';
import { motion, AnimatePresence } from 'framer-motion';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import type { Theme } from '@/components/twitch-eye/AppHeader';


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
  parentDomain: string | null;
  currentTheme: Theme;
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
      <RadioTower className="h-10 w-10" />
      <span className="text-sm font-medium">{userName} - Live</span>
    </motion.div>
  );
};

const MAX_MOD_CHECK_ATTEMPTS = 10;

const followerModeDurationOptions = [
    { value: 0, label: 'Any Follower (0 mins)' },
    { value: 10, label: '10 Minutes' },
    { value: 30, label: '30 Minutes' },
    { value: 60, label: '1 Hour' },
    { value: 1440, label: '1 Day' },
    { value: 10080, label: '1 Week' },
    { value: 43200, label: '1 Month' },
    { value: 129600, label: '3 Months' },
];

const slowModeDurationOptions = [
    { value: 3, label: '3 Seconds' },
    { value: 5, label: '5 Seconds' },
    { value: 10, label: '10 Seconds' },
    { value: 15, label: '15 Seconds' },
    { value: 30, label: '30 Seconds' },
    { value: 60, label: '60 Seconds' },
    { value: 120, label: '120 Seconds' },
];

interface UsernameComboboxProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  emptyMessage?: string;
  disabled?: boolean;
  id?: string;
  'data-ai-hint'?: string;
  chatterData: { value: string; label: string }[];
  isLoadingChatters?: boolean;
}

const UsernameCombobox: FC<UsernameComboboxProps> = ({
  value,
  onChange,
  placeholder = "Select or type user...",
  emptyMessage = "No users found. Type manually.",
  disabled,
  id,
  "data-ai-hint": aiHint,
  chatterData,
  isLoadingChatters,
}) => {
  const [popoverOpen, setPopoverOpen] = useState(false);
  const [inputValue, setInputValue] = useState(value); // Internal state for typed input

  useEffect(() => {
    setInputValue(value); // Sync with external value prop
  }, [value]);

  const handleInputChange = (search: string) => {
    setInputValue(search);
    onChange(search); // Propagate change for manual typing
  };

  const handleSelect = (currentValue: string) => {
    const selectedChatter = chatterData.find(c => c.value === currentValue);
    const finalValue = selectedChatter ? selectedChatter.value : currentValue;
    onChange(finalValue);
    setInputValue(finalValue); // Ensure input displays the selected value/label correctly
    setPopoverOpen(false);
  };

  const displayValue = chatterData.find(chatter => chatter.value === inputValue)?.label || inputValue || placeholder;

  return (
    <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
      <PopoverTrigger asChild>
        <Button
          id={id}
          variant="outline"
          role="combobox"
          aria-expanded={popoverOpen}
          className="w-full justify-between h-8 text-xs"
          disabled={disabled || isLoadingChatters}
          data-ai-hint={aiHint}
        >
          {isLoadingChatters ? <Loader2 className="h-3 w-3 animate-spin mr-1" /> : null}
          <span className="truncate"> {isLoadingChatters ? "Loading chatters..." : displayValue}</span>
          <ChevronsUpDown className="ml-2 h-3 w-3 shrink-0 opacity-50" />
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-[--radix-popover-trigger-width] p-0">
        <Command>
          <CommandInput
            placeholder="Search or type username..."
            className="h-8 text-xs"
            value={inputValue}
            onValueChange={handleInputChange}
          />
          <CommandList>
            {isLoadingChatters && <CommandEmpty>Loading chatters...</CommandEmpty>}
            {!isLoadingChatters && chatterData.length === 0 && <CommandEmpty>{emptyMessage}</CommandEmpty>}
            <CommandGroup>
              {chatterData.map((chatter) => (
                <CommandItem
                  key={chatter.value}
                  value={chatter.value} // This is what cmdk uses for filtering/matching
                  onSelect={() => handleSelect(chatter.value)}
                  className="text-xs"
                >
                  <Check
                    className={cn(
                      "mr-2 h-3 w-3",
                      value === chatter.value ? "opacity-100" : "opacity-0"
                    )}
                  />
                  {chatter.label} ({chatter.value})
                </CommandItem>
              ))}
            </CommandGroup>
          </CommandList>
        </Command>
      </PopoverContent>
    </Popover>
  );
};

const pollFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(60, "Title must be 60 characters or less"),
  choices: z.array(
    z.object({ title: z.string().min(1, "Choice title is required").max(25, "Choice must be 25 characters or less") })
  ).min(2, "At least 2 choices are required").max(5, "At most 5 choices are allowed"),
  duration: z.number().min(15, "Duration must be at least 15 seconds").max(1800, "Duration must be 1800 seconds or less"),
  channel_points_voting_enabled: z.boolean().optional(),
  channel_points_per_vote: z.number().min(1, "Channel points per vote must be at least 1").optional(),
}).refine(data => {
  if (data.channel_points_voting_enabled && !data.channel_points_per_vote) {
    return false;
  }
  return true;
}, {
  message: "Channel points per vote is required if Channel Points voting is enabled.",
  path: ["channel_points_per_vote"],
});

type PollFormValues = z.infer<typeof pollFormSchema>;

const CreatePollDialog: FC<{ stream: Stream; currentUser: User | null; onOpenChange: (open: boolean) => void; isOpen: boolean }> = ({ stream, currentUser, onOpenChange, isOpen }) => {
  const { toast } = useToast();
  const form = useForm<PollFormValues>({
    resolver: zodResolver(pollFormSchema),
    defaultValues: {
      title: "",
      choices: [{ title: "" }, { title: "" }],
      duration: 60,
      channel_points_voting_enabled: false,
      channel_points_per_vote: 1,
    },
  });
  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "choices",
  });

  const onSubmit = async (data: PollFormValues) => {
    if (!currentUser || !stream) {
      toast({ title: "Error", description: "User or stream data missing.", variant: "destructive" });
      return;
    }

    const pollRequestData: Omit<TwitchPollRequest, 'broadcaster_id'> = {
      title: data.title,
      choices: data.choices.map(c => ({ title: c.title })),
      duration: data.duration,
      channel_points_voting_enabled: data.channel_points_voting_enabled,
      channel_points_per_vote: data.channel_points_voting_enabled ? data.channel_points_per_vote : undefined,
    };

    try {
      const response = await fetch('/api/moderate/polls', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-Broadcaster-ID': stream.user_id,
        },
        body: JSON.stringify(pollRequestData),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Poll Created", description: `Poll "${data.title}" started successfully.` });
        onOpenChange(false);
        form.reset();
      } else {
        throw new Error(result.error || 'Failed to create poll.');
      }
    } catch (error: any) {
      toast({ title: "Poll Creation Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent className="sm:max-w-[525px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
            <DialogHeader>
              <DialogTitle className="flex items-center"><Vote className="h-5 w-5 mr-2 text-primary"/>Create Poll for {stream.user_name}</DialogTitle>
              <DialogDescription>Configure and start a new poll for your viewers.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <ScrollArea className="max-h-[60vh] p-1">
                <div className="space-y-4 pr-4">
                  <div>
                    <Label htmlFor="poll-title">Title</Label>
                    <Input id="poll-title" {...form.register("title")} data-ai-hint="poll question" />
                    {form.formState.errors.title && <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>}
                  </div>

                  <div>
                    <Label>Choices ({fields.length}/5)</Label>
                    {fields.map((field, index) => (
                      <div key={field.id} className="flex items-center gap-2 mt-1">
                        <Input {...form.register(`choices.${index}.title`)} placeholder={`Choice ${index + 1}`} data-ai-hint="poll option"/>
                        {fields.length > 2 && (
                          <Button type="button" variant="ghost" size="icon" onClick={() => remove(index)} className="h-8 w-8">
                            <XCircle className="h-4 w-4 text-destructive" />
                          </Button>
                        )}
                      </div>
                    ))}
                    {form.formState.errors.choices && typeof form.formState.errors.choices === 'object' && (form.formState.errors.choices as any).message && <p className="text-xs text-destructive mt-1">{(form.formState.errors.choices as any).message}</p>}
                    {Array.isArray(form.formState.errors.choices) && form.formState.errors.choices.map((choiceError, index) => (
                        choiceError?.title?.message && <p key={index} className="text-xs text-destructive mt-1">{choiceError.title.message}</p>
                    ))}
                     {fields.length < 5 && (
                      <Button type="button" variant="outline" size="sm" onClick={() => append({ title: "" })} className="mt-2 text-xs h-8">
                        <PlusCircle className="h-4 w-4 mr-1" /> Add Choice
                      </Button>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="poll-duration">Duration (seconds)</Label>
                    <Input id="poll-duration" type="number" {...form.register("duration", { valueAsNumber: true })} data-ai-hint="duration seconds" />
                    {form.formState.errors.duration && <p className="text-xs text-destructive mt-1">{form.formState.errors.duration.message}</p>}
                  </div>

                  <div className="flex items-center space-x-2">
                    <Controller
                        name="channel_points_voting_enabled"
                        control={form.control}
                        render={({ field }) => (
                            <Switch
                                id="cp-voting"
                                checked={field.value}
                                onCheckedChange={field.onChange}
                                aria-label="Enable Channel Points Voting"
                            />
                        )}
                    />
                    <Label htmlFor="cp-voting">Enable Channel Points Voting</Label>
                  </div>

                  {form.watch("channel_points_voting_enabled") && (
                    <div>
                      <Label htmlFor="cp-per-vote">Channel Points Per Vote</Label>
                      <Input id="cp-per-vote" type="number" {...form.register("channel_points_per_vote", { valueAsNumber: true })} data-ai-hint="points cost" />
                      {form.formState.errors.channel_points_per_vote && <p className="text-xs text-destructive mt-1">{form.formState.errors.channel_points_per_vote.message}</p>}
                    </div>
                  )}
                </div>
              </ScrollArea>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                <Button type="submit" disabled={form.formState.isSubmitting}>
                  {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                  Create Poll
                </Button>
              </DialogFooter>
            </form>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
  );
};

const predictionFormSchema = z.object({
  title: z.string().min(1, "Title is required").max(45, "Title must be 45 characters or less"),
  outcomes: z.array(
    z.object({ title: z.string().min(1, "Outcome title is required").max(25, "Outcome must be 25 characters or less") })
  ).length(2, "Exactly 2 outcomes are required"),
  prediction_window: z.number().min(30, "Prediction window must be at least 30 seconds").max(1800, "Prediction window must be 1800 seconds or less"),
});

type PredictionFormValues = z.infer<typeof predictionFormSchema>;

const CreatePredictionDialog: FC<{ stream: Stream; currentUser: User | null; onOpenChange: (open: boolean) => void; isOpen: boolean }> = ({ stream, currentUser, onOpenChange, isOpen }) => {
  const { toast } = useToast();
  const form = useForm<PredictionFormValues>({
    resolver: zodResolver(predictionFormSchema),
    defaultValues: {
      title: "",
      outcomes: [{ title: "" }, { title: "" }],
      prediction_window: 120,
    },
  });

  const onSubmit = async (data: PredictionFormValues) => {
    if (!currentUser || !stream) {
      toast({ title: "Error", description: "User or stream data missing.", variant: "destructive" });
      return;
    }
    const predictionRequestData: Omit<TwitchPredictionRequest, 'broadcaster_id'> = {
      title: data.title,
      outcomes: data.outcomes.map(o => ({ title: o.title })),
      prediction_window: data.prediction_window,
    };

    try {
      const response = await fetch('/api/moderate/predictions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'X-Broadcaster-ID': stream.user_id,
        },
        body: JSON.stringify(predictionRequestData),
      });
      const result = await response.json();
      if (response.ok && result.success) {
        toast({ title: "Prediction Started", description: `Prediction "${data.title}" started successfully.` });
        onOpenChange(false);
        form.reset();
      } else {
        throw new Error(result.error || 'Failed to start prediction.');
      }
    } catch (error: any) {
      toast({ title: "Prediction Start Failed", description: error.message, variant: "destructive" });
    }
  };

  return (
     <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <AnimatePresence>
        {isOpen && (
          <DialogContent className="sm:max-w-[525px]">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ duration: 0.2 }}
            >
            <DialogHeader>
              <DialogTitle className="flex items-center"><TrendingUp className="h-5 w-5 mr-2 text-primary"/>Create Prediction for {stream.user_name}</DialogTitle>
              <DialogDescription>Set up and start a new prediction for your viewers.</DialogDescription>
            </DialogHeader>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 py-2">
              <ScrollArea className="max-h-[60vh] p-1">
                 <div className="space-y-4 pr-4">
                    <div>
                        <Label htmlFor="prediction-title">Title</Label>
                        <Input id="prediction-title" {...form.register("title")} data-ai-hint="prediction event" />
                        {form.formState.errors.title && <p className="text-xs text-destructive mt-1">{form.formState.errors.title.message}</p>}
                    </div>

                    <div>
                        <Label>Outcomes (Exactly 2)</Label>
                        {form.getValues("outcomes").map((_, index) => (
                        <div key={index} className="mt-1">
                            <Input {...form.register(`outcomes.${index}.title`)} placeholder={`Outcome ${index + 1}`} data-ai-hint="prediction choice" />
                            {form.formState.errors.outcomes?.[index]?.title && <p className="text-xs text-destructive mt-1">{form.formState.errors.outcomes[index]?.title?.message}</p>}
                        </div>
                        ))}
                         {form.formState.errors.outcomes && typeof form.formState.errors.outcomes === 'object' && !Array.isArray(form.formState.errors.outcomes) && (
                           <p className="text-xs text-destructive mt-1">{(form.formState.errors.outcomes as any).message}</p>
                        )}
                    </div>

                    <div>
                        <Label htmlFor="prediction-window">Prediction Window (seconds)</Label>
                        <Input id="prediction-window" type="number" {...form.register("prediction_window", { valueAsNumber: true })} data-ai-hint="duration seconds" />
                        {form.formState.errors.prediction_window && <p className="text-xs text-destructive mt-1">{form.formState.errors.prediction_window.message}</p>}
                    </div>
                  </div>
                </ScrollArea>
                <DialogFooter>
                    <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
                    <Button type="submit" disabled={form.formState.isSubmitting}>
                     {form.formState.isSubmitting && <Loader2 className="h-4 w-4 mr-2 animate-spin"/>}
                    Start Prediction
                    </Button>
                </DialogFooter>
            </form>
            </motion.div>
          </DialogContent>
        )}
      </AnimatePresence>
    </Dialog>
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
  parentDomain,
  currentTheme,
}) => {
  const { toast } = useToast();
  const [summary, setSummary] = useState<AISummary | null>(null);
  const [previews, setPreviews] = useState<AIPreviewStill[] | null>(null);
  const [isLoadingSummary, setIsLoadingSummary] = useState(false);
  const [isLoadingPreviews, setIsLoadingPreviews] = useState(false);
  const [isEnlargeModalOpen, setIsEnlargeModalOpen] = useState(false);

  const [isModerator, setIsModerator] = useState(false);
  const [checkingModStatus, setCheckingModStatus] = useState(false);
  const [modCheckAttempts, setModCheckAttempts] = useState(0);
  const [modCheckError, setModCheckError] = useState<string | null>(null);

  const [timeoutUsername, setTimeoutUsername] = useState('');
  const [timeoutDuration, setTimeoutDuration] = useState<string>('600');
  const [timeoutReason, setTimeoutReason] = useState('');
  const [banUsername, setBanUsername] = useState('');
  const [banReason, setBanReason] = useState('');
  const [unbanUsername, setUnbanUsername] = useState('');

  const [warnUsername, setWarnUsername] = useState('');
  const [warnMessage, setWarnMessage] = useState('');
  const [whisperTargetUsername, setWhisperTargetUsername] = useState('');
  const [whisperMessageContent, setWhisperMessageContent] = useState('');

  const [chatSettings, setChatSettings] = useState<Partial<TwitchChatSettingsResponse>>({});
  const [isLoadingChatSettings, setIsLoadingChatSettings] = useState(false);
  const [chatSettingsError, setChatSettingsError] = useState<string | null>(null);

  const [chatterData, setChatterData] = useState<{ value: string; label: string }[]>([]);
  const [isLoadingChatters, setIsLoadingChatters] = useState(false);

  const [isPollDialogOpen, setIsPollDialogOpen] = useState(false);
  const [isPredictionDialogOpen, setIsPredictionDialogOpen] = useState(false);


  const formattedThumbnailUrl = getFormattedThumbnailUrl(stream.thumbnail_url, 320, 180);

  const addAppLog = useCallback((message: string, level: 'info' | 'warn' | 'error') => {
    // This is a simplified client-side log for demonstration.
    // In a real app, you might send this to a logging service or a more robust store.
    console.log(`[AppLog][${level.toUpperCase()}] StreamCard (${stream.user_name}): ${message}`);
  }, [stream.user_name]);

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
                try {
                  const selectors = [
                    'button[data-a-target="player-overlay-mature-accept"]',
                    'button[data-test-selector="content-classification-gate-overlay-start-watching-button"]',
                    'button[data-a-target*="accept-button"]',
                    'button[data-test-selector*="accept"]',
                    'div[data-a-target="player-overlay-content-gate"] button'
                  ];
                  let acceptButton: HTMLElement | null = null;
                  for (const selector of selectors) {
                    acceptButton = playerIframe.contentWindow.document.querySelector(selector) as HTMLElement | null;
                    if (acceptButton) break;
                  }

                  if (acceptButton && typeof acceptButton.click === 'function') {
                    acceptButton.click();
                    addAppLog(`Auto-clicked content warning/gate for ${stream.user_login}.`, 'info');
                  }
                } catch (error) {
                  addAppLog(`Error auto-clicking content warning for ${stream.user_login}: ${error instanceof Error ? error.message : String(error)}`, 'warn');
                }
            }
        }, 4000);
      }
    }
  }, [stream.type, stream.user_login, isHeadless, isEnlargeModalOpen, currentQuality, addAppLog]);


  const checkModeratorStatus = useCallback(async () => {
    // This function checks if the CURRENT LOGGED-IN USER is a moderator
    // for the CURRENTLY VIEWED STREAM (`stream.user_id`).
    if (!isEnlargeModalOpen || stream.type !== 'live' || !currentUser?.id) {
        setIsModerator(false);
        setCheckingModStatus(false);
        return;
    }

    if (modCheckError && modCheckAttempts >= MAX_MOD_CHECK_ATTEMPTS) { // Check if error already exists and max attempts reached
        setCheckingModStatus(false);
        return;
    }
    
    setCheckingModStatus(true);
    const currentAttempt = modCheckAttempts + 1; // Increment attempt count immediately

    try {
        setModCheckAttempts(currentAttempt);
        // API call targets the viewed stream's broadcaster_id
        const response = await fetch(`/api/is-moderator?broadcaster_id=${stream.user_id}`);

        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ message: `API error ${response.status}` }));
            throw new Error(errorData.error || `Failed to check moderator status: ${response.statusText}`);
        }

        const data = await response.json();
        setIsModerator(data.isModerator);
        addAppLog(`Moderator status for ${stream.user_name}: ${data.isModerator}. Attempt: ${currentAttempt}. Logged in as: ${currentUser.login}`, 'info');
        setModCheckError(null); // Clear any previous API error on successful response

        if (data.isModerator) {
            // No need to reset modCheckAttempts here, successfully identified.
        }
    } catch (error) {
        setIsModerator(false);
        const errorMessage = error instanceof Error ? error.message : String(error);
        addAppLog(`Error checking mod status for ${stream.user_name} (Attempt ${currentAttempt}): ${errorMessage}`, 'error');
        if (currentAttempt >= MAX_MOD_CHECK_ATTEMPTS) {
             setModCheckError(`Failed after ${MAX_MOD_CHECK_ATTEMPTS} attempts. Last error: ${errorMessage}. Ensure correct Twitch scopes (user:read:moderated_channels) are granted.`);
             toast({ title: "Moderator Check Failed", description: `Could not verify moderator status for ${stream.user_name} after ${MAX_MOD_CHECK_ATTEMPTS} tries. ${errorMessage}`, variant: "destructive", duration: 7000});
        }
    } finally {
        setCheckingModStatus(false);
    }
  }, [isEnlargeModalOpen, stream.user_id, stream.user_login, stream.type, stream.user_name, currentUser, modCheckAttempts, modCheckError, addAppLog, toast]);


  const fetchChannelChatSettings = useCallback(async () => {
    if (!isEnlargeModalOpen || !isModerator || !currentUser?.id || stream.type !== 'live') {
      setChatSettings({});
      setChatSettingsError(null);
      return;
    }
    setIsLoadingChatSettings(true);
    setChatSettingsError(null);
    try {
      const response = await fetch(`/api/chat-settings?broadcaster_id=${stream.user_id}`); // moderator_id is session.userId on backend
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: `API error ${response.status}` }));
        throw new Error(errorData.error || errorData.message || `Failed to fetch chat settings: ${response.statusText}`);
      }
      const data: TwitchChatSettingsResponse = await response.json();
      setChatSettings(data);
      addAppLog(`Fetched chat settings for ${stream.user_name}.`, 'info');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addAppLog(`Error fetching chat settings for ${stream.user_name}: ${errorMessage}`, 'error');
      setChatSettingsError(errorMessage);
      toast({ title: "Chat Settings Error", description: `Could not fetch chat settings for ${stream.user_name}. ${errorMessage}`, variant: "destructive" });
      setChatSettings({});
    } finally {
      setIsLoadingChatSettings(false);
    }
  }, [isEnlargeModalOpen, isModerator, currentUser?.id, stream.user_id, stream.user_name, stream.type, addAppLog, toast]);

  const fetchChannelChatters = useCallback(async () => {
    if (!isModerator || !currentUser?.id || stream.type !== 'live' || !isEnlargeModalOpen) {
      setChatterData([]);
      return;
    }
    setIsLoadingChatters(true);
    try {
      const response = await fetch(`/api/chatters?broadcaster_id=${stream.user_id}`);
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: 'Failed to fetch chatters data' }));
        throw new Error(errorData.error || `API error ${response.status}`);
      }
      const data: { chatters: TwitchChatter[] } = await response.json();
      const formattedChatters = (data.chatters || []).map((chatter: TwitchChatter) => ({
        value: chatter.user_login, // Use login for value as it's often used in APIs
        label: chatter.user_name,  // Use display name for label
      }));
      setChatterData(formattedChatters);
      addAppLog(`Fetched ${formattedChatters.length} chatters for ${stream.user_name}.`, 'info');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      addAppLog(`Error fetching chatters for ${stream.user_name}: ${errorMessage}`, 'error');
      toast({ title: "Chatter List Error", description: `Could not fetch chatters. ${errorMessage}`, variant: "destructive" });
      setChatterData([]);
    } finally {
      setIsLoadingChatters(false);
    }
  }, [isModerator, currentUser?.id, stream.user_id, stream.user_name, stream.type, isEnlargeModalOpen, addAppLog, toast]);


  const prevIsEnlargeModalOpen = useRef<boolean>(isEnlargeModalOpen);
  const prevIsModerator = useRef<boolean>(isModerator);

  useEffect(() => {
    if (isEnlargeModalOpen && stream.type === 'live' && currentUser?.id) {
      if (!prevIsEnlargeModalOpen.current) { // Modal just opened
        setModCheckAttempts(0); // Reset attempts when modal opens
        setModCheckError(null); // Clear any previous error message
        setIsModerator(false);  // Assume not moderator until confirmed
        checkModeratorStatus(); // Initial check
      }
       // If confirmed as moderator and modal just opened, or became moderator while modal is open
      if (isModerator && (!prevIsModerator.current || !prevIsEnlargeModalOpen.current)) {
        fetchChannelChatSettings();
        fetchChannelChatters();
      }
    } else if (!isEnlargeModalOpen) { // Modal closed or not applicable
      setIsModerator(false);
      setCheckingModStatus(false);
      setModCheckAttempts(0);
      setModCheckError(null);
      setChatSettings({});
      setIsLoadingChatSettings(false);
      setChatSettingsError(null);
      setChatterData([]);
      setIsLoadingChatters(false);
    }
    prevIsEnlargeModalOpen.current = isEnlargeModalOpen;
    prevIsModerator.current = isModerator;
  }, [isEnlargeModalOpen, stream.type, currentUser?.id, checkModeratorStatus, isModerator, fetchChannelChatSettings, fetchChannelChatters]);


  const handleRetryModCheck = () => {
    addAppLog(`User initiated retry for moderator status check for ${stream.user_name}.`, 'info');
    setModCheckAttempts(0); // Reset attempts
    setModCheckError(null); // Clear error
    setIsModerator(false);  // Reset moderator state
    checkModeratorStatus(); // Retry check
  };

  const handleTimeoutUser = async () => {
    if (!currentUser || !isModerator || !timeoutUsername || !timeoutDuration) {
      toast({ title: "Error", description: "Cannot perform timeout. Check login, mod status, username, and duration.", variant: "destructive" });
      return;
    }
    const durationSec = parseInt(timeoutDuration, 10);
    if (isNaN(durationSec) || durationSec <= 0) {
      toast({ title: "Error", description: "Invalid timeout duration.", variant: "destructive" });
      return;
    }

    try {
      const response = await fetch('/api/moderate/timeout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcaster_id: stream.user_id, // The channel being moderated
          target_username: timeoutUsername,
          duration: durationSec,
          reason: timeoutReason || null,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: data.message || `User ${timeoutUsername} timed out.` });
        addAppLog(`User ${timeoutUsername} timed out for ${durationSec}s in ${stream.user_name}'s chat. Reason: ${timeoutReason}`, 'info');
        setTimeoutUsername('');
        setTimeoutReason('');
      } else {
        throw new Error(data.error || 'Failed to timeout user.');
      }
    } catch (error: any) {
      toast({ title: "Timeout Failed", description: error.message, variant: "destructive" });
      addAppLog(`Failed to timeout user ${timeoutUsername} in ${stream.user_name}'s chat: ${error.message}`, 'error');
    }
  };

  const handleWarnUser = async () => {
    if (!currentUser || !isModerator || !warnUsername) {
      toast({ title: "Error", description: "Cannot send warning. Check login, mod status, and username.", variant: "destructive" });
      return;
    }
    const messageToSend = warnMessage.trim() || `This is an official warning regarding your conduct in ${stream.user_name}'s chat. Please review the channel rules.`;

    try {
      // Whisper API expects from_user_id (current user) and to_user_id (target user)
      // target_username is used to find to_user_id on backend
      const response = await fetch('/api/moderate/whisper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_username: warnUsername,
          message: messageToSend,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: data.message || `Warning sent to ${warnUsername}.` });
        addAppLog(`Warning (via whisper) sent to ${warnUsername} in ${stream.user_name}'s chat. Message: ${messageToSend}`, 'info');
        setWarnUsername('');
        setWarnMessage('');
      } else {
        throw new Error(data.error || 'Failed to send warning.');
      }
    } catch (error: any) {
      toast({ title: "Warning Failed", description: error.message, variant: "destructive" });
      addAppLog(`Failed to send warning (via whisper) to ${warnUsername} in ${stream.user_name}'s chat: ${error.message}`, 'error');
    }
  };

  const handleSendWhisper = async () => {
    if (!currentUser || !whisperTargetUsername || !whisperMessageContent) {
      toast({ title: "Error", description: "Cannot send whisper. Check login, recipient username, and message content.", variant: "destructive" });
      return;
    }
    try {
      const response = await fetch('/api/moderate/whisper', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          target_username: whisperTargetUsername,
          message: whisperMessageContent,
        }),
      });
      const data = await response.json();
      if (response.ok) {
        toast({ title: "Success", description: data.message || `Whisper sent to ${whisperTargetUsername}.` });
        addAppLog(`Whisper sent to ${whisperTargetUsername} regarding ${stream.user_name}'s chat.`, 'info');
        setWhisperTargetUsername('');
        setWhisperMessageContent('');
      } else {
        throw new Error(data.error || 'Failed to send whisper.');
      }
    } catch (error: any) {
      toast({ title: "Whisper Failed", description: error.message, variant: "destructive" });
      addAppLog(`Failed to send whisper to ${whisperTargetUsername} regarding ${stream.user_name}'s chat: ${error.message}`, 'error');
    }
  };

  const handleUpdateChatSetting = async (settingKey: keyof TwitchApiChatSettingsRequest, value: any) => {
    if (!currentUser || !isModerator || stream.type !== 'live') {
      toast({ title: "Error", description: "Cannot update chat setting.", variant: "destructive" });
      return;
    }

    const settingsPayload: Partial<TwitchApiChatSettingsRequest> = { [settingKey]: value };
    // Optimistic update for UI responsiveness
    const oldSettings = { ...chatSettings };
    setChatSettings(prev => ({ ...prev, ...settingsPayload }));

    try {
      const response = await fetch('/api/moderate/chat-settings', {
        method: 'POST', // The API route uses POST for updates
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          broadcaster_id: stream.user_id, // The channel being moderated
          settings: settingsPayload,
        }),
      });
      const data = await response.json();
      if (response.ok && data.success) {
        // Twitch API returns the complete updated settings object.
        setChatSettings(data.settings);
        toast({ title: "Chat Setting Updated", description: `${String(settingKey)} updated successfully.` });
        addAppLog(`Chat setting '${String(settingKey)}' updated for ${stream.user_name}. New value: ${JSON.stringify(value)}`, 'info');
      } else {
        setChatSettings(oldSettings); // Revert on failure
        throw new Error(data.error || 'Failed to update chat setting.');
      }
    } catch (error: any) {
      setChatSettings(oldSettings); // Revert on failure
      toast({ title: "Update Failed", description: error.message, variant: "destructive" });
      addAppLog(`Failed to update chat setting '${String(settingKey)}' for ${stream.user_name}: ${error.message}`, 'error');
    }
  };

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
                parentDomain={parentDomain}
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
                  <p>Enlarge player, chat &amp; moderation tools.</p>
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

        <Image src={formattedThumbnailUrl} alt={stream.title || `Thumbnail for ${stream.user_name}`} width={320} height={180} className="hidden" data-ai-hint="gameplay stream" priority={Boolean(isFirst)}/>

      </CardHeader>

      <CardContent className="p-4 flex-grow">
         <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <CardTitle className="text-lg leading-tight truncate mb-1 cursor-default">{stream.title}</CardTitle>
                </TooltipTrigger>
                <TooltipContent side="top" align="start">
                    <p className="max-w-xs break-words">{stream.title}</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
        <p className="text-sm text-muted-foreground">
            <span className="font-bold text-accent">{stream.user_name}</span> playing <br />
            <span className="font-semibold text-accent whitespace-normal break-words">{stream.game_name || 'N/A'}</span>
        </p>

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
          <Button variant="outline" size="sm" onClick={() => onSelectChat(stream.id)} disabled={stream.type !== 'live'}>
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
        <Button 
          variant="ghost" 
          size="sm" 
          onClick={() => onIgnoreStream(stream.id)} 
          className={cn(
            "text-muted-foreground",
            currentTheme === 'dark-red' ? 'hover:text-black' : 'hover:text-destructive'
          )}
        >
          <EyeOff className="h-4 w-4 mr-2" />
          Ignore
        </Button>
      </CardFooter>
       <div className="absolute left-2 top-1/2 -translate-y-1/2 opacity-20 group-hover:opacity-50 transition-opacity cursor-grab group-data-[headless=true]:cursor-default" title="Drag to re-order stream">
          <GripVertical className="h-6 w-6" />
        </div>

      <Dialog open={isEnlargeModalOpen} onOpenChange={setIsEnlargeModalOpen}>
        <DialogContent className="w-[95vw] max-w-[1700px] h-[90vh] p-0 bg-background border flex flex-col sm:flex-row gap-0 overflow-hidden">
          {/* Left side: Player and Moderation tools */}
          <div className="flex-grow flex flex-col h-full overflow-hidden sm:w-[calc(100%-350px)] relative z-[1]"> {/* Explicit z-index */}
            <DialogHeader className="flex-shrink-0 p-3 border-b flex flex-row justify-between items-center bg-card">
                <DialogTitle className="text-lg truncate text-card-foreground">
                    {stream.user_name} - {stream.title}
                </DialogTitle>
                <DialogClose asChild>
                    <Button variant="ghost" size="icon" aria-label="Close enlarged player">
                        <X className="h-5 w-5" />
                    </Button>
                </DialogClose>
            </DialogHeader>

            {/* Player Area */}
            <div className="flex-grow bg-black relative min-h-0">
                {isEnlargeModalOpen && stream.type === 'live' && (
                    <TwitchPlayer
                        channelName={stream.user_login}
                        quality={currentQuality}
                        isMasterMuted={isMasterMuted}
                        playerId={`twitch-player-enlarged-${stream.user_login}`}
                        parentDomain={parentDomain}
                    />
                )}
                {isEnlargeModalOpen && stream.type !== 'live' && (
                     <div className="w-full h-full flex items-center justify-center bg-black text-muted-foreground">
                        Stream is offline. Player not available.
                    </div>
                )}
            </div>

            {/* Moderation Tools Area - below player */}
            {isEnlargeModalOpen && stream.type === 'live' && (
                <>
                    {checkingModStatus && !modCheckError && ( // Show loading only if no error and still checking
                        <div className="flex-shrink-0 p-3 border-t bg-card text-card-foreground flex items-center justify-center">
                            <Loader2 className="h-5 w-5 mr-2 animate-spin" /> Checking moderator status for {stream.user_name} (Attempt {modCheckAttempts > 0 ? modCheckAttempts : 1}/{MAX_MOD_CHECK_ATTEMPTS})...
                        </div>
                    )}
                    {modCheckError && ( // Display error and retry button if modCheckError is set
                      <div className="flex-shrink-0 p-3 border-t bg-destructive/10 text-destructive flex flex-col items-center justify-center text-center">
                        <AlertTriangle className="h-6 w-6 mb-2" />
                        <p className="text-sm font-semibold mb-1">Error Verifying Moderator Status for {stream.user_name}</p>
                        <p className="text-xs mb-3">{modCheckError}</p>
                        <Button onClick={handleRetryModCheck} variant="destructive" size="sm" disabled={checkingModStatus}>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Retry Check
                        </Button>
                      </div>
                    )}
                    {isModerator && !checkingModStatus && !modCheckError && ( // Display tools only if moderator, not checking, and no error
                      <ScrollArea className="flex-shrink-0 max-h-[350px] p-3 border-t bg-card text-card-foreground">
                        <Card className="border-none shadow-none bg-transparent">
                          <CardHeader className="p-2">
                            <CardTitle className="text-base flex items-center text-card-foreground">
                                <CogIcon className="h-5 w-5 mr-2 text-primary"/>Moderation Panel: {stream.user_name}
                            </CardTitle>
                            <CardDescription className="text-xs text-muted-foreground">
                                Manage chat and users for {stream.user_name}.
                                <Button variant="link" size="sm" className="p-0 h-auto text-xs ml-1" onClick={fetchChannelChatters} disabled={isLoadingChatters}>
                                   {isLoadingChatters ? <><Loader2 className="h-3 w-3 mr-1 animate-spin"/>Refreshing...</> : <><RefreshCw className="h-3 w-3 mr-1"/>Refresh Chatters</> }
                                </Button>
                            </CardDescription>
                          </CardHeader>
                          <CardContent className="p-2 space-y-4">
                            {/* Polls and Predictions Buttons */}
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-2 mb-3">
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => setIsPollDialogOpen(true)}>
                                    <Vote className="h-4 w-4 mr-1" /> Create Poll
                                </Button>
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={() => setIsPredictionDialogOpen(true)}>
                                    <TrendingUp className="h-4 w-4 mr-1" /> Create Prediction
                                </Button>
                            </div>
                            <Separator/>

                            <Card className="bg-background/30">
                              <CardHeader className="p-2"><CardTitle className="text-sm text-card-foreground flex items-center"><Clock className="h-4 w-4 mr-2"/>Timeout User</CardTitle></CardHeader>
                              <CardContent className="p-2 space-y-3">
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-2 items-end">
                                  <div>
                                    <Label htmlFor={`timeout-user-${stream.id}`} className="text-xs text-muted-foreground">Username</Label>
                                    <UsernameCombobox
                                        id={`timeout-user-${stream.id}`}
                                        value={timeoutUsername}
                                        onChange={setTimeoutUsername}
                                        placeholder="Username to timeout"
                                        data-ai-hint="username"
                                        chatterData={chatterData}
                                        isLoadingChatters={isLoadingChatters}
                                    />
                                  </div>
                                  <Select
                                    value={timeoutDuration}
                                    onValueChange={setTimeoutDuration}
                                  >
                                    <SelectTrigger className="h-8 text-xs" aria-label="Timeout duration">
                                      <SelectValue placeholder="Duration" />
                                    </SelectTrigger>
                                    <SelectContent>
                                      <SelectItem value="10" className="text-xs">10 Seconds</SelectItem>
                                      <SelectItem value="60" className="text-xs">1 Minute</SelectItem>
                                      <SelectItem value="300" className="text-xs">5 Minutes</SelectItem>
                                      <SelectItem value="600" className="text-xs">10 Minutes</SelectItem>
                                      <SelectItem value="1800" className="text-xs">30 Minutes</SelectItem>
                                      <SelectItem value="3600" className="text-xs">1 Hour</SelectItem>
                                    </SelectContent>
                                  </Select>
                                </div>
                                <div>
                                   <Label htmlFor={`timeout-reason-${stream.id}`} className="text-xs text-muted-foreground">Reason (Optional)</Label>
                                   <Input
                                      id={`timeout-reason-${stream.id}`}
                                      placeholder="Reason for timeout"
                                      className="h-8 text-xs mt-1"
                                      value={timeoutReason}
                                      onChange={(e) => setTimeoutReason(e.target.value)}
                                      data-ai-hint="reason message"
                                    />
                                </div>
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs md:col-span-2" onClick={handleTimeoutUser} data-ai-hint="timeout user">
                                    <Clock className="h-4 w-4 mr-1"/>Timeout User
                                </Button>
                              </CardContent>
                            </Card>

                            <Card className="bg-background/30">
                              <CardHeader className="p-2"><CardTitle className="text-sm text-card-foreground flex items-center"><ShieldAlert className="h-4 w-4 mr-2"/>Warn User (Sends Whisper)</CardTitle></CardHeader>
                              <CardContent className="p-2 space-y-3">
                                  <div>
                                    <Label htmlFor={`warn-user-${stream.id}`} className="text-xs text-muted-foreground">Username to Warn</Label>
                                     <UsernameCombobox
                                        id={`warn-user-${stream.id}`}
                                        value={warnUsername}
                                        onChange={setWarnUsername}
                                        placeholder="Username to warn"
                                        data-ai-hint="username"
                                        chatterData={chatterData}
                                        isLoadingChatters={isLoadingChatters}
                                    />
                                  </div>
                                <div>
                                  <Label htmlFor={`warn-message-${stream.id}`} className="text-xs text-muted-foreground">Warning Message (Optional)</Label>
                                  <Textarea
                                    id={`warn-message-${stream.id}`}
                                    placeholder="Default: Official warning about conduct. Review channel rules."
                                    className="text-xs mt-1"
                                    rows={2}
                                    value={warnMessage}
                                    onChange={(e) => setWarnMessage(e.target.value)}
                                    data-ai-hint="warning reason"
                                  />
                                </div>
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={handleWarnUser} data-ai-hint="warn user">
                                  <ShieldAlert className="h-4 w-4 mr-1"/>Send Warning
                                </Button>
                              </CardContent>
                            </Card>

                            <Card className="bg-background/30">
                              <CardHeader className="p-2"><CardTitle className="text-sm text-card-foreground flex items-center"><Send className="h-4 w-4 mr-2"/>Send Whisper</CardTitle></CardHeader>
                              <CardContent className="p-2 space-y-3">
                                <div>
                                  <Label htmlFor={`whisper-user-${stream.id}`} className="text-xs text-muted-foreground">Recipient Username</Label>
                                  <UsernameCombobox
                                      id={`whisper-user-${stream.id}`}
                                      value={whisperTargetUsername}
                                      onChange={setWhisperTargetUsername}
                                      placeholder="Recipient username"
                                      data-ai-hint="username"
                                      chatterData={chatterData}
                                      isLoadingChatters={isLoadingChatters}
                                  />
                                </div>
                                <div>
                                  <Label htmlFor={`whisper-message-${stream.id}`} className="text-xs text-muted-foreground">Whisper Message</Label>
                                  <Textarea
                                    id={`whisper-message-${stream.id}`}
                                    placeholder="Your message..."
                                    className="text-xs mt-1"
                                    rows={3}
                                    value={whisperMessageContent}
                                    onChange={(e) => setWhisperMessageContent(e.target.value)}
                                    data-ai-hint="private message"
                                  />
                                </div>
                                <Button variant="outline" size="sm" className="w-full h-8 text-xs" onClick={handleSendWhisper} data-ai-hint="send whisper">
                                  <Send className="h-4 w-4 mr-1"/>Send Whisper
                                </Button>
                              </CardContent>
                            </Card>

                            <Card className="bg-background/30">
                                <CardHeader className="p-2"><CardTitle className="text-sm text-card-foreground flex items-center"><Speech className="h-4 w-4 mr-2" />Chat Modes</CardTitle></CardHeader>
                                <CardContent className="p-2 space-y-4">
                                    {isLoadingChatSettings && <div className="flex items-center justify-center text-xs text-muted-foreground"><Loader2 className="h-4 w-4 mr-2 animate-spin" />Loading chat settings...</div>}
                                    {chatSettingsError && <div className="text-xs text-destructive">Error: {chatSettingsError} <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={fetchChannelChatSettings}>Retry</Button></div>}
                                    {!isLoadingChatSettings && !chatSettingsError && Object.keys(chatSettings).length > 0 && (
                                        <>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor={`emote-mode-${stream.id}`} className="text-xs flex items-center"><Sparkles className="h-4 w-4 mr-1.5 text-yellow-500" />Emote-Only Mode</Label>
                                                <Switch id={`emote-mode-${stream.id}`} checked={chatSettings.emote_mode || false} onCheckedChange={(checked) => handleUpdateChatSetting('emote_mode', checked)} aria-label="Toggle Emote-Only Mode"/>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor={`sub-mode-${stream.id}`} className="text-xs flex items-center"><UsersRound className="h-4 w-4 mr-1.5 text-purple-500" />Subscriber-Only Mode</Label>
                                                <Switch id={`sub-mode-${stream.id}`} checked={chatSettings.subscriber_mode || false} onCheckedChange={(checked) => handleUpdateChatSetting('subscriber_mode', checked)} aria-label="Toggle Subscriber-Only Mode"/>
                                            </div>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor={`unique-chat-mode-${stream.id}`} className="text-xs flex items-center"><CircleSlash className="h-4 w-4 mr-1.5 text-orange-500" />Unique Chat Mode (R9K)</Label>
                                                <Switch id={`unique-chat-mode-${stream.id}`} checked={chatSettings.unique_chat_mode || false} onCheckedChange={(checked) => handleUpdateChatSetting('unique_chat_mode', checked)} aria-label="Toggle Unique Chat Mode"/>
                                            </div>

                                            <Separator/>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor={`slow-mode-${stream.id}`} className="text-xs flex items-center"><Turtle className="h-4 w-4 mr-1.5 text-blue-500" />Slow Mode</Label>
                                                <Switch id={`slow-mode-${stream.id}`} checked={chatSettings.slow_mode || false}
                                                    onCheckedChange={(checked) => {
                                                        handleUpdateChatSetting('slow_mode', checked);
                                                        if (checked && !chatSettings.slow_mode_wait_time) {
                                                            handleUpdateChatSetting('slow_mode_wait_time', 30);
                                                        }
                                                    }}
                                                    aria-label="Toggle Slow Mode"/>
                                            </div>
                                            {chatSettings.slow_mode && (
                                                <div className="ml-6">
                                                    <Label htmlFor={`slow-duration-${stream.id}`} className="text-xs text-muted-foreground">Wait Time</Label>
                                                    <Select
                                                        value={String(chatSettings.slow_mode_wait_time || 30)}
                                                        onValueChange={(value) => handleUpdateChatSetting('slow_mode_wait_time', parseInt(value, 10))}
                                                    >
                                                        <SelectTrigger id={`slow-duration-${stream.id}`} className="h-8 text-xs mt-1" aria-label="Slow Mode Duration">
                                                            <SelectValue placeholder="Select duration" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {slowModeDurationOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">{opt.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}

                                            <Separator/>
                                            <div className="flex items-center justify-between">
                                                <Label htmlFor={`follower-mode-${stream.id}`} className="text-xs flex items-center"><Users className="h-4 w-4 mr-1.5 text-green-500" />Follower-Only Mode</Label>
                                                <Switch id={`follower-mode-${stream.id}`} checked={chatSettings.follower_mode || false}
                                                    onCheckedChange={(checked) => {
                                                        handleUpdateChatSetting('follower_mode', checked);
                                                        if (checked && (chatSettings.follower_mode_duration === null || chatSettings.follower_mode_duration === undefined)) {
                                                            handleUpdateChatSetting('follower_mode_duration', 0);
                                                        }
                                                    }}
                                                    aria-label="Toggle Follower-Only Mode"/>
                                            </div>
                                            {chatSettings.follower_mode && (
                                                <div className="ml-6">
                                                    <Label htmlFor={`follower-duration-${stream.id}`} className="text-xs text-muted-foreground">Minimum Follow Time</Label>
                                                    <Select
                                                        value={String(chatSettings.follower_mode_duration === null || chatSettings.follower_mode_duration === undefined ? 0 : chatSettings.follower_mode_duration)}
                                                        onValueChange={(value) => handleUpdateChatSetting('follower_mode_duration', parseInt(value, 10))}
                                                    >
                                                        <SelectTrigger id={`follower-duration-${stream.id}`} className="h-8 text-xs mt-1" aria-label="Follower Mode Duration">
                                                            <SelectValue placeholder="Select duration" />
                                                        </SelectTrigger>
                                                        <SelectContent>
                                                            {followerModeDurationOptions.map(opt => <SelectItem key={opt.value} value={String(opt.value)} className="text-xs">{opt.label}</SelectItem>)}
                                                        </SelectContent>
                                                    </Select>
                                                </div>
                                            )}
                                        </>
                                    )}
                                    {!isLoadingChatSettings && !chatSettingsError && Object.keys(chatSettings).length === 0 && (
                                      <p className="text-xs text-muted-foreground text-center py-2">No chat settings data available. <Button variant="link" size="sm" className="p-0 h-auto text-xs" onClick={fetchChannelChatSettings}>Retry</Button></p>
                                    )}
                                </CardContent>
                            </Card>

                            <Card className="bg-background/30">
                              <CardHeader className="p-2"><CardTitle className="text-sm text-card-foreground flex items-center"><ShieldBan className="h-4 w-4 mr-2"/>Ban / Unban User</CardTitle></CardHeader>
                              <CardContent className="p-2 space-y-3">
                                <div className="space-y-2">
                                   <Label htmlFor={`ban-user-${stream.id}`} className="text-xs text-muted-foreground">Username to Ban</Label>
                                    <UsernameCombobox
                                        id={`ban-user-${stream.id}`}
                                        value={banUsername}
                                        onChange={setBanUsername}
                                        placeholder="Username to ban"
                                        data-ai-hint="username"
                                        chatterData={chatterData}
                                        isLoadingChatters={isLoadingChatters}
                                    />
                                   <Label htmlFor={`ban-reason-${stream.id}`} className="text-xs text-muted-foreground">Reason (Optional)</Label>
                                   <Input
                                      id={`ban-reason-${stream.id}`}
                                      placeholder="Reason for ban"
                                      className="h-8 text-xs"
                                      value={banReason}
                                      onChange={(e) => setBanReason(e.target.value)}
                                      data-ai-hint="reason message"
                                    />
                                    <Button variant="destructive" size="sm" className="w-full h-8 text-xs" data-ai-hint="ban user" onClick={() => {/* Implement handleBanUser */ toast({title: "Note", description:"Ban function to be fully wired."})}}><ShieldBan className="h-4 w-4 mr-1"/>Ban User</Button>
                                </div>
                                <Separator />
                                <div className="space-y-2">
                                  <Label htmlFor={`unban-user-${stream.id}`} className="text-xs text-muted-foreground">Username to Unban</Label>
                                    <UsernameCombobox
                                        id={`unban-user-${stream.id}`}
                                        value={unbanUsername}
                                        onChange={setUnbanUsername}
                                        placeholder="Username to unban"
                                        data-ai-hint="username"
                                        chatterData={chatterData}
                                        isLoadingChatters={isLoadingChatters}
                                    />
                                  <Button variant="secondary" size="sm" className="w-full h-8 text-xs" data-ai-hint="unban user" onClick={() => {/* Implement handleUnbanUser */ toast({title: "Note", description:"Unban function to be fully wired."})}}><UserCheck className="h-4 w-4 mr-1"/>Unban User</Button>
                                </div>
                                 <p className="text-xs text-muted-foreground pt-1">Full Ban/Unban functionality to be implemented.</p>
                              </CardContent>
                            </Card>

                             <Card className="bg-background/30 opacity-50">
                              <CardHeader className="p-2"><CardTitle className="text-sm text-card-foreground">Other Tools (Placeholder)</CardTitle></CardHeader>
                              <CardContent className="p-2 text-xs text-muted-foreground">
                                More tools like Manage Polls/Predictions (ending them), Delete Message to be implemented.
                              </CardContent>
                            </Card>

                          </CardContent>
                        </Card>
                      </ScrollArea>
                    )}
                     {!isModerator && !checkingModStatus && !modCheckError && isEnlargeModalOpen && stream.type === 'live' && ( // Display if not moderator, not checking, and no error
                        <div className="flex-shrink-0 p-3 border-t bg-card text-card-foreground text-center">
                            <p className="text-sm text-muted-foreground">You are not a moderator for {stream.user_name}. Moderation tools are unavailable.</p>
                        </div>
                    )}
                </>
            )}
          </div>

          {/* Right side: Chat */}
          <div className="flex-shrink-0 sm:w-[350px] h-full flex flex-col border-l bg-card relative z-[2]"> {/* Explicit z-index */}
             {isEnlargeModalOpen && stream.type === 'live' && parentDomain && (
                <iframe
                    key={`chat-enlarged-${stream.user_login}-${parentDomain}`}
                    src={`https://www.twitch.tv/embed/${stream.user_login}/chat?parent=${parentDomain}&darkpopout`}
                    width="100%"
                    height="100%"
                    frameBorder="0"
                    scrolling="yes"
                    title={`Twitch Chat - ${stream.user_login}`}
                    className="w-full h-full min-h-[200px]"
                ></iframe>
            )}
            {isEnlargeModalOpen && stream.type !== 'live' && (
                <div className="flex-grow flex items-center justify-center bg-card rounded-md">
                    <p className="text-muted-foreground">Chat is unavailable for offline streams.</p>
                </div>
            )}
             {!parentDomain && isEnlargeModalOpen && stream.type === 'live' && (
                 <div className="flex-grow flex items-center justify-center bg-card rounded-md">
                    <Loader2 className="h-6 w-6 mr-2 animate-spin text-primary" />
                    <p className="text-muted-foreground">Initializing chat...</p>
                </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
      <CreatePollDialog stream={stream} currentUser={currentUser} isOpen={isPollDialogOpen} onOpenChange={setIsPollDialogOpen} />
      <CreatePredictionDialog stream={stream} currentUser={currentUser} isOpen={isPredictionDialogOpen} onOpenChange={setIsPredictionDialogOpen} />
    </Card>
  );
});

StreamCard.displayName = 'StreamCard';

