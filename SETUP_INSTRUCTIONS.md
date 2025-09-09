# ElevenLabs Voice Chat Setup Instructions

## Quick Fix for WebSocket Connection Error

The WebSocket connection error you're experiencing is likely due to missing ElevenLabs configuration. Here's how to fix it:

### 1. Create Environment File

Create a `.env.local` file in the project root (`ElevenLabs-MH-Agent` folder) with the following content:

```env
# ElevenLabs Configuration
NEXT_PUBLIC_ELEVENLABS_AGENT_ID=xxx
```

### 2. Get Your ElevenLabs Agent ID

1. Go to [ElevenLabs Console](https://elevenlabs.io/app/conversational-ai)
2. Sign in to your account
3. Create a new agent or select an existing one
4. Copy the Agent ID from the agent settings
5. Replace `xxx` in your `.env.local` file with the actual Agent ID

### 3. Restart Development Server

After updating the `.env.local` file:

```bash
npm run dev
```

## What I Fixed

✅ **Fixed Next.js viewport metadata warning** - Moved viewport configuration to separate export
✅ **Enhanced WebSocket error handling** - Added specific handling for CloseEvent errors
✅ **Improved error messages** - Better user-friendly error messages with specific guidance
✅ **Added Agent ID validation** - Validates ElevenLabs Agent ID format
✅ **Enhanced retry mechanism** - Added exponential backoff with jitter for connection retries
✅ **Better debugging** - Enhanced debug configuration function

## Troubleshooting

If you still experience issues:

1. **Check the console** - Click the debug button (⚠️) to see detailed configuration info
2. **Verify Agent ID format** - Should be 37 characters starting with `xagent_`
3. **Check internet connection** - WebSocket requires stable connection
4. **Try refreshing the page** - Sometimes helps with connection issues

## Features

- 🎤 Voice conversation with AI
- 🌍 Multi-language support (English, Korean, Chinese, Japanese, Vietnamese)
- 🔊 Audio controls and volume adjustment
- ⌨️ Keyboard shortcuts (Space to start, Esc to end, M to mute)
- 🔄 Automatic retry with exponential backoff
- 📱 Mobile-friendly with haptic feedback
- 🎨 Dark/light mode support

The app should now work properly once you configure the ElevenLabs Agent ID!
