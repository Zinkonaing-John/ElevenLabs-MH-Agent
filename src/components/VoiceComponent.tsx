"use client";

import React, { useEffect, useState, useCallback } from "react";

// ElevenLabs
import { useConversation } from "@11labs/react";

// UI
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
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
} from "lucide-react";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

const VoiceChat = () => {
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastError, setLastError] = useState("");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);

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
          color: "text-green-600",
          bgColor: "bg-green-100",
          icon: <CheckCircle className="h-4 w-4" />,
        };
      case "connecting":
        return {
          label: "Connecting...",
          color: "text-yellow-600",
          bgColor: "bg-yellow-100",
          icon: <Loader2 className="h-4 w-4 animate-spin" />,
        };
      case "disconnected":
      default:
        return {
          label: "Disconnected",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
          icon: <AlertCircle className="h-4 w-4" />,
        };
    }
  }, [status]);

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

  return (
    <TooltipProvider>
      <div className="w-full max-w-2xl mx-auto space-y-6">
        {/* Main Voice Chat Card */}
        <Card className="w-full shadow-lg border-0 bg-gradient-to-br from-white to-gray-50 transition-all duration-300 hover:shadow-xl">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="p-3 bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-md">
                  <Mic className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                    Voice Assistant
                  </h1>
                  <p className="text-sm text-gray-500">
                    Powered by ElevenLabs AI
                  </p>
                </div>
              </div>
              <div className="flex gap-2">
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => setShowHelp(!showHelp)}
                      className="hover:bg-blue-50 hover:border-blue-200"
                    >
                      <HelpCircle className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Help & Instructions</p>
                  </TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={toggleMute}
                      disabled={status !== "connected"}
                      className="hover:bg-green-50 hover:border-green-200"
                    >
                      {isMuted ? (
                        <VolumeX className="h-4 w-4" />
                      ) : (
                        <Volume2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>{isMuted ? "Unmute audio" : "Mute audio"}</p>
                  </TooltipContent>
                </Tooltip>
              </div>
            </CardTitle>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Connection Summary */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div
                  className={`w-3 h-3 rounded-full ${
                    hasPermission ? "bg-green-500" : "bg-red-500"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {hasPermission ? "Microphone Ready" : "Microphone Required"}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div
                  className={`w-3 h-3 rounded-full ${
                    status === "connected"
                      ? "bg-green-500"
                      : status === "connecting"
                      ? "bg-yellow-500"
                      : "bg-gray-400"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {status === "connected"
                    ? "AI Connected"
                    : status === "connecting"
                    ? "Connecting..."
                    : "AI Disconnected"}
                </span>
              </div>
              <div className="flex items-center gap-2 p-3 bg-gray-50 rounded-lg">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isMuted ? "bg-red-500" : "bg-green-500"
                  }`}
                ></div>
                <span className="text-sm font-medium">
                  {isMuted ? "Audio Muted" : "Audio Active"}
                </span>
              </div>
            </div>

            {/* Status Indicator */}
            <div className="space-y-3">
              <div
                className={`flex items-center justify-center gap-3 p-4 rounded-lg ${
                  statusConfig.bgColor
                } border-2 border-opacity-20 ${statusConfig.color.replace(
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
                  <div className="flex justify-between text-sm text-gray-600">
                    <span>Connecting to AI...</span>
                    <span>Please wait</span>
                  </div>
                  <Progress value={undefined} className="h-2" />
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
                  className="w-full max-w-xs h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700"
                >
                  {isLoading ? (
                    <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                  ) : (
                    <MicOff className="mr-2 h-5 w-5" />
                  )}
                  End Conversation
                </Button>
              ) : (
                <Button
                  onClick={handleStartConversation}
                  disabled={!hasPermission || isLoading}
                  className="w-full max-w-xs h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
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
                <div className="text-center p-3 bg-green-50 rounded-lg border border-green-200">
                  <p className="text-green-700 font-medium">
                    {isSpeaking
                      ? "🎤 Agent is speaking..."
                      : "👂 Listening for your voice..."}
                  </p>
                </div>
              )}

              {/* Error Messages */}
              {errorMessage && (
                <div className="p-4 bg-red-50 rounded-lg border border-red-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <p className="text-red-700 font-medium">
                          Connection Error
                        </p>
                        {connectionAttempts > 0 && (
                          <Badge variant="secondary" className="text-xs">
                            Attempt {connectionAttempts}
                          </Badge>
                        )}
                      </div>
                      <p className="text-red-600 text-sm mb-3">
                        {errorMessage}
                      </p>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={retryConnection}
                          disabled={isLoading}
                          className="text-red-600 border-red-300 hover:bg-red-100"
                        >
                          <RefreshCw className="h-4 w-4 mr-1" />
                          Retry Connection
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={clearError}
                          className="text-red-600 hover:text-red-700 hover:bg-red-100"
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
                <div className="p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="flex items-start gap-3">
                    <AlertCircle className="h-5 w-5 text-yellow-500 mt-0.5 flex-shrink-0" />
                    <div className="flex-1">
                      <p className="text-yellow-700 font-medium">
                        Microphone Access Required
                      </p>
                      <p className="text-yellow-600 text-sm mt-1">
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
                        className="text-yellow-600 border-yellow-300 hover:bg-yellow-100"
                      >
                        <RefreshCw className="h-4 w-4 mr-1" />
                        Retry
                      </Button>
                    )}
                    {isRequestingPermission && (
                      <Loader2 className="h-5 w-5 text-yellow-500 animate-spin" />
                    )}
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Help Section */}
        {showHelp && (
          <Card className="shadow-lg border-0 bg-gradient-to-br from-blue-50 to-indigo-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-blue-800">
                <HelpCircle className="h-5 w-5" />
                How to Use
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm text-gray-700">
              <div className="grid gap-3">
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                  <Badge variant="info" className="flex-shrink-0">
                    1
                  </Badge>
                  <p>Allow microphone access when prompted</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                  <Badge variant="info" className="flex-shrink-0">
                    2
                  </Badge>
                  <p>Click "Start Conversation" to begin</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                  <Badge variant="info" className="flex-shrink-0">
                    3
                  </Badge>
                  <p>Speak naturally - the AI will respond</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                  <Badge variant="info" className="flex-shrink-0">
                    4
                  </Badge>
                  <p>Use the volume button to mute/unmute</p>
                </div>
                <div className="flex items-center gap-3 p-3 bg-white rounded-lg border border-blue-100">
                  <Badge variant="info" className="flex-shrink-0">
                    5
                  </Badge>
                  <p>Click "End Conversation" when finished</p>
                </div>
              </div>
              <div className="pt-4 border-t border-blue-200">
                <div className="flex items-center gap-2 p-3 bg-blue-100 rounded-lg">
                  <Settings className="h-4 w-4 text-blue-600" />
                  <p className="text-xs text-blue-700">
                    Make sure you have a valid ElevenLabs Agent ID configured in
                    your .env.local file.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
};

export default VoiceChat;
