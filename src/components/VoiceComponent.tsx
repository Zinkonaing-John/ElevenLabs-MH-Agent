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
  Phone,
  RefreshCw,
  Pause,
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
  const [isPaused, setIsPaused] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [permissionRequested, setPermissionRequested] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [connectionAttempts, setConnectionAttempts] = useState(0);
  const [lastError, setLastError] = useState("");
  const [isRequestingPermission, setIsRequestingPermission] = useState(false);
  const [selectedLanguage, setSelectedLanguage] = useState("English");
  const [isRetrying, setIsRetrying] = useState(false);
  const [retryCount, setRetryCount] = useState(0);
  const [sessionStartTime, setSessionStartTime] = useState<Date | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [audioVolume, setAudioVolume] = useState(1);
  const [enableSoundEffects, setEnableSoundEffects] = useState(true);
  const [enableHapticFeedback, setEnableHapticFeedback] = useState(true);

  // Check if ElevenLabs is properly configured
  const isElevenLabsConfigured = () => {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    return agentId && agentId !== "xxx";
  };

  // Debug function to help troubleshoot configuration issues
  const debugConfiguration = () => {
    const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
    console.log("=== ElevenLabs Configuration Debug ===");
    console.log("Agent ID:", agentId);
    console.log("Has Agent ID:", !!agentId);
    console.log("Agent ID Length:", agentId?.length || 0);
    console.log("Is Default Value:", agentId === "xxx");
    console.log("Is Configured:", isElevenLabsConfigured());
    console.log("Environment:", process.env.NODE_ENV);
    console.log("=====================================");
  };

  const conversation = useConversation({
    onConnect: () => {
      console.log("Connected to ElevenLabs");
      setErrorMessage("");
      setIsLoading(false);
      setIsRetrying(false);
      setRetryCount(0);
      setSessionStartTime(new Date());
      setIsPaused(false);
    },
    onDisconnect: () => {
      console.log("Disconnected from ElevenLabs");
      setIsLoading(false);
      setSessionStartTime(null);
      setIsPaused(false);
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

  const playSound = (type: 'start' | 'end' | 'error' | 'mute' | 'unmute') => {
    if (!enableSoundEffects) return;
    
    // Create audio context for sound effects
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    // Different frequencies for different sounds
    const frequencies = {
      start: 440, // A4
      end: 220,   // A3
      error: 150, // Low frequency
      mute: 330,  // E4
      unmute: 550 // C#5
    };
    
    oscillator.frequency.setValueAtTime(frequencies[type], audioContext.currentTime);
    gainNode.gain.setValueAtTime(0, audioContext.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.1 * audioVolume, audioContext.currentTime + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, audioContext.currentTime + 0.3);
    
    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  };

  const triggerHaptic = (type: 'light' | 'medium' | 'heavy' = 'light') => {
    if (!enableHapticFeedback || !navigator.vibrate) return;
    
    const patterns = {
      light: [10],
      medium: [20],
      heavy: [50, 50, 50]
    };
    
    navigator.vibrate(patterns[type]);
  };

  const handleStartConversation = async () => {
    try {
      console.log("=== Starting conversation ===");
      console.log("Agent ID:", process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID);
      console.log("Status:", status);
      console.log("Has Permission:", hasPermission);
      
      setIsLoading(true);
      setErrorMessage("");
      playSound('start');
      triggerHaptic('light');

      // Check if agent ID is configured
      const agentId = process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID;
      if (!agentId || agentId === "xxx") {
        throw new Error(
          "ElevenLabs Agent ID not configured. Please:\n1. Go to https://elevenlabs.io/app/conversational-ai\n2. Create or select an agent\n3. Copy the Agent ID\n4. Replace 'xxx' in your .env.local file with the actual Agent ID\n5. Restart your development server"
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
      // Enhanced error logging for debugging
      console.error("Error starting conversation:");
      console.error("Raw error object:", error);
      console.error("Error type:", typeof error);
      console.error("Error constructor:", error?.constructor?.name || 'Unknown');
      console.error("Error string:", String(error));
      console.error("Error keys:", error && typeof error === 'object' ? Object.keys(error) : []);
      
      // Handle completely empty or undefined errors
      if (!error) {
        console.error("ERROR: Caught error is null, undefined, or empty!");
      }
      
      // Try to extract error message
      let errorMessage = "Unknown error";
      if (error instanceof Error) {
        errorMessage = error.message;
        console.error("Error message:", error.message);
        console.error("Error stack:", error.stack);
      } else if (typeof error === 'string') {
        errorMessage = error;
        console.error("String error:", error);
      } else if (error && typeof error === 'object') {
        console.error("Object error properties:");
        for (const [key, value] of Object.entries(error)) {
          console.error(`  ${key}:`, value);
        }
        
        // Try to extract meaningful error information
        const errorObj = error as any;
        if (errorObj.message) {
          errorMessage = errorObj.message;
        } else if (errorObj.error) {
          errorMessage = errorObj.error;
        } else if (errorObj.reason) {
          errorMessage = errorObj.reason;
        } else if (errorObj.description) {
          errorMessage = errorObj.description;
        } else if (errorObj.details) {
          errorMessage = errorObj.details;
        } else {
          errorMessage = "An unknown error occurred. Check console for details.";
        }
      }
      
      // Additional debugging info
      console.error("=== Configuration Debug ===");
      console.error("Agent ID:", process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID);
      console.error("Has Agent ID:", !!process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID);
      console.error("Agent ID Length:", process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID?.length || 0);
      console.error("Is Default Value:", process.env.NEXT_PUBLIC_ELEVENLABS_AGENT_ID === 'xxx');
      console.error("Current Status:", status);
      console.error("Has Permission:", hasPermission);
      console.error("==========================");

      // Use the error message we extracted above
      let errorMsg = errorMessage;

      // Add specific guidance based on error type
      if (errorMsg.includes('Agent ID') || errorMsg.includes('configuration')) {
        errorMsg += "\n\nPlease check your .env.local file and ensure NEXT_PUBLIC_ELEVENLABS_AGENT_ID is set correctly.";
      } else if (errorMsg.includes('permission') || errorMsg.includes('microphone')) {
        errorMsg += "\n\nPlease allow microphone access in your browser.";
      } else if (errorMsg.includes('network') || errorMsg.includes('connection')) {
        errorMsg += "\n\nPlease check your internet connection and try again.";
      } else if (errorMsg === "Unknown error" || errorMsg === "An unknown error occurred. Check console for details.") {
        errorMsg += "\n\nThis might be a configuration issue. Please:\n1. Check your .env.local file\n2. Ensure your Agent ID is correct\n3. Restart your development server\n4. Check the console for detailed error information";
      }

      setErrorMessage(errorMsg);
      setIsLoading(false);
      playSound('error');
      triggerHaptic('heavy');
    }
  };

  const handleEndConversation = async () => {
    try {
      setIsLoading(true);
      playSound('end');
      triggerHaptic('medium');
      await conversation.endSession();
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to end conversation";
      setErrorMessage(errorMsg);
      setIsLoading(false);
      playSound('error');
      triggerHaptic('heavy');
      console.error("Error ending conversation:", error);
    }
  };

  const toggleMute = async () => {
    try {
      await conversation.setVolume({ volume: isMuted ? 1 : 0 });
      setIsMuted(!isMuted);
      playSound(isMuted ? 'unmute' : 'mute');
      triggerHaptic('light');
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to change volume";
      setErrorMessage(errorMsg);
      playSound('error');
      triggerHaptic('heavy');
      console.error("Error changing volume:", error);
    }
  };

  const togglePause = async () => {
    try {
      await conversation.toggleAudio();
      setIsPaused(!isPaused);
      triggerHaptic('light');
    } catch (error) {
      const errorMsg =
        error instanceof Error ? error.message : "Failed to toggle audio";
      setErrorMessage(errorMsg);
      playSound('error');
      triggerHaptic('heavy');
      console.error("Error toggling audio:", error);
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

    setIsRetrying(true);
    setRetryCount(prev => prev + 1);
    setErrorMessage("");
    setConnectionAttempts(0);
    
    // Add exponential backoff for retries
    const delay = Math.min(1000 * Math.pow(2, retryCount), 10000);
    setTimeout(async () => {
      await handleStartConversation();
      setIsRetrying(false);
    }, delay);
  };

  const handleLanguageSelect = (language: string) => {
    setSelectedLanguage(language);
  };

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Prevent shortcuts when typing in input fields
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case ' ':
          event.preventDefault();
          if (status !== "connected" && hasPermission && !isLoading && !isRetrying) {
            handleStartConversation();
          }
          break;
        case 'Escape':
          if (status === "connected") {
            handleEndConversation();
          }
          break;
        case 'm':
        case 'M':
          if (status === "connected") {
            toggleMute();
          }
          break;
        case 'h':
        case 'H':
          setShowHelp(!showHelp);
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [status, hasPermission, isLoading, isRetrying, showHelp]);

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
                onClick={debugConfiguration}
                className={`${
                  isDarkMode
                    ? "hover:bg-gray-800 hover:border-gray-600 text-gray-400 border-gray-700"
                    : "hover:bg-gray-100 hover:border-gray-400 text-gray-600 border-gray-300"
                }`}
                aria-label="Debug configuration"
                title="Debug configuration (check console)"
              >
                <AlertCircle className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowSettings(!showSettings)}
                className={`${
                  isDarkMode
                    ? "hover:bg-gray-800 hover:border-gray-600 text-gray-400 border-gray-700"
                    : "hover:bg-gray-100 hover:border-gray-400 text-gray-600 border-gray-300"
                }`}
                aria-label={showSettings ? "Hide settings" : "Show settings"}
                title={showSettings ? "Hide settings" : "Show settings"}
              >
                <Settings className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setShowHelp(!showHelp)}
                className={`${
                  isDarkMode
                    ? "hover:bg-gray-800 hover:border-gray-600 text-gray-400 border-gray-700"
                    : "hover:bg-gray-100 hover:border-gray-400 text-gray-600 border-gray-300"
                }`}
                aria-label={showHelp ? "Hide help" : "Show help"}
                title={showHelp ? "Hide help" : "Show help"}
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
                aria-label={isMuted ? "Unmute audio" : "Mute audio"}
                title={isMuted ? "Unmute audio" : "Mute audio"}
              >
                {isMuted ? (
                  <VolumeX className="h-4 w-4" />
                ) : (
                  <Volume2 className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={togglePause}
                disabled={status !== "connected" || !isSpeaking}
                className={`${
                  isDarkMode
                    ? "hover:bg-gray-800 hover:border-gray-600 text-gray-400 border-gray-700"
                    : "hover:bg-gray-100 hover:border-gray-400 text-gray-600 border-gray-300"
                }`}
                aria-label={isPaused ? "Resume audio" : "Pause audio"}
                title={isPaused ? "Resume audio" : "Pause audio"}
              >
                {isPaused ? (
                  <Mic className="h-4 w-4" />
                ) : (
                  <Pause className="h-4 w-4" />
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
              Supported Languages: Communicate in your preferred language
            </h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2 sm:gap-3">
              {/* English */}
              <button
                onClick={() => handleLanguageSelect("English")}
                className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  selectedLanguage === "English"
                    ? isDarkMode
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-blue-100/50 border-blue-500"
                    : isDarkMode
                    ? "bg-gray-800/50 border-gray-600 hover:border-blue-500"
                    : "bg-gray-100/50 border-gray-300 hover:border-blue-500"
                }`}
                aria-label="Select English language"
              >
                <div className="w-8 h-5 mx-auto">
                  <img 
                    src="/flags/uk.png" 
                    alt="UK Flag" 
                    className="w-full h-full object-cover rounded-sm"
                  />
                </div>
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
                onClick={() => handleLanguageSelect("Korean")}
                className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  selectedLanguage === "Korean"
                    ? isDarkMode
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-blue-100/50 border-blue-500"
                    : isDarkMode
                    ? "bg-gray-800/50 border-gray-600 hover:border-blue-500"
                    : "bg-gray-100/50 border-gray-300 hover:border-blue-500"
                }`}
                aria-label="Select Korean language"
              >
                <div className="w-8 h-5 mx-auto">
                  <img 
                    src="/flags/kr.png" 
                    alt="Korean Flag" 
                    className="w-full h-full object-cover rounded-sm"
                  />
                </div>
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
                onClick={() => handleLanguageSelect("Chinese")}
                className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  selectedLanguage === "Chinese"
                    ? isDarkMode
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-blue-100/50 border-blue-500"
                    : isDarkMode
                    ? "bg-gray-800/50 border-gray-600 hover:border-blue-500"
                    : "bg-gray-100/50 border-gray-300 hover:border-blue-500"
                }`}
                aria-label="Select Chinese language"
              >
                <div className="w-8 h-5 mx-auto">
                  <img 
                    src="/flags/cn.png" 
                    alt="Chinese Flag" 
                    className="w-full h-full object-cover rounded-sm"
                  />
                </div>
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
                onClick={() => handleLanguageSelect("Japanese")}
                className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  selectedLanguage === "Japanese"
                    ? isDarkMode
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-blue-100/50 border-blue-500"
                    : isDarkMode
                    ? "bg-gray-800/50 border-gray-600 hover:border-blue-500"
                    : "bg-gray-100/50 border-gray-300 hover:border-blue-500"
                }`}
                aria-label="Select Japanese language"
              >
                <div className="w-8 h-5 mx-auto">
                  <img 
                    src="/flags/jp.png" 
                    alt="Japanese Flag" 
                    className="w-full h-full object-cover rounded-sm"
                  />
                </div>
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
                onClick={() => handleLanguageSelect("Vietnamese")}
                className={`p-2 rounded-lg border-2 transition-all duration-200 hover:scale-105 ${
                  selectedLanguage === "Vietnamese"
                    ? isDarkMode
                      ? "bg-blue-600/20 border-blue-500"
                      : "bg-blue-100/50 border-blue-500"
                    : isDarkMode
                    ? "bg-gray-800/50 border-gray-600 hover:border-blue-500"
                    : "bg-gray-100/50 border-gray-300 hover:border-blue-500"
                }`}
                aria-label="Select Vietnamese language"
              >
                <div className="w-8 h-5 mx-auto">
                  <img 
                    src="/flags/vn.png" 
                    alt="Vietnamese Flag" 
                    className="w-full h-full object-cover rounded-sm"
                  />
                </div>
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

          {/* Configuration Status */}
          {!isElevenLabsConfigured() && (
            <div className="p-4 bg-yellow-900/20 rounded-lg border border-yellow-700/30 mb-4">
              <div className="flex items-start gap-3">
                <AlertCircle className="h-5 w-5 text-yellow-400 mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <p className="text-yellow-400 font-medium mb-2">
                    ElevenLabs Configuration Required
                  </p>
                  <div className="text-yellow-300 text-sm space-y-1">
                    <p>1. Go to <a href="https://elevenlabs.io/app/conversational-ai" target="_blank" rel="noopener noreferrer" className="underline hover:text-yellow-200">ElevenLabs Console</a></p>
                    <p>2. Create or select an agent</p>
                    <p>3. Copy the Agent ID</p>
                    <p>4. Replace 'xxx' in your .env.local file</p>
                    <p>5. Restart your development server</p>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Connection Summary */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
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
              <div className="space-y-3">
                <div className="flex justify-between text-sm text-gray-400">
                  <span>Connecting to AI...</span>
                  <span>Please wait</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-gradient-to-r from-blue-500 to-cyan-500 h-2 rounded-full animate-pulse"
                    style={{ width: "60%" }}
                  ></div>
                </div>
                <div className="flex justify-center">
                  <div className="flex space-x-1">
                    {[...Array(3)].map((_, i) => (
                      <div
                        key={i}
                        className="w-2 h-2 bg-blue-500 rounded-full animate-bounce"
                        style={{ animationDelay: `${i * 0.1}s` }}
                      ></div>
                    ))}
                  </div>
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
                className="w-full max-w-xs h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-red-600 hover:bg-red-700 border-0 hover:scale-105 active:scale-95"
                aria-label="End conversation"
              >
                {isLoading ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Phone className="mr-2 h-5 w-5" />
                )}
                End Conversation
                <span className="ml-2 text-xs opacity-70">(Esc)</span>
              </Button>
            ) : (
              <Button
                onClick={handleStartConversation}
                disabled={!hasPermission || isLoading || isRetrying || !isElevenLabsConfigured()}
                className="w-full max-w-xs h-14 text-lg font-semibold shadow-lg hover:shadow-xl transition-all duration-200 bg-gradient-to-r from-blue-600 to-cyan-500 hover:from-blue-700 hover:to-cyan-600 disabled:opacity-50 disabled:cursor-not-allowed border-0 hover:scale-105 active:scale-95"
                aria-label="Start conversation"
              >
                {isLoading || isRetrying ? (
                  <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                ) : (
                  <Mic className="mr-2 h-5 w-5" />
                )}
                {isRetrying ? "Retrying..." : "Start Conversation"}
                <span className="ml-2 text-xs opacity-70">(Space)</span>
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


      {/* Settings Panel */}
      {showSettings && (
        <Card
          className={`backdrop-blur-sm ${
            isDarkMode
              ? "bg-gray-900/50 border-gray-700"
              : "bg-white/80 border-gray-300 shadow-lg"
          }`}
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-blue-400">
              <Settings className="h-5 w-5" />
              Settings
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Audio Volume */}
            <div className="space-y-3">
              <label
                className={`text-sm font-medium ${
                  isDarkMode ? "text-gray-300" : "text-gray-700"
                }`}
              >
                Audio Volume
              </label>
              <div className="flex items-center gap-3">
                <VolumeX className="h-4 w-4 text-gray-400" />
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.1"
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  className="flex-1 h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
                />
                <Volume2 className="h-4 w-4 text-gray-400" />
                <span
                  className={`text-sm w-12 text-right ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  {Math.round(audioVolume * 100)}%
                </span>
              </div>
            </div>

            {/* Sound Effects Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Sound Effects
                </label>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Play sounds for interactions
                </p>
              </div>
              <Button
                variant={enableSoundEffects ? "default" : "outline"}
                size="sm"
                onClick={() => setEnableSoundEffects(!enableSoundEffects)}
                className={enableSoundEffects ? "bg-blue-600" : ""}
              >
                {enableSoundEffects ? "On" : "Off"}
              </Button>
            </div>

            {/* Haptic Feedback Toggle */}
            <div className="flex items-center justify-between">
              <div>
                <label
                  className={`text-sm font-medium ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Haptic Feedback
                </label>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Vibration for mobile devices
                </p>
              </div>
              <Button
                variant={enableHapticFeedback ? "default" : "outline"}
                size="sm"
                onClick={() => setEnableHapticFeedback(!enableHapticFeedback)}
                className={enableHapticFeedback ? "bg-blue-600" : ""}
              >
                {enableHapticFeedback ? "On" : "Off"}
              </Button>
            </div>

            {/* Session Info */}
            {sessionStartTime && (
              <div
                className={`p-3 rounded-lg ${
                  isDarkMode ? "bg-gray-800/50" : "bg-gray-100/50"
                }`}
              >
                <h4
                  className={`text-sm font-medium mb-2 ${
                    isDarkMode ? "text-gray-300" : "text-gray-700"
                  }`}
                >
                  Session Information
                </h4>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Started: {sessionStartTime.toLocaleTimeString()}
                </p>
                <p
                  className={`text-xs ${
                    isDarkMode ? "text-gray-400" : "text-gray-500"
                  }`}
                >
                  Duration: {Math.floor((Date.now() - sessionStartTime.getTime()) / 1000 / 60)} minutes
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      )}

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
                <div className="flex-1">
                  <p className={isDarkMode ? "text-gray-300" : "text-gray-700"}>
                    <strong>Keyboard Shortcuts:</strong>
                  </p>
                  <div className="mt-2 space-y-1 text-xs">
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                      <kbd className="px-1 py-0.5 bg-gray-600 text-white rounded text-xs">Space</kbd> - Start conversation
                    </p>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                      <kbd className="px-1 py-0.5 bg-gray-600 text-white rounded text-xs">Esc</kbd> - End conversation
                    </p>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                      <kbd className="px-1 py-0.5 bg-gray-600 text-white rounded text-xs">M</kbd> - Toggle mute
                    </p>
                    <p className={isDarkMode ? "text-gray-400" : "text-gray-600"}>
                      <kbd className="px-1 py-0.5 bg-gray-600 text-white rounded text-xs">H</kbd> - Toggle help
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default VoiceChat;
