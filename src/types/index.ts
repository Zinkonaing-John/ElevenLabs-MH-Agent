export interface VoiceChatState {
  hasPermission: boolean;
  isMuted: boolean;
  errorMessage: string;
  isLoading: boolean;
  permissionRequested: boolean;
  showHelp: boolean;
  connectionAttempts: number;
  lastError: string;
  isRequestingPermission: boolean;
  selectedLanguage: string;
  isRetrying: boolean;
  retryCount: number;
  sessionStartTime: Date | null;
  showSettings: boolean;
  audioVolume: number;
  enableSoundEffects: boolean;
  enableHapticFeedback: boolean;
}

export interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon: React.ReactNode;
}

export interface VoiceChatProps {
  isDarkMode: boolean;
}


export interface AudioSettings {
  volume: number;
  enableSoundEffects: boolean;
  enableHapticFeedback: boolean;
}

export interface SessionInfo {
  startTime: Date;
  duration: number;
  messageCount: number;
}

export type ConnectionStatus = 'connected' | 'connecting' | 'disconnected' | 'error';

export type Language = 'English' | 'Korean' | 'Chinese' | 'Japanese' | 'Vietnamese';

export interface KeyboardShortcut {
  key: string;
  description: string;
  action: () => void;
  disabled?: boolean;
}
