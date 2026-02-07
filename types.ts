
import React from 'react';

export type HomeworkType = 'TEXT' | 'PHOTO' | 'VIDEO' | 'FILE';

export interface Lesson {
  id: string;
  title: string;
  description: string;
  content: string;
  xpReward: number; 
  homeworkType: HomeworkType;
  homeworkTask: string;
  aiGradingInstruction: string;
  videoUrl?: string;
}

export type ModuleCategory = 'SALES' | 'PSYCHOLOGY' | 'TACTICS' | 'GENERAL';

export interface Module {
  id: string;
  title: string;
  description: string;
  minLevel: number;
  category: ModuleCategory;
  lessons: Lesson[];
  imageUrl: string;
  videoUrl?: string;
  pdfUrl?: string;
}

export type VideoCategory = 'WEBINAR' | 'TUTORIAL' | 'SHORT' | 'INSIGHT';

export interface VideoContent {
  id: string;
  title: string;
  description: string;
  url: string;
  thumbnailUrl?: string;
  category: VideoCategory;
  duration?: string;
  date: string;
  views: number;
  isLocked?: boolean;
}

export interface Material {
  id: string;
  title: string;
  description: string;
  type: 'PDF' | 'VIDEO' | 'LINK';
  url: string;
}

export interface Stream {
  id: string;
  title: string;
  date: string; 
  youtubeUrl: string;
  status: 'UPCOMING' | 'LIVE' | 'PAST';
  category?: VideoCategory;
}

export interface NotebookEntry {
  id: string;
  text: string;
  isChecked: boolean; 
  type: 'HABIT' | 'GOAL' | 'IDEA' | 'NOTE' | 'GRATITUDE'; 
  date: string; 
}

export interface Habit {
    id: string;
    title: string;
    description?: string;
    streak: number;
    completedDates: string[]; 
    targetDaysPerWeek: number;
    icon: string;
}

export interface Goal {
    id: string;
    title: string;
    currentValue: number;
    targetValue: number;
    unit: string; 
    deadline?: string;
    isCompleted: boolean;
    colorStart?: string; 
    colorEnd?: string;   
}

export interface SmartNavAction {
    label: string;
    onClick: () => void;
    variant?: 'primary' | 'success' | 'danger';
    icon?: React.ReactNode;
    loading?: boolean;
}

export type UserRole = 'STUDENT' | 'ADMIN';

export interface ChatMessage {
  id: string;
  role: 'user' | 'model';
  text: string;
  timestamp: Date | string;
}

export interface NotificationSettings {
  pushEnabled: boolean;
  telegramSync: boolean;
  deadlineReminders: boolean;
  chatNotifications: boolean;
}

export type AppTheme = 'LIGHT' | 'DARK';

export interface UserDossier {
  height?: string;
  weight?: string;
  birthDate?: string;
  location?: string;
  livingSituation?: 'ALONE' | 'DORM' | 'PARENTS' | 'FAMILY' | 'OTHER';
  workExperience?: string;
  incomeGoal?: string;
  courseExpectations?: string;
  courseGoals?: string; 
  motivation?: string; 
}

export interface UserStats {
    storiesPosted: number; 
    questionsAsked: Record<string, number>; 
    referralsCount: number;
    streamsVisited: string[]; 
    homeworksSpeed: Record<string, 'FAST' | 'SLOW' | 'POOR'>; 
    initiativesCount: number;
}

export interface UserProgress {
  id?: string;
  airtableRecordId?: string; 
  telegramId?: string;
  telegramUsername?: string;
  password?: string;
  name: string;
  role: UserRole;
  isAuthenticated: boolean;
  registrationDate?: string;
  lastSyncTimestamp?: number; 
  
  xp: number;
  level: number;
  completedLessonIds: string[];
  submittedHomeworks: string[];
  
  chatHistory: ChatMessage[]; 
  originalPhotoBase64?: string;
  avatarUrl?: string;
  
  armorStyle?: string;
  backgroundStyle?: string;
  theme: AppTheme;
  
  instagram?: string;
  aboutMe?: string;
  inviteLink?: string;
  dossier?: UserDossier;
  
  notifications: NotificationSettings;
  
  notebook: NotebookEntry[];
  habits: Habit[]; 
  goals: Goal[]; 

  stats: UserStats;
}

export interface AppIntegrations {
  telegramBotToken?: string;
  googleDriveFolderId?: string;
  crmWebhookUrl?: string;
  aiModelVersion?: string;
  databaseUrl?: string; 
  inviteBaseUrl?: string;
  airtablePat?: string;
  airtableBaseId?: string;
  airtableTableName?: string;
}

export interface AppFeatures {
  enableRealTimeSync: boolean;
  autoApproveHomework: boolean;
  maintenanceMode: boolean;
  allowStudentChat: boolean;
  publicLeaderboard: boolean;
}

export type AIProviderId = 'GOOGLE_GEMINI' | 'OPENAI_GPT4' | 'ANTHROPIC_CLAUDE' | 'LOCAL_LLAMA' | 'GROQ' | 'OPENROUTER';

export interface AIConfig {
    activeProvider: AIProviderId;
    apiKeys: {
        google?: string;
        openai?: string;
        anthropic?: string;
        groq?: string;
        openrouter?: string;
    };
    modelOverrides: {
        chat?: string;
        vision?: string;
    };
}

export interface SystemAgentConfig {
    enabled: boolean;
    autoFix: boolean; 
    monitoringInterval: number; 
    sensitivity: 'LOW' | 'HIGH';
    autonomyLevel: 'PASSIVE' | 'SUGGEST' | 'FULL_AUTO'; 
}

export interface AppConfig {
  appName: string;
  appDescription: string;
  primaryColor: string;
  systemInstruction: string;
  welcomeVideoUrl?: string; 
  welcomeMessage?: string; 
  integrations: AppIntegrations;
  features: AppFeatures;
  aiConfig: AIConfig;
  systemAgent: SystemAgentConfig;
}

export enum EventType {
  HOMEWORK = 'HOMEWORK',
  WEBINAR = 'WEBINAR',
  OTHER = 'OTHER'
}

export interface CalendarEvent {
  id: string;
  title: string;
  description: string;
  date: Date | string;
  type: EventType;
  durationMinutes?: number;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  date: string;
  type: 'INFO' | 'WARNING' | 'SUCCESS' | 'ALERT';
  targetRole?: 'ALL' | UserRole;
  targetUserId?: string; 
  isRead?: boolean;
  link?: string; 
}

export enum Tab {
  HOME = 'HOME', 
  MODULES = 'MODULES', 
  MATERIALS = 'MATERIALS', 
  RATING = 'RATING', 
  ARENA = 'ARENA', 
  STREAMS = 'STREAMS', 
  NOTEBOOK = 'NOTEBOOK', 
  HABITS = 'HABITS', 
  PROFILE = 'PROFILE',
  ADMIN_DASHBOARD = 'ADMIN_DASHBOARD'
}

export interface ArenaScenario {
  id: string;
  title: string;
  difficulty: 'Easy' | 'Medium' | 'Hard';
  clientRole: string;
  objective: string;
  initialMessage: string;
}

export type AgentActionType = 
    | 'OPTIMIZE_CONFIG' 
    | 'REWRITE_LESSON' 
    | 'CREATE_EVENT' 
    | 'FIX_USER_DATA' 
    | 'CLEAR_LOGS' 
    | 'SEND_NOTIFICATION'
    | 'BALANCE_DIFFICULTY'
    | 'NO_ACTION';

export interface AgentDecision {
    action: AgentActionType;
    reason: string;
    payload: any; 
}
