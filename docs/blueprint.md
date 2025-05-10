# **App Name**: TwitchEye

## Core Features:

- Active Stream Display: Display only active Twitch streams and their current status (live).
- Stream Loading & Headless Mode: Automatically load active followed streams in 160p with a headless mode option.
- Headless Status Indicators: Stream status indicators for headless mode (active, paused, running ads).
- System Monitoring: Display active stream count, memory usage, and session size information.
- Stream Ignoring and Logging: Display application logs with a cutoff (default 7 days) and configuration for ignoring specific streams. Provide button for manually refresh all stream info and to add the selected stream to ignore list
- Stream Re-ordering: Add ability to re-arrange stream order by drag and drop.
- AI Stream Summaries: Utilize LLM to generate stream summaries, allowing users to quickly understand the gist of a stream before tuning in.
- AI Stream Still Previews: Add ability to show stream preview stills using LLM to identify the most interesting sections of a VOD, before deciding where to tune in to.
- Automatic Stream Purging: Detect if the Streamer is offline or has ended the stream, automatically remove inactive streams from the display.
- UI Customization: Allow users to customize the UI, such as font size, color scheme, and layout, to suit their preferences.
- Enhanced Error Handling: Implement robust error handling and logging to quickly identify and address issues, including detailed logging of Twitch API responses.

## Style Guidelines:

- Dark theme for reduced eye strain.
- Accent color: Teal (#008080) for highlighting active elements and key information.
- Easy-to-read, clear font for log messages and stream information.
- Clean and organized layout for stream list, status indicators, and system monitoring information.
- Smooth transitions for loading and refreshing stream data.
- Consistent and intuitive icons for stream status, actions, and settings.
- Responsive design that adapts to different window sizes and screen resolutions for optimal viewing.