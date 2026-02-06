
import { Storage } from './storage';
import { UserProgress, Module, Material, Stream, CalendarEvent, ArenaScenario, AppNotification, AppConfig } from '../types';
import { Logger } from './logger';
import { COURSE_MODULES, MOCK_EVENTS, MOCK_MATERIALS, MOCK_STREAMS } from '../constants';
import { SCENARIOS } from '../components/SalesArena';

type ContentTable = 'modules' | 'materials' | 'streams' | 'events' | 'scenarios' | 'notifications' | 'app_settings';

const SYNC_CHANNEL_NAME = 'salespro_sync_channel';

/**
 * BACKEND SERVICE (Enhanced for Local Sync)
 * 
 * Uses BroadcastChannel to instantly synchronize state across tabs/windows.
 * Simulates a real-time backend connection.
 */
class BackendService {
  private channel: BroadcastChannel;

  constructor() {
      this.channel = new BroadcastChannel(SYNC_CHANNEL_NAME);
  }

  // --- EVENTS ---
  
  /**
   * Subscribe to sync events
   */
  public onSync(callback: () => void) {
      this.channel.onmessage = (event) => {
          if (event.data && event.data.type === 'SYNC_UPDATE') {
              Logger.info('Backend: Received sync signal from another tab');
              callback();
          }
      };
  }

  private notifySync() {
      this.channel.postMessage({ type: 'SYNC_UPDATE', timestamp: Date.now() });
  }
  
  // --- USER SYNC ---

  async syncUser(localUser: UserProgress): Promise<UserProgress> {
    const allUsers = Storage.get<UserProgress[]>('allUsers', []);
    const remoteVer = allUsers.find(u => u.telegramId === localUser.telegramId || (u.telegramUsername && u.telegramUsername === localUser.telegramUsername));
    
    if (remoteVer) {
        let needsUpdate = false;
        const updates: Partial<UserProgress> = {};

        // Role Authority: DB is always right
        if (remoteVer.role !== localUser.role) {
            updates.role = remoteVer.role;
            needsUpdate = true;
        }
        
        // Admin force update override logic (if needed)
        // For now, we trust local progress unless remote is significantly different (e.g., reset)
        if (remoteVer.xp === 0 && localUser.xp > 0) {
             updates.xp = 0;
             updates.level = 1;
             needsUpdate = true;
        }

        if (needsUpdate) {
            return { ...localUser, ...updates };
        }
    } else {
        await this.saveUser(localUser);
    }

    return localUser;
  }

  async saveUser(user: UserProgress) {
    const allUsers = Storage.get<UserProgress[]>('allUsers', []);
    const idx = allUsers.findIndex(u => u.telegramId === user.telegramId);
    const newAllUsers = [...allUsers];
    
    if (idx >= 0) {
        newAllUsers[idx] = user;
    } else {
        newAllUsers.push(user);
    }
    
    Storage.set('allUsers', newAllUsers);
    this.notifySync(); 
  }

  // --- GLOBAL CONFIG SYNC ---

  async fetchGlobalConfig(defaultConfig: AppConfig): Promise<AppConfig> {
      return Storage.get('appConfig', defaultConfig);
  }

  async saveGlobalConfig(config: AppConfig) {
      Storage.set('appConfig', config);
      this.notifySync();
      Logger.info('Backend: Global config saved');
  }

  // --- CONTENT SYNC ---

  async fetchAllContent() {
      return {
          modules: Storage.get('courseModules', COURSE_MODULES),
          materials: Storage.get('materials', MOCK_MATERIALS),
          streams: Storage.get('streams', MOCK_STREAMS),
          events: Storage.get('events', MOCK_EVENTS),
          scenarios: Storage.get('scenarios', SCENARIOS),
      };
  }

  async saveCollection<T extends { id: string }>(table: ContentTable, items: T[]) {
      const storageKeyMap: Partial<Record<ContentTable, string>> = {
          'modules': 'courseModules',
          'materials': 'materials',
          'streams': 'streams',
          'events': 'events',
          'scenarios': 'scenarios'
      };
      
      const key = storageKeyMap[table];
      if (key) {
          Storage.set(key, items);
          this.notifySync();
          Logger.info(`Backend: Saved ${items.length} items to ${table}`);
      }
  }

  // --- NOTIFICATIONS ---

  async fetchNotifications(): Promise<AppNotification[]> {
      return Storage.get<AppNotification[]>('local_notifications', []);
  }

  async sendBroadcast(notification: AppNotification) {
      const current = Storage.get<AppNotification[]>('local_notifications', []);
      Storage.set('local_notifications', [notification, ...current]);
      this.notifySync();
  }

  // --- USER MANAGEMENT ---

  async getLeaderboard(): Promise<UserProgress[]> {
     return Storage.get<UserProgress[]>('allUsers', []);
  }
}

export const Backend = new BackendService();
