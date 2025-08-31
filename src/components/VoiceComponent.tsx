"use client";

import React, { useEffect, useState, useCallback } from "react";

// ElevenLabs
import { useConversation } from "@11labs/react";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Mic,
  MicOff,
  Volume2,
  VolumeX,
  AlertCircle,
  CheckCircle,
  Loader2,
  Settings,
  HelpCircle,
  RefreshCw,
  Phone,
} from "lucide-react";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

interface VoiceChatProps {
  isDarkMode: boolean;
}

const VoiceChat = ({ isDarkMode }: VoiceChatProps) => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastError, setLastError] = useState("");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      setErrorMessage("");
      setIsLoading(false);
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      setIsLoading(false);
    },
    onMessage: (message) => {
      console.log("Received message:", message);
    },
    onError: (error: string | Error) => {
      const errorMsg = typeof error === "string" ? error : error.message;
      setErrorMessage(errorMsg);
      setLastError(errorMsg);
      setIsLoading(false);
      setConnectionAttempts((prev) => prev + 1);
      console.error("Error:", error);
    },
  });

  const { status, isSpeaking } = conversation;

  // Status configuration for better visual feedback
  const getStatusConfig = useCallback((): StatusConfig => {
    switch (status) {
      case "connected":
        return {
          label: "Connected",
          color: "text-green-400",
          bgColor: isDarkMode ? "bg-green-900/20" : "bg-green-100/50",
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case "connecting":
        return {
          label: "Connecting...",
          color: "text-yellow-400",
          bgColor: isDarkMode ? "bg-yellow-900/20" : "bg-yellow-100/50",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
        };
      case "disconnected":
      default:
        return {
          label: "Disconnected",
          color: isDarkMode ? "text-gray-400" : "text-gray-600",
          bgColor: isDarkMode ? "bg-gray-900/20" : "bg-gray-100/50",
          icon: (
            <div className="relative">
              <div className="w-4 h-4 border-2 border-gray-400 rounded-full animate-pulse"></div>
              <div className="absolute inset-0 w-4 h-4 border-2 border-gray-400 rounded-full animate-ping opacity-75"></div>
            </div>
          ),
        };
    }
  }, [status, isDarkMode]);

  const statusConfig = getStatusConfig();

  // Request microphone permission
  const requestMicPermission = useCallback(async () => {
    if (permissionRequested) return;

    setPermissionRequested(true);
    setIsRequestingPermission(true);
    try {
      await navigator.mediaDevices.getUserMedia({ audio: true });
      setHasPermission(true);
      setErrorMessage("");
    } catch (error) {
      setHasPermission(false);
      setErrorMessage(
        "Microphone access denied. Please allow microphone permissions in your browser."
      );
      console.error("Error accessing microphone:", error);
    } finally {
      setIsRequestingPermission(false);
    }
  }, [permissionRequested]);

  // Auto-request permission on mount
  useEffect(() => {
    requestMicPermission();
  }, [requestMicPermission]);

  // Clear error when status changes
  useEffect(() => {
    if (status === "connected") {
      setErrorMessage("");
    }
  }, [status]);

  const handleStartConversation = async () => {
    try {
      setIsLoading(true);
      setErrorMessage("");

      // Check if agent ID is configured
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId || agentId === "xxx") {
        throw new Error(
          "ElevenLabs Agent ID not configured. Please check your .env.local file."
        );
      }

      // Check if conversation is already connected
      if (status === "connected") {
        throw new Error("Conversation already in progress");
      }

      const conversationId = await conversation.startSession({
        agentId: agentId,
      });
      console.log("Started conversation:", conversationId);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to start conversation";
      setErrorMessage(errorMsg);
      setIsLoading(false);
      console.error("Error starting conversation:", error);
    }
  };

  const handleEndConversation = async () => {
    try {
      setIsLoading(true);
      await conversation.endSession();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to end conversation";
      setErrorMessage(errorMsg);
      setIsLoading(false);
      console.error("Error ending conversation:", error);
    }
  };

  const toggleMute = async () => {
    try {
      await conversation.setVolume({ volume: isMuted ? 1 : 0 });
      setIsMuted(!isMuted);
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to change volume";
      setErrorMessage(errorMsg);
      console.error("Error changing volume:", error);
    }
  };

  const retryPermission = () => {
    setPermissionRequested(false);
    setErrorMessage("");
    requestMicPermission();
  };

  const clearError = () => {
    setErrorMessage("");
  };

  const retryConnection = async () => {
    if (status === "connected") return;

    setErrorMessage("");
    setConnectionAttempts(0);
    await handleStartConversation();
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
  };

  return (
    <div className="w-full space-y-6">
      {/* Main Voice Chat Card */}
      <Card
        className={`w-full backdrop-blur-sm ${
          isDarkMode
            ? "bg-gray-900/50 border-gray-700"
            : "bg-white/80 border-gray-300 shadow-lg"
        }`}
      >
        <CardHeader className="pb-4">
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full overflow-hidden shadow-lg">
                <img
                  src={isDarkMode ? "/Bloom02.png" : "/Bloom01.png"}
                  alt="Bloom Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div>
                <h1
                  className={`text-xl font-semibold ${
                    isDarkMode ? "text-white" : "text-gray-900"
                  }`}
                >
                  Mental Health Voice Assistant
                </h1>
                <p
                  className={`text-sm ${
                    isDarkMode ? "text-gray-400" : "text-gray-600"
                  }`}
                >
                  Powered by Pioneer Team
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowHelp(!showHelp)}
                className={`${
                  isDarkMode
                    ? "hover:bg-gray-800 hover:border-gray-600 text-gray-400 border-gray-700"
                    : "hover:bg-gray-100 hover:border-gray-400 text-gray-600 border-gray-300"
                }`}
              >
                <HelpCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={toggleMute}
                disabled={status !== "connected"}
                className={`${
                  isDarkMode
                    ? "hover:bg-gray-800 hover:border-gray-600 text-gray-400 border-gray-700"
                    : "hover:bg-gray-100 hover:border-gray-400 text-gray-600 border-gray-300"
                }`}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
            </div>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-6">
          {/* Language Selection */}
          <div className="mb-6">
            <h3
              className={`text-sm font-medium mb-3 ${
                isDarkMode ? "text-gray-300" : "text-gray-700"
              }`}
            >
              Proviced Language : Just Communicate with your preferred language
            </h3>
            <div className="flex gap-3 flex-wrap">
              {/* English */}
              <button
                className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-600 hover:border-blue-500"
                    : "bg-gray-100/50 border-gray-300 hover:border-blue-500"
                }`}
              >
                <div className="text-2xl">🇺🇸</div>
                <div
                  className={`text-xs mt-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  English
                </div>
              </button>

              {/* Korean */}
              <button
                className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-600 hover:border-blue-500"
                    : "bg-gray-100/50 border-gray-300 hover:border-blue-500"
                }`}
              >
                <div className="text-2xl">🇰🇷</div>
                <div
                  className={`text-xs mt-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Korean
                </div>
              </button>

              {/* Chinese */}
              <button
                className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-600 hover:border-blue-500"
                    : "bg-gray-100/50 border-gray-300 hover:border-blue-500"
                }`}
              >
                <div className="text-2xl">🇨🇳</div>
                <div
                  className={`text-xs mt-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Chinese
                </div>
              </button>

              {/* Japanese */}
              <button
                className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-600 hover:border-blue-500"
                    : "bg-gray-100/50 border-gray-300 hover:border-blue-500"
                }`}
              >
                <div className="text-2xl">🇯🇵</div>
                <div
                  className={`text-xs mt-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Japanese
                </div>
              </button>

              {/* Vietnamese */}
              <button
                className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-600 hover:border-blue-500"
                    : "bg-gray-100/50 border-gray-300 hover:border-blue-500"
                }`}
              >
                <div className="text-2xl">🇻🇳</div>
                <div
                  className={`text-xs mt-1 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Vietnamese
                </div>
              </button>
            </div>
          </div>

          {/* Connection Summary */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-gray-100/50 border-gray-300"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  hasPermission ? "bg-green-500" : "bg-red-500"
                }`}
              ></div>
              <span
                className={`text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {hasPermission ? "Microphone Ready" : "Microphone Required"}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-gray-100/50 border-gray-300"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  status === "connected"
                    ? "bg-green-500"
                    : status === "connecting"
                    ? "bg-yellow-500"
                    : "bg-gray-400"
                }`}
              ></div>
              <span
                className={`text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {status === "connected"
                  ? "AI Connected"
                  : status === "connecting"
                  ? "Connecting..."
                  : "AI Disconnected"}
              </span>
            </div>
            <div
              className={`flex items-center gap-2 p-3 rounded-lg border ${
                isDarkMode
                  ? "bg-gray-800/50 border-gray-700"
                  : "bg-gray-100/50 border-gray-300"
              }`}
            >
              <div
                className={`w-3 h-3 rounded-full ${
                  isMuted ? "bg-red-500" : "bg-green-500"
                }`}
              ></div>
              <span
                className={`text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                {isMuted ? "Audio Muted" : "Audio Active"}
              </span>
            </div>
          </div>

          {/* Status Indicator */}
          <div className="space-y-3">
            <div
              className={`flex items-center justify-center gap-3 p-4 rounded-lg ${
                statusConfig.bgColor
              } border border-opacity-20 ${statusConfig.color.replace(
                "text-",
                "border-"
              )}`}
            >
              {statusConfig.icon}
              <span className={`font-medium ${statusConfig.color}`}>
                {statusConfig.label}
              </span>
            </div>

            {/* Connection Progress */}
            {status === "connecting" && (
              <div className="space-y-2">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Connecting to AI...</span>
                  <span>Please wait</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full animate-pulse"
                    style={{ width: "60%" }}
                  ></div>
                </div>
              </div>
            )}

            {/* Disconnected Animation */}
            {status === "disconnected" && (
              <div className="space-y-3">
                <div className="flex justify-center">
                  <div className="relative">
                    {/* Outer pulsing ring */}
                    <div className="w-16 h-16 border-4 border-gray-400/30 rounded-full animate-ping"></div>
                    {/* Inner pulsing ring */}
                    <div className="absolute inset-2 w-12 h-12 border-4 border-gray-400/50 rounded-full animate-pulse"></div>
                    {/* Center dot */}
                    <div className="absolute inset-4 w-8 h-8 bg-gray-400 rounded-full animate-bounce"></div>
                  </div>
                </div>
                <div className="text-center">
                  <div
                    className={`text-sm ${
                      isDarkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    Ready to connect
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Main Action Button */}
          <div className="flex justify-center">
            {status === "connected" ? (
              <Button
                variant="destructive"
                onClick={handleEndConversation}
                disabled={isLoading}
                className="w-full max-w-xs h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-red-600 hover:bg-red-700 border-0"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Phone className="mr-2 h-5 w-5" />
                )}
                End Conversation
              </Button>
            ) : (
              <Button
                onClick={handleStartConversation}
                disabled={!hasPermission || isLoading}
                className="w-full max-w-xs h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed border-0"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Mic className="mr-2 h-5 w-5" />
                )}
                Start Conversation
              </Button>
            )}
          </div>

          {/* Status Messages */}
          <div className="space-y-3">
            {status === "connected" && (
              <div className="text-center p-3 bg-green-900/20 rounded-lg border border-green-700/30">
                <p className="text-green-400 font-medium">
                  {isSpeaking
                    ? "Agent is speaking..."
                    : "Listening for your voice..."}
                </p>

                {/* Speaking Wave Animation */}
                {isSpeaking && (
                  <div className="mt-3 flex justify-center items-center gap-1">
                    {[...Array(5)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isDarkMode ? "bg-green-400" : "bg-green-600"
                        }`}
                        style={{
                          height: `${Math.random() * 20 + 10}px`,
                          animation: `speaking-wave 1.2s ease-in-out infinite`,
                          animationDelay: `${i * 0.1}s`,
                        }}
                      ></div>
                    ))}
                  </div>
                )}

                {/* Listening Wave Animation */}
                {!isSpeaking && (
                  <div className="mt-3 flex justify-center items-center gap-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-1 rounded-full transition-all duration-300 ${
                          isDarkMode ? "bg-blue-400" : "bg-blue-600"
                        }`}
                        style={{
                          height: `${Math.random() * 15 + 8}px`,
                          animation: `listening-wave 2s ease-in-out infinite`,
                          animationDelay: `${i * 0.2}s`,
                        }}
                      ></div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Error Messages */}
            {errorMessage && (
              <div className="p-4 bg-red-900/20 rounded-lg border border-red-700/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <p className="text-red-400 font-medium">
                        Connection Error
                      </p>
                      {connectionAttempts > 0 && (
                        <span className="text-xs bg-red-800 text-red-200 px-2 py-1 rounded">
                          Attempt {connectionAttempts}
                        </span>
                      )}
                    </div>
                    <p className="text-red-300 text-sm mb-3">{errorMessage}</p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={retryConnection}
                        disabled={isLoading}
                        className="text-red-400 border-red-600 hover:bg-red-800/20"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry Connection
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={clearError}
                        className="text-red-400 hover:text-red-300 hover:bg-red-800/20"
                      >
                        Dismiss
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* Permission Warning */}
            {!hasPermission && permissionRequested && (
              <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/30">
                <div className="flex items-start gap-3">
                  <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-yellow-400 font-medium">
                      Microphone Access Required
                    </p>
                    <p className="text-yellow-300 text-sm mt-1">
                      {isRequestingPermission
                        ? "Requesting microphone access..."
                        : "Please allow microphone permissions in your browser to use voice chat."}
                    </p>
                  </div>
                  {!isRequestingPermission && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={retryPermission}
                      className="text-yellow-400 border-yellow-600 hover:bg-yellow-800/20"
                    >
                      <RefreshCw className="h-4 w-4 mr-1" />
                      Retry
                    </Button>
                  )}
                  {isRequestingPermission && (
                    <Loader2 className="h-5 w-5 text-yellow-400 animate-spin" />
                  )}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Help Section */}
      {showHelp && (
        <Card
          className={`backdrop-blur-sm ${
            isDarkMode
              ? "bg-gray-900/50 border-gray-700"
              : "bg-white/80 border-gray-300 shadow-lg"
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <HelpCircle className="h-5 w-5" />
              How to Use
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4 text-sm">
            <div className="grid gap-3">
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-gray-100/50 border-gray-300"
                }`}
              >
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  1
                </span>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                  Allow microphone access when prompted
                </p>
              </div>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-gray-100/50 border-gray-300"
                }`}
              >
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  2
                </span>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                  Click "Start Conversation" to begin
                </p>
              </div>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-gray-100/50 border-gray-300"
                }`}
              >
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  3
                </span>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                  Speak naturally - the AI will respond
                </p>
              </div>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-gray-100/50 border-gray-300"
                }`}
              >
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  4
                </span>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                  Use the volume button to mute/unmute
                </p>
              </div>
              <div
                className={`flex items-center gap-3 p-3 rounded-lg border ${
                  isDarkMode
                    ? "bg-gray-800/50 border-gray-700"
                    : "bg-gray-100/50 border-gray-300"
                }`}
              >
                <span className="w-6 h-6 bg-blue-600 text-white rounded-full flex items-center justify-center text-xs font-bold">
                  5
                </span>
                <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                  Click "End Conversation" when finished
                </p>
              </div>
            </div>
            <div
              className={`pt-4 border-t ${
                isDarkMode ? "border-gray-700" : "border-gray-300"
              }`}
            >
              <div
                className={`flex items-center gap-2 p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-800/50" : "bg-gray-100/50"
                }`}
              >
                <Settings className="h-4 w-4 text-blue-400" />
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceChat;
