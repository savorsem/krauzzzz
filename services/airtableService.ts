
import { AppConfig, UserProgress, Module, Material, Stream, CalendarEvent, ArenaScenario, AppNotification, NotebookEntry, Habit, Goal } from '../types';
import { Logger } from './logger';
import { Storage } from './storage';

// Helper types matching your Airtable table names
type TableName = 'Users' | 'Modules' | 'Materials' | 'Streams' | 'Events' | 'Scenarios' | 'Notifications' | 'Config' | 'Notebook' | 'Habits' | 'Goals';

class AirtableService {
    
    private getConfig() {
        const appConfig = Storage.get<AppConfig>('appConfig', {} as any);
        const integ = appConfig?.integrations;
        
        return {
            pat: integ?.airtablePat || '',
            baseId: integ?.airtableBaseId || '',
            tables: {
                Users: integ?.airtableTableName || 'Users',
                Modules: 'Modules',
                Materials: 'Materials',
                Streams: 'Streams',
                Events: 'Events',
                Scenarios: 'Scenarios',
                Notifications: 'Notifications',
                Config: 'Config',
                Notebook: 'Notebook',
                Habits: 'Habits',
                Goals: 'Goals'
            }
        };
    }

    private getHeaders(pat: string) {
        return {
            'Authorization': `Bearer ${pat}`,
            'Content-Type': 'application/json'
        };
    }

    // --- GENERIC FETCH ---

    async fetchTable<T>(tableName: TableName, mapper: (record: any) => T): Promise<T[]> {
        const { pat, baseId, tables } = this.getConfig();
        const actualTableName = tables[tableName];

        if (!pat || !baseId) return [];

        const url = `https://api.airtable.com/v0/${baseId}/${actualTableName}`;
        
        try {
            const response = await fetch(url, { headers: this.getHeaders(pat) });
            if (!response.ok) {
                if (response.status === 404) Logger.warn(`Airtable: Table '${actualTableName}' not found.`);
                return [];
            }
            
            const data = await response.json();
            if (!data.records) return [];

            return data.records.map((r: any) => {
                try {
                    return mapper(r);
                } catch (e) {
                    console.error(`Error mapping record from ${tableName}`, r, e);
                    return null;
                }
            }).filter((i: any) => i !== null) as T[];
        } catch (error) {
            Logger.error(`Airtable: Error fetching ${tableName}`, error);
            return [];
        }
    }

    // --- GENERIC UPSERT ---

