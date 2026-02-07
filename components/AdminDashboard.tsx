
import React, { useState } from 'react';
import { AppConfig, Module, UserProgress, Material, Stream, CalendarEvent, ArenaScenario, AppNotification, Lesson, UserRole, HomeworkType, AIProviderId, EventType, VideoCategory } from '../types';
import { Button } from './Button';
import { telegram } from '../services/telegramService';
import { Logger } from '../services/logger';

interface AdminDashboardProps {
  config: AppConfig;
  onUpdateConfig: (newConfig: AppConfig) => void;
  modules: Module[];
  onUpdateModules: (newModules: Module[]) => void;
  materials: Material[];
  onUpdateMaterials: (newMaterials: Material[]) => void;
  streams: Stream[];
  onUpdateStreams: (newStreams: Stream[]) => void;
  events: CalendarEvent[];
  onUpdateEvents: (newEvents: CalendarEvent[]) => void;
  scenarios: ArenaScenario[];
  onUpdateScenarios: (newScenarios: ArenaScenario[]) => void;
  users: UserProgress[];
  onUpdateUsers: (newUsers: UserProgress[]) => void;
  currentUser: UserProgress;
  activeSubTab: 'OVERVIEW' | 'COURSE' | 'MATERIALS' | 'STREAMS' | 'USERS' | 'SETTINGS' | 'ARENA' | 'CALENDAR';
  onSendBroadcast: (notif: AppNotification) => void;
  notifications: AppNotification[];
  onClearNotifications: () => void;
  addToast: (type: 'success' | 'error' | 'info', message: string, link?: string) => void;
}

const StatCard = ({ icon, label, value }: { icon: string; label: string; value: number | string }) => (
  <div className="bg-surface border border-border-color p-5 rounded-[2rem] flex items-center gap-4 shadow-sm hover:border-[#6C5DD3] transition-colors group">
    <div className="w-12 h-12 rounded-2xl bg-body flex items-center justify-center text-2xl shadow-inner group-hover:scale-110 transition-transform">
      {icon}
    </div>
    <div>
      <h3 className="text-2xl font-black text-text-primary leading-none mb-1">{value}</h3>
      <p className="text-[10px] font-bold text-text-secondary uppercase tracking-widest">{label}</p>
    </div>
  </div>
);

const getYouTubeThumbnail = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
      ? `https://img.youtube.com/vi/${match[2]}/mqdefault.jpg` 
      : null;
};

