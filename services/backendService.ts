
import { Storage } from './storage';
import { UserProgress, Module, Material, Stream, CalendarEvent, ArenaScenario, AppNotification, AppConfig } from '../types';
import { Logger } from './logger';
import { COURSE_MODULES, MOCK_EVENTS, MOCK_MATERIALS, MOCK_STREAMS } from '../constants';
import { SCENARIOS } from '../components/SalesArena';

type ContentTable = 'modules' | 'materials' | 'streams' | 'events' | 'scenarios' | 'notifications' | 'app_settings';

/**
 * BACKEND SERVICE (Neon DB Ready)
 * 
 * Currently running in "Client-Side Mode" because direct PostgreSQL connections (Neon)
 * are not secure or possible directly from a browser environment.
 * 
 * To connect Neon for real:
 * 1. Deploy a backend (Vercel Serverless Functions, Next.js API, or Node.js).
 * 2. Use the 'DATABASE_URL' from config to connect via 'pg' or 'neondatabase/serverless'.
 * 3. Replace the localStorage calls below with API fetch calls to your backend.
 */
class BackendService {
  
  // --- USER SYNC ---

  async syncUser(localUser: UserProgress): Promise<UserProgress> {
    // Simulate network latency
    // await new Promise(r => setTimeout(r, 300));

    // Fallback: Local "Mock DB" Sync
    // In a real Neon implementation, this would be: GET /api/users/:id
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
        
        // XP Logic for Local Mock
        // If remote is 0 (reset) and local > 0, reset local.
        if (remoteVer.xp === 0 && localUser.xp > 0) {
             updates.xp = 0;
             updates.level = 1;
             needsUpdate = true;
        } else if (remoteVer.xp > localUser.xp) {
             updates.xp = remoteVer.xp;
             updates.level = remoteVer.level;
             needsUpdate = true;
        }

        if (needsUpdate) {
            return { ...localUser, ...updates };
        }
    } else {
        // First time sync, create in "DB"
        await this.saveUser(localUser);
    }

    return localUser;
  }

  async saveUser(user: UserProgress) {
    // In a real Neon implementation: POST /api/users
    
    // Update Local "Mock DB" (allUsers)
    const allUsers = Storage.get<UserProgress[]>('allUsers', []);
    const idx = allUsers.findIndex(u => u.telegramId === user.telegramId);
    let newAllUsers = [...allUsers];
    if (idx >= 0) {
        newAllUsers[idx] = user;
    } else {
        newAllUsers.push(user);
    }
    Storage.set('allUsers', newAllUsers);
    // Logger.debug('Backend: User saved to local DB', user.name);
  }

  // --- GLOBAL CONFIG SYNC ---

  async fetchGlobalConfig(defaultConfig: AppConfig): Promise<AppConfig> {
      // In real Neon: SELECT * FROM app_settings WHERE id = 'global_config'
      return Storage.get('appConfig', defaultConfig);
  }

  async saveGlobalConfig(config: AppConfig) {
      Storage.set('appConfig', config);
      Logger.info('Backend: Global config saved locally');
  }

  // --- CONTENT SYNC ---

  async fetchAllContent() {
      // In real Neon: Promise.all([ fetch('/api/modules'), ... ])
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
      if (key) Storage.set(key, items);
      Logger.info(`Backend: Saved ${items.length} items to ${table} (Local)`);
  }

  // --- NOTIFICATIONS ---

  async fetchNotifications(): Promise<AppNotification[]> {
      return Storage.get<AppNotification[]>('local_notifications', []);
  }

  async sendBroadcast(notification: AppNotification) {
      const current = Storage.get<AppNotification[]>('local_notifications', []);
      Storage.set('local_notifications', [notification, ...current]);
  }

  // --- USER MANAGEMENT ---

  async getLeaderboard(): Promise<UserProgress[]> {
     return Storage.get<UserProgress[]>('allUsers', []);
  }
}

export const Backend = new BackendService();
