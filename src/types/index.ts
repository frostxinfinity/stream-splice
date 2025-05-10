
// Represents user data from Twitch API
export interface User {
  id: string;                 // Twitch user ID
  login: string;              // Twitch login name
  display_name: string;       // Twitch display name
  profile_image_url?: string; // URL of the user's profile image
  email?: string;             // User's email (requires 'user:read:email' scope)
  user_id?: string; // Sometimes Twitch API returns user_id under User object in some contexts.
}

// Represents stream data from Twitch API
export interface Stream {
  id: string;                 // Stream ID
  user_id: string;            // ID of the user streaming
  user_login: string;         // Login name of the user streaming
  user_name: string;          // Display name of the user streaming
  game_id: string;            // ID of the game being played
  game_name: string;          // Name of the game being played
  type: 'live' | string;      // Stream type, typically "live"
  title: string;              // Title of the stream
  viewer_count: number;       // Number of viewers
  started_at: string;         // ISO 8601 timestamp of when the stream started
  language: string;           // Language of the stream
  thumbnail_url: string;      // URL of the thumbnail image (template, needs size)
  tag_ids?: string[];         // Array of tag IDs
  tags?: string[];            // (Not directly from API, but can be populated if needed)
  is_mature: boolean;         // Whether the stream is designated as mature
  
  // Client-side properties
  order: number;              // For custom re-ordering by the user
  isLive?: boolean; // Added to StreamCard, ensuring it's available
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  message: string;
  level: 'info' | 'warn' | 'error';
}

export interface AISummary {
  streamId: string;
  summaryText: string;
  keywords: string[];
}

export interface AIPreviewStill {
  id: string;
  timestamp: number; // VOD timestamp in seconds
  imageUrl: string;
  reason: string; // Why this still is interesting
}

export interface TwitchTokenResponse {
  access_token: string;
  expires_in: number;
  refresh_token?: string; 
  scope: string[];
  token_type: 'bearer';
}

// Represents a channel that a user moderates, from /moderation/channels endpoint
export interface ModeratedChannel {
  broadcaster_id: string;
  broadcaster_login: string;
  broadcaster_name: string;
}

// Represents a moderator of a channel, from /moderation/moderators endpoint
export interface TwitchModerator {
  user_id: string;
  user_login: string;
  user_name: string;
}


// Request body for Twitch's ban/timeout user endpoint
// POST /moderation/bans
export interface TwitchBanUserRequest {
  data: {
    user_id: string;          // The ID of the user to ban or timeout.
    duration?: number;        // The duration, in seconds, to timeout the user. If omitted, the user is banned. Max 1,209,600 (2 weeks).
    reason?: string;          // The reason for the ban or timeout. Max 500 chars.
  };
}

// Request body for Twitch's update chat settings endpoint
// PATCH /chat/settings
// This is the structure Twitch expects for the PATCH request body.
export interface TwitchChatSettingsRequest {
  emote_mode?: boolean;
  follower_mode?: boolean;
  follower_mode_duration?: number; // The UI should provide options that correspond to Twitch's allowed values (0 for 'any follower', 10, 30, 60, etc.)
  non_moderator_chat_delay?: boolean;
  non_moderator_chat_delay_duration?: number; // Specific values like 2, 4, 6 seconds
  slow_mode?: boolean;
  slow_mode_wait_time?: number; // Specific values like 3, 5, 10, ..., 120 seconds
  subscriber_mode?: boolean;
  unique_chat_mode?: boolean;
}


// Response body for Twitch's get/update chat settings endpoint
// This includes all fields Twitch might return for GET, and fields returned after PATCH.
export interface TwitchChatSettingsResponse {
  broadcaster_id: string;
  moderator_id: string; // The ID of the moderator that made the request to update the settings.
  emote_mode: boolean;
  follower_mode: boolean;
  follower_mode_duration: number | null; // Can be null if follower_mode is false
  non_moderator_chat_delay: boolean;
  non_moderator_chat_delay_duration: number | null; // Can be null if non_moderator_chat_delay is false
  slow_mode: boolean;
  slow_mode_wait_time: number | null; // Can be null if slow_mode is false
  subscriber_mode: boolean;
  unique_chat_mode: boolean;
}


// Request body for sending a whisper
export interface TwitchWhisperRequest {
  message: string;
}

// Represents a chatter in a Twitch channel
export interface TwitchChatter {
  user_id: string;
  user_login: string;
  user_name: string;
}

// Twitch Poll API Types
export interface TwitchPollChoiceRequest {
  title: string; // Max 25 chars
}

export interface TwitchPollRequest {
  broadcaster_id: string;
  title: string; // Max 60 chars
  choices: TwitchPollChoiceRequest[]; // 2-5 choices
  duration: number; // Seconds, 15-1800
  channel_points_voting_enabled?: boolean;
  channel_points_per_vote?: number; // Min 1, if channel_points_voting_enabled is true
}

export interface TwitchPollChoiceResponse extends TwitchPollChoiceRequest {
  id: string;
  votes: number;
  channel_points_votes: number;
  bits_votes: number; // Not used for creation, but part of response
}

export interface TwitchPollResponse extends Omit<TwitchPollRequest, 'choices'> {
  id: string;
  choices: TwitchPollChoiceResponse[];
  status: 'ACTIVE' | 'COMPLETED' | 'TERMINATED' | 'ARCHIVED' | 'MODERATED' | 'INVALID';
  started_at: string; // ISO 8601 timestamp
  // Other fields from Twitch response if needed
}

export interface TwitchEndPollRequest {
  broadcaster_id: string;
  id: string; // Poll ID
  status: 'TERMINATED' | 'ARCHIVED';
}


// Twitch Prediction API Types
export interface TwitchPredictionOutcomeRequest {
  title: string; // Max 25 chars
}
export interface TwitchPredictionRequest {
  broadcaster_id: string;
  title: string; // Max 45 chars
  outcomes: TwitchPredictionOutcomeRequest[]; // Exactly 2 outcomes
  prediction_window: number; // Seconds, 30-1800
}

export interface TwitchPredictionOutcomeResponse extends TwitchPredictionOutcomeRequest {
  id: string;
  users: number;
  channel_points: number;
  top_predictors?: Array<{
    user_id: string;
    user_login: string;
    user_name: string;
    channel_points_won: number | null;
    channel_points_used: number;
  }>;
  color: 'BLUE' | 'PINK'; // Or other if Twitch adds more
}

export interface TwitchPredictionResponse extends Omit<TwitchPredictionRequest, 'outcomes'> {
  id: string;
  outcomes: TwitchPredictionOutcomeResponse[];
  status: 'ACTIVE' | 'RESOLVED' | 'CANCELED' | 'LOCKED';
  created_at: string; // ISO 8601 timestamp
  ended_at?: string; // ISO 8601 timestamp
  locked_at?: string; // ISO 8601 timestamp
  // Other fields from Twitch response if needed
}

export interface TwitchEndPredictionRequest {
  broadcaster_id: string;
  id: string; // Prediction ID
  status: 'RESOLVED' | 'CANCELED' | 'LOCKED';
  winning_outcome_id?: string; // Required if status is RESOLVED
}