const getISOString = (date: Date | string | undefined) => {
    if (!date) return '';
    return date instanceof Date ? date.toISOString() : date;
};

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  config, onUpdateConfig, 
  modules, onUpdateModules, 
  scenarios, onUpdateScenarios,
  users, onUpdateUsers,
  streams, onUpdateStreams,
  events, onUpdateEvents,
  currentUser,
  activeSubTab, onSendBroadcast, notifications, addToast
}) => {

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifType, setNotifType] = useState<AppNotification['type']>('INFO');
  const [userSearchTerm, setUserSearchTerm] = useState('');
  
  const [systemInstruction, setSystemInstruction] = useState(config.systemInstruction);
  const [selectedProvider, setSelectedProvider] = useState<AIProviderId>(config.aiConfig?.activeProvider || 'GOOGLE_GEMINI');
  const [apiKeys, setApiKeys] = useState(config.aiConfig?.apiKeys || {});
  
  const [airtableConfig, setAirtableConfig] = useState({
      pat: config.integrations.airtablePat || '',
      baseId: config.integrations.airtableBaseId || '',
      tableName: config.integrations.airtableTableName || 'Users'
  });

  const [expandedModuleId, setExpandedModuleId] = useState<string | null>(null);
  const [editingLessonState, setEditingLessonState] = useState<{ moduleId: string, lesson: Lesson } | null>(null);
  const [editingScenario, setEditingScenario] = useState<Partial<ArenaScenario> | null>(null);
  const [editingStream, setEditingStream] = useState<Partial<Stream> | null>(null);
  const [editingEvent, setEditingEvent] = useState<Partial<CalendarEvent> | null>(null);

  const sendNotif = () => {
      if(!notifTitle || !notifMsg) return;
      telegram.haptic('success');
      onSendBroadcast({
          id: Date.now().toString(),
          title: notifTitle,
          message: notifMsg,
          type: notifType,
          date: new Date().toISOString(),
          targetRole: 'ALL'
      });
      setNotifTitle('');
      setNotifMsg('');
      addToast('success', 'Отправлено');
  };

  const handleClearLogs = () => {
      Logger.clear();
      telegram.haptic('success');
      addToast('info', 'Логи очищены');
  };

  const saveStream = () => {
      if (!editingStream?.title) return;
      const newSt = {
          id: editingStream.id || Date.now().toString(),
          title: editingStream.title,
          date: editingStream.date || new Date().toISOString(),
          youtubeUrl: editingStream.youtubeUrl || '',
          status: editingStream.status || 'UPCOMING',
          category: editingStream.category || 'TUTORIAL'
      } as Stream;

      if (editingStream.id) {
          onUpdateStreams(streams.map(s => s.id === newSt.id ? newSt : s));
      } else {
          onUpdateStreams([...streams, newSt]);
      }
      setEditingStream(null);
      addToast('success', 'Видео сохранено');
  };

  const deleteStream = (id: string) => {
      if(confirm('Удалить видео?')) {
          onUpdateStreams(streams.filter(s => s.id !== id));
      }
  };

  const toggleFeature = (key: keyof AppConfig['features']) => {
      onUpdateConfig({
          ...config,
          features: {
              ...config.features,
              [key]: !config.features[key]
          }
      });
      telegram.haptic('medium');
  };

  const filteredUsers = users.filter(u => 
      (u.name || '').toLowerCase().includes(userSearchTerm.toLowerCase()) || 
      (u.role || '').toLowerCase().includes(userSearchTerm.toLowerCase()) ||
      u.telegramUsername?.toLowerCase().includes(userSearchTerm.toLowerCase())
  );

  return (
    <div className="min-h-screen pb-40 pt-[calc(var(--safe-top)+20px)] px-6 space-y-8 animate-fade-in bg-body">
        <div className="flex justify-between items-center">
            <div>
                <span className="text-[#6C5DD3] text-[10px] font-black uppercase tracking-[0.3em] mb-1 block">Command Center</span>
                <h1 className="text-3xl font-black text-text-primary tracking-tighter leading-none">ПАНЕЛЬ<br/><span className="opacity-30">АДМИНА</span></h1>
            </div>
            <div className="w-14 h-14 bg-[#6C5DD3]/10 text-[#6C5DD3] rounded-[2rem] flex items-center justify-center text-2xl border border-[#6C5DD3]/20 shadow-inner">
                🛠️
            </div>
        </div>

        {activeSubTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-slide-up">
                <div className="grid grid-cols-2 gap-4">
                    <StatCard icon="👥" label="Бойцов" value={users.length} />
                    <StatCard icon="📦" label="Модулей" value={modules.length} />
                    <StatCard icon="⚔️" label="Сценариев" value={scenarios.length} />
                    <StatCard icon="📹" label="Видео" value={streams.length} />
                </div>
                
                <div className="bg-surface border border-border-color p-6 rounded-[2.5rem] shadow-sm space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-[#6C5DD3] flex items-center gap-2">
                        <span className="animate-pulse">📡</span> Системное Оповещение
                    </h3>
                    <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="w-full bg-body border border-border-color p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#6C5DD3] transition-all" placeholder="Заголовок" />
                    <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} className="w-full bg-body border border-border-color p-4 rounded-2xl text-sm h-24 resize-none outline-none focus:border-[#6C5DD3] transition-all" placeholder="Текст сообщения..." />
                    <Button onClick={sendNotif} fullWidth className="!rounded-2xl !py-4">ОТПРАВИТЬ ВСЕМ</Button>
                </div>
            </div>
        )}

        {activeSubTab === 'STREAMS' && (
            <div className="space-y-8 animate-slide-up">
                <div className="space-y-4">
                    <h3 className="text-xs font-black uppercase tracking-widest text-[#6C5DD3]">Библиотека Видео</h3>
                    {streams.map(s => (
                        <div key={s.id} className="bg-surface border border-border-color p-4 rounded-2xl flex items-center justify-between group">
                            <div className="flex-1 min-w-0">
                                <h4 className="font-bold text-sm text-text-primary truncate">{s.title}</h4>
                                <p className="text-[10px] text-text-secondary">{s.category || 'TUTORIAL'} • {s.status}</p>
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => setEditingStream(s)} className="text-sm p-2 hover:bg-body rounded-lg">✎</button>
                                <button onClick={() => deleteStream(s.id)} className="text-sm text-red-500 p-2 hover:bg-red-500/10 rounded-lg">✕</button>
                            </div>
                        </div>
                    ))}
                    
                    <div className="bg-surface border border-border-color p-6 rounded-[2rem] space-y-4 shadow-lg border-[#6C5DD3]/10">
                        <h3 className="font-bold uppercase text-xs tracking-widest text-[#6C5DD3]">{editingStream?.id ? 'Редактировать Видео' : 'Добавить Новое Видео'}</h3>
                        <input value={editingStream?.title || ''} onChange={e => setEditingStream({...editingStream, title: e.target.value})} placeholder="Название видео" className="w-full bg-body p-4 rounded-2xl text-sm border border-border-color outline-none" />
                        
                        <div className="grid grid-cols-2 gap-3">
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-text-secondary ml-2">Категория</label>
                                <select 
                                    value={editingStream?.category || 'TUTORIAL'} 
                                    onChange={e => setEditingStream({...editingStream, category: e.target.value as VideoCategory})} 
                                    className="w-full bg-body p-4 rounded-2xl text-xs border border-border-color outline-none"
                                >
                                    <option value="WEBINAR">Вебинар</option>
                                    <option value="TUTORIAL">Урок</option>
                                    <option value="SHORT">Шортс</option>
                                    <option value="INSIGHT">Инсайт</option>
                                </select>
                            </div>
                            <div className="space-y-1">
                                <label className="text-[8px] font-black uppercase text-text-secondary ml-2">Статус</label>
                                <select 
                                    value={editingStream?.status || 'PAST'} 
                                    onChange={e => setEditingStream({...editingStream, status: e.target.value as any})} 
                                    className="w-full bg-body p-4 rounded-2xl text-xs border border-border-color outline-none"
                                >
                                    <option value="UPCOMING">Анонс</option>
                                    <option value="LIVE">Прямой эфир</option>
                                    <option value="PAST">Запись</option>
                                </select>
                            </div>
                        </div>

                        <div className="space-y-1">
                             <label className="text-[8px] font-black uppercase text-text-secondary ml-2">Ссылка (YouTube/Vimeo)</label>
                             <input value={editingStream?.youtubeUrl || ''} onChange={e => setEditingStream({...editingStream, youtubeUrl: e.target.value})} placeholder="https://..." className="w-full bg-body p-4 rounded-2xl text-xs font-mono border border-border-color outline-none" />
                        </div>

                        <div className="flex gap-2 pt-2">
                            <Button onClick={saveStream} fullWidth className="!rounded-2xl !py-4">{editingStream?.id ? 'ОБНОВИТЬ' : 'ДОБАВИТЬ В БАЗУ'}</Button>
                            {editingStream && <button onClick={() => setEditingStream(null)} className="px-6 rounded-2xl border border-border-color">✕</button>}
                        </div>
                    </div>
                </div>
            </div>
        )}

        {activeSubTab === 'SETTINGS' && (
            <div className="space-y-6 animate-slide-up">
                <div className="bg-surface border border-border-color p-6 rounded-[2.5rem] space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-[#6C5DD3]">Системные Настройки</h3>
                    {Object.entries(config.features).map(([key, value]) => (
                        <div key={key} className="flex items-center justify-between">
                            <span className="text-sm font-bold text-text-primary capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
                            <button 
                                onClick={() => toggleFeature(key as any)}
                                className={`w-12 h-6 rounded-full p-1 transition-colors ${value ? 'bg-[#6C5DD3]' : 'bg-body border border-border-color'}`}
                            >
                                <div className={`w-4 h-4 bg-white rounded-full shadow-sm transform transition-transform ${value ? 'translate-x-6' : ''}`} />
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        )}
    </div>
  );
};