    async upsertRecord(tableName: TableName, searchField: string, searchValue: string, fields: any) {
        const { pat, baseId, tables } = this.getConfig();
        if (!pat || !baseId) return;

        const actualTableName = tables[tableName];
        
        try {
            // 1. Find existing record
            const safeValue = String(searchValue).replace(/'/g, "\\'");
            const filter = encodeURIComponent(`{${searchField}} = '${safeValue}'`);
            const findUrl = `https://api.airtable.com/v0/${baseId}/${actualTableName}?filterByFormula=${filter}`;
            
            const findRes = await fetch(findUrl, { headers: this.getHeaders(pat) });
            const findData = await findRes.json();
            const existingRecord = findData.records?.[0];

            const url = `https://api.airtable.com/v0/${baseId}/${actualTableName}${existingRecord ? `/${existingRecord.id}` : ''}`;
            const method = existingRecord ? 'PATCH' : 'POST';

            await fetch(url, {
                method,
                headers: this.getHeaders(pat),
                body: JSON.stringify({ fields: { ...fields, [searchField]: searchValue }, typecast: true })
            });
            
            return existingRecord ? existingRecord.id : null;

        } catch (error) {
            Logger.error(`Airtable: Error saving to ${tableName}`, error);
            return null;
        }
    }

    // --- USER SYNC & SUB-COLLECTIONS ---

    private mapRecordToUser(record: any): UserProgress {
        const f = record.fields;
        let additionalData = {};
        try {
            if (f.Data) additionalData = JSON.parse(f.Data);
        } catch (e) { console.error('Error parsing User Data JSON', e); }

        return {
            id: f.TelegramId, 
            airtableRecordId: record.id,
            telegramId: f.TelegramId,
            name: f.Name,
            role: f.Role,
            xp: f.XP || 0,
            level: f.Level || 1,
            lastSyncTimestamp: f.LastSync || 0,
            ...additionalData
        } as UserProgress;
    }

    async syncUser(localUser: UserProgress): Promise<UserProgress> {
        const { pat, baseId, tables } = this.getConfig();
        if (!pat || !baseId) return localUser;

        const tgId = localUser.telegramId || localUser.telegramUsername;
        if (!tgId) return localUser;

        try {
            // 1. Fetch remote user
            const safeId = String(tgId).replace(/'/g, "\\'");
            const filter = encodeURIComponent(`{TelegramId} = '${safeId}'`);
            const url = `https://api.airtable.com/v0/${baseId}/${tables.Users}?filterByFormula=${filter}`;
            
            const response = await fetch(url, { headers: this.getHeaders(pat) });
            const data = await response.json();
            const remoteRecord = data.records?.[0];

            // 2. Prepare Payload
            const { id, airtableRecordId, name, role, xp, level, telegramId, lastSyncTimestamp, ...rest } = localUser;
            const currentTimestamp = Date.now();
            
            const payloadFields = {
                "TelegramId": String(tgId),
                "Name": name || 'Unknown',
                "Role": role || 'STUDENT',
                "XP": Number(xp) || 0,
                "Level": Number(level) || 1,
                "LastSync": currentTimestamp,
                "Data": JSON.stringify(rest)
            };

            let finalUser = localUser;
            let userRecordId = remoteRecord?.id;

            // 3. Logic
            if (!remoteRecord) {
                // New User
                const createRes = await fetch(`https://api.airtable.com/v0/${baseId}/${tables.Users}`, {
                    method: 'POST',
                    headers: this.getHeaders(pat),
                    body: JSON.stringify({ fields: payloadFields, typecast: true })
                });
                const createData = await createRes.json();
                userRecordId = createData.id;
                finalUser = { ...localUser, lastSyncTimestamp: currentTimestamp, airtableRecordId: userRecordId };
            } else {
                // Existing User - Conflict Resolution
                const remoteUser = this.mapRecordToUser(remoteRecord);
                const localTime = localUser.lastSyncTimestamp || 0;
                const remoteTime = remoteUser.lastSyncTimestamp || 0;

                if (localTime > remoteTime + 2000) {
                    // Local is newer -> Push to Cloud
                    await fetch(`https://api.airtable.com/v0/${baseId}/${tables.Users}/${remoteRecord.id}`, {
                        method: 'PATCH',
                        headers: this.getHeaders(pat),
                        body: JSON.stringify({ fields: payloadFields, typecast: true })
                    });
                    finalUser = { ...localUser, lastSyncTimestamp: currentTimestamp, airtableRecordId: remoteRecord.id };
                } else if (remoteTime > localTime) {
                    // Remote is newer -> Pull from Cloud
                    Logger.info('Airtable: Pulled newer user data from cloud');
                    return remoteUser;
                } else {
                    finalUser = { ...localUser, airtableRecordId: remoteRecord.id };
                }
            }

            // 4. Sync Sub-Collections (Notebook, Habits, Goals) in background
            if (userRecordId) {
                this.syncUserDetails(finalUser, userRecordId);
            }

            return finalUser;

        } catch (error) {
            Logger.warn('Airtable User Sync Failed', error);
            return localUser;
        }
    }

    /**
     * Syncs Notebook, Habits, and Goals to separate tables linked to the User.
     * This is primarily for Admin visibility/Analytics.
     */
    private async syncUserDetails(user: UserProgress, userRecordId: string) {
        // We sync items individually. Note: This assumes simple upsert by ID.
        // It does NOT handle deletions of items removed from the app (to keep logic simple and safe).
        
        // 1. Sync Notebook
        if (user.notebook && user.notebook.length > 0) {
            user.notebook.forEach(note => {
                this.upsertRecord('Notebook', 'id', note.id, {
                    "Text": note.text,
                    "Type": note.type,
                    "Date": note.date,
                    "User": [userRecordId] // Link to User
                });
            });
        }

        // 2. Sync Habits
        if (user.habits && user.habits.length > 0) {
            user.habits.forEach(habit => {
                this.upsertRecord('Habits', 'id', habit.id, {
                    "Title": habit.title,
                    "Streak": habit.streak,
                    "User": [userRecordId]
                });
            });
        }

        // 3. Sync Goals
        if (user.goals && user.goals.length > 0) {
            user.goals.forEach(goal => {
                this.upsertRecord('Goals', 'id', goal.id, {
                    "Title": goal.title,
                    "Progress": `${goal.currentValue} / ${goal.targetValue} ${goal.unit}`,
                    "IsCompleted": goal.isCompleted,
                    "User": [userRecordId]
                });
            });
        }
    }

    // --- CONTENT MAPPERS & SAVERS (Existing) ---
    // ... (Previous implementation remains same for content)
    
    // MODULES
    mapModule(record: any): Module {
        const f = record.fields;
        let lessons = [];
        try { lessons = f.lessons ? JSON.parse(f.lessons) : []; } catch(e) { console.error('Bad lessons JSON', e); }
        return {
            id: f.id || record.id,
            title: f.title,
            description: f.description,
            category: f.category,
            minLevel: f.minLevel,
            imageUrl: f.imageUrl,
            videoUrl: f.videoUrl,
            lessons: lessons
        };
    }
    async saveModule(module: Module) {
        await this.upsertRecord('Modules', 'id', module.id, {
            title: module.title,
            description: module.description,
            category: module.category,
            minLevel: module.minLevel,
            imageUrl: module.imageUrl,
            videoUrl: module.videoUrl,
            lessons: JSON.stringify(module.lessons)
        });
    }

    // MATERIALS
    mapMaterial(record: any): Material {
        const f = record.fields;
        return {
            id: f.id || record.id,
            title: f.title,
            description: f.description,
            type: f.type,
            url: f.url
        };
    }
    async saveMaterial(mat: Material) {
        await this.upsertRecord('Materials', 'id', mat.id, {
            title: mat.title,
            description: mat.description,
            type: mat.type,
            url: mat.url
        });
    }

    // STREAMS
    mapStream(record: any): Stream {
        const f = record.fields;
        return {
            id: f.id || record.id,
            title: f.title,
            date: f.date,
            status: f.status,
            youtubeUrl: f.youtubeUrl
        };
    }
    async saveStream(s: Stream) {
        await this.upsertRecord('Streams', 'id', s.id, {
            title: s.title,
            date: s.date,
            status: s.status,
            youtubeUrl: s.youtubeUrl
        });
    }

    // EVENTS
    mapEvent(record: any): CalendarEvent {
        const f = record.fields;
        return {
            id: f.id || record.id,
            title: f.title,
            description: f.description,
            date: f.date,
            type: f.type,
            durationMinutes: f.durationMinutes
        };
    }
    async saveEvent(e: CalendarEvent) {
        await this.upsertRecord('Events', 'id', e.id, {
            title: e.title,
            description: e.description,
            date: typeof e.date === 'string' ? e.date : e.date.toISOString(),
            type: e.type,
            durationMinutes: e.durationMinutes
        });
    }

    // SCENARIOS
    mapScenario(record: any): ArenaScenario {
        const f = record.fields;
        return {
            id: f.id || record.id,
            title: f.title,
            difficulty: f.difficulty,
            clientRole: f.clientRole,
            objective: f.objective,
            initialMessage: f.initialMessage
        };
    }
    async saveScenario(s: ArenaScenario) {
        await this.upsertRecord('Scenarios', 'id', s.id, {
            title: s.title,
            difficulty: s.difficulty,
            clientRole: s.clientRole,
            objective: s.objective,
            initialMessage: s.initialMessage
        });
    }

    // NOTIFICATIONS
    mapNotification(record: any): AppNotification {
        const f = record.fields;
        return {
            id: f.id || record.id,
            title: f.title,
            message: f.message,
            type: f.type,
            date: f.date,
            targetRole: f.targetRole
        };
    }
    async saveNotification(n: AppNotification) {
        await this.upsertRecord('Notifications', 'id', n.id, {
            title: n.title,
            message: n.message,
            type: n.type,
            date: n.date,
            targetRole: n.targetRole
        });
    }

    // CONFIG
    async getConfigRecord(): Promise<AppConfig | null> {
        const records = await this.fetchTable('Config', r => ({ key: r.fields.key, value: r.fields.value }));
        const cfgRecord = records.find(r => r.key === 'appConfig');
        if (cfgRecord && cfgRecord.value) {
            try { return JSON.parse(cfgRecord.value); } catch(e) { console.error('Bad Config JSON', e); }
        }
        return null;
    }
    async saveConfig(config: AppConfig) {
        await this.upsertRecord('Config', 'key', 'appConfig', {
            value: JSON.stringify(config)
        });
    }

    // USERS (LIST)
    async getAllUsers(): Promise<UserProgress[]> {
        return this.fetchTable('Users', (r) => this.mapRecordToUser(r));
    }

    // --- PUBLIC METHODS ---
    async getModules() { return this.fetchTable('Modules', (r) => this.mapModule(r)); }
    async getMaterials() { return this.fetchTable('Materials', (r) => this.mapMaterial(r)); }
    async getStreams() { return this.fetchTable('Streams', (r) => this.mapStream(r)); }
    async getEvents() { return this.fetchTable('Events', (r) => this.mapEvent(r)); }
    async getScenarios() { return this.fetchTable('Scenarios', (r) => this.mapScenario(r)); }
    async getNotifications() { return this.fetchTable('Notifications', (r) => this.mapNotification(r)); }
}

export const airtable = new AirtableService();
