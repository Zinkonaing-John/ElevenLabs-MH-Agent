import VoiceChat from "@/components/VoiceComponent";

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-5xl font-bold bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 bg-clip-text text-transparent mb-4">
            AI Voice Assistant
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto">
            Experience the future of conversation with our AI-powered voice assistant. 
            Built with Next.js and powered by ElevenLabs.
          </p>
        </div>

        {/* Main Component */}
        <VoiceChat />

        {/* Footer Info */}
        <div className="mt-12 text-center text-gray-500">
          <p className="text-sm">
            Make sure to configure your ElevenLabs Agent ID in the .env.local file
          </p>
          <p className="text-xs mt-2">
            Built with ❤️ using Next.js, React, and ElevenLabs
          </p>
        </div>
      </div>
    </main>
  );
}
