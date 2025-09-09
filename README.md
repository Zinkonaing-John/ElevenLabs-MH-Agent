# Real-time Voice Assistant with Next.js and ElevenLabs

This project demonstrates how to build a real-time voice assistant using Next.js and the ElevenLabs Conversational SDK. Follow along with the YouTube tutorial to create your own AI-powered voice assistant.

## Prerequisites

- Node.js 18+
- ElevenLabs account with an Agent created
- Microphone access enabled in your browser

## Setup

1. **Clone and install dependencies:**

   ```bash
   npm install
   # or
   pnpm install
   ```

2. **Configure Environment Variables:**

   Create a `.env.local` file in the root directory:

   ```bash
   # Create the file manually or copy from example
   touch .env.local
   ```

   Add the following content to `.env.local` and replace `xxx` with your actual ElevenLabs Agent ID:

   ```env
   NEXT_PUBLIC_ELEVENLABS_AGENT_ID=your_actual_agent_id_here
   ```

   **To get your Agent ID:**

   - Go to [ElevenLabs Conversational AI](https://elevenlabs.io/app/conversational-ai)
   - Create a new agent or select an existing one
   - Copy the Agent ID from the agent's settings
   - The Agent ID should be a long string of characters (not "xxx")

3. **Run the development server:**

   ```bash
   npm run dev
   # or
   pnpm dev
   ```

4. **Open your browser:**
   Navigate to [http://localhost:3000](http://localhost:3000)

## Troubleshooting

### Common Errors

**"ElevenLabs Agent ID not configured"**

- Ensure you have created a `.env.local` file (not just `example.env.local`)
- Verify your Agent ID is correct and not set to "xxx"
- Restart your development server after making changes

**"Microphone access denied"**

- Allow microphone permissions in your browser
- Check if your microphone is working in other applications

**"Failed to start conversation"**

- Verify your Agent ID is valid
- Check your internet connection
- Ensure your ElevenLabs account has sufficient credits

**"Error starting conversation: {}" (Empty error object)**

- This usually indicates a configuration issue
- Check that your `.env.local` file exists and contains the correct Agent ID
- Ensure the Agent ID is not set to "xxx" or empty
- Restart your development server after making changes
- Check the browser console for more detailed error information

## Features

- Real-time voice conversation with AI agents
- Microphone permission handling
- Volume control and mute functionality
- Error handling and user feedback
- Responsive UI with Tailwind CSS

## Tech Stack

- **Frontend:** Next.js 15, React 19, TypeScript
- **Styling:** Tailwind CSS, Radix UI components
- **Voice AI:** ElevenLabs Conversational SDK
- **Icons:** Lucide React

## Learn More

- [ElevenLabs Documentation](https://docs.elevenlabs.io/)
- [Next.js Documentation](https://nextjs.org/docs)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)
# ElevenLabs-MH-Agent
