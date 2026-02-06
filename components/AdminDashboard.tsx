
import React, { useState } from 'react';
import { AppConfig, Module, UserProgress, Material, Stream, CalendarEvent, ArenaScenario, AppNotification, Lesson, UserRole } from '../types';
import { Button } from './Button';
import { telegram } from '../services/telegramService';

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
  activeSubTab: 'OVERVIEW' | 'COURSE' | 'MATERIALS' | 'STREAMS' | 'USERS' | 'SETTINGS' | 'ARENA' | 'NEURAL_CORE';
  onSendBroadcast: (notif: AppNotification) => void;
  notifications: AppNotification[];
  onClearNotifications: () => void;
  addToast: (type: 'success' | 'error' | 'info', message: string, link?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  config, onUpdateConfig, 
  modules, onUpdateModules, 
  scenarios, onUpdateScenarios,
  users, onUpdateUsers,
  activeSubTab, onSendBroadcast, notifications, addToast
}) => {

  // --- LOCAL STATE FOR UI ---
  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifType, setNotifType] = useState<AppNotification['type']>('INFO');
  
  // AI Config State
  const [systemInstruction, setSystemInstruction] = useState(config.systemInstruction);

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

  const handleSaveAIConfig = () => {
      onUpdateConfig({ ...config, systemInstruction });
      telegram.haptic('success');
      addToast('success', 'Промпт ИИ обновлен');
  };

  const handleDeleteModule = (id: string) => {
      if (confirm('Удалить модуль?')) {
          onUpdateModules(modules.filter(m => m.id !== id));
          telegram.haptic('warning');
      }
  };

  const toggleUserRole = (user: UserProgress) => {
      const newRole = user.role === 'ADMIN' ? 'STUDENT' : 'ADMIN';
      const updatedUsers = users.map(u => u.telegramId === user.telegramId ? { ...u, role: newRole } : u);
      onUpdateUsers(updatedUsers);
      telegram.haptic('selection');
      addToast('info', `Роль ${user.name} изменена на ${newRole}`);
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

  return (
    <div className="min-h-screen pb-40 pt-[calc(var(--safe-top)+20px)] px-6 space-y-8 animate-fade-in bg-body">
        
        {/* HEADER */}
        <div className="flex justify-between items-center">
            <div>
                <span className="text-[#6C5DD3] text-[10px] font-black uppercase tracking-[0.3em] mb-1 block">Command Center</span>
                <h1 className="text-3xl font-black text-text-primary tracking-tighter leading-none">ПАНЕЛЬ<br/><span className="opacity-30">АДМИНА</span></h1>
            </div>
            <div className="w-14 h-14 bg-[#6C5DD3]/10 text-[#6C5DD3] rounded-[2rem] flex items-center justify-center text-2xl border border-[#6C5DD3]/20 shadow-inner">
                🛠️
            </div>
        </div>

        {/* --- VIEW: OVERVIEW --- */}
        {activeSubTab === 'OVERVIEW' && (
            <div className="space-y-6 animate-slide-up">
                <div className="grid grid-cols-2 gap-4">
                    <StatCard icon="👥" label="Бойцов" value={users.length} />
                    <StatCard icon="📦" label="Модулей" value={modules.length} />
                    <StatCard icon="⚔️" label="Сценариев" value={scenarios.length} />
                    <StatCard icon="🔔" label="Уведомлений" value={notifications.length} />
                </div>
                
                <div className="bg-surface border border-border-color p-6 rounded-[2.5rem] shadow-sm space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-[#6C5DD3] flex items-center gap-2">
                        <span className="animate-pulse">📡</span> Системное Оповещение
                    </h3>
                    <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="w-full bg-body border border-border-color p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#6C5DD3] transition-all" placeholder="Заголовок" />
                    <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} className="w-full bg-body border border-border-color p-4 rounded-2xl text-sm h-24 resize-none outline-none focus:border-[#6C5DD3] transition-all" placeholder="Текст сообщения..." />
                    <div className="flex gap-2">
                        {['INFO', 'SUCCESS', 'WARNING', 'ALERT'].map(t => (
                            <button key={t} onClick={() => { setNotifType(t as any); telegram.haptic('selection'); }} className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${notifType === t ? 'bg-[#6C5DD3] text-white border-[#6C5DD3]' : 'border-border-color text-text-secondary'}`}>{t}</button>
                        ))}
                    </div>
                    <Button onClick={sendNotif} fullWidth className="!rounded-2xl !py-4">ОТПРАВИТЬ ВСЕМ</Button>
                </div>
            </div>
        )}

        {/* --- VIEW: NEURAL CORE (AI) --- */}
        {activeSubTab === 'NEURAL_CORE' && (
            <div className="space-y-6 animate-slide-up">
                <div className="bg-[#1F2128] border border-white/10 p-6 rounded-[2.5rem] relative overflow-hidden">
                    <div className="absolute top-0 right-0 w-32 h-32 bg-purple-500/20 rounded-full blur-[40px]"></div>
                    <div className="flex items-center gap-3 mb-6 relative z-10">
                         <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400 border border-purple-500/30">🧠</div>
                         <div>
                             <h3 className="text-white font-bold">Системный Промпт</h3>
                             <p className="text-white/40 text-xs">Личность Командира</p>
                         </div>
                    </div>
                    <textarea 
                        value={systemInstruction}
                        onChange={(e) => setSystemInstruction(e.target.value)}
                        className="w-full h-48 bg-black/30 border border-white/10 rounded-2xl p-4 text-white/90 text-sm leading-relaxed font-mono outline-none focus:border-purple-500 transition-colors resize-none mb-4"
                    />
                    <Button onClick={handleSaveAIConfig} fullWidth className="!bg-purple-600 hover:!bg-purple-500">Сохранить Личность</Button>
                </div>

                <div className="bg-surface border border-border-color p-6 rounded-[2.5rem]">
                    <h3 className="font-bold text-text-primary mb-4">Настройки Модели</h3>
                    <div className="space-y-2">
                         <div className="p-4 bg-body rounded-2xl border border-border-color flex justify-between items-center">
                             <span className="text-sm font-bold">Google Gemini 1.5 Flash</span>
                             <span className="text-[10px] bg-green-500/10 text-green-500 px-2 py-1 rounded-lg font-black uppercase">Active</span>
                         </div>
                         <div className="p-4 bg-body rounded-2xl border border-border-color flex justify-between items-center opacity-50">
                             <span className="text-sm font-bold">OpenAI GPT-4o</span>
                             <span className="text-[10px] text-text-secondary px-2 py-1 rounded-lg font-black uppercase">Disabled</span>
                         </div>
                    </div>
                </div>
            </div>
        )}

        {/* --- VIEW: COURSE --- */}
        {activeSubTab === 'COURSE' && (
             <div className="space-y-4 animate-slide-up">
                 {modules.map((mod, i) => (
                     <div key={mod.id} className="bg-surface border border-border-color p-5 rounded-[2rem] flex items-center gap-4 group">
                         <div className="w-12 h-12 rounded-2xl bg-body flex items-center justify-center font-black text-text-secondary text-sm border border-border-color">
                             {i + 1}
                         </div>
                         <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-text-primary truncate">{mod.title}</h4>
                             <p className="text-xs text-text-secondary">{mod.lessons.length} уроков</p>
                         </div>
                         <button onClick={() => handleDeleteModule(mod.id)} className="w-10 h-10 rounded-full bg-red-500/10 text-red-500 flex items-center justify-center hover:bg-red-500 hover:text-white transition-all">
                             🗑️
                         </button>
                     </div>
                 ))}
                 <button className="w-full py-4 border-2 border-dashed border-border-color rounded-[2rem] text-text-secondary font-black uppercase text-xs hover:border-[#6C5DD3] hover:text-[#6C5DD3] transition-all">
                     + Добавить Модуль
                 </button>
             </div>
        )}

        {/* --- VIEW: USERS --- */}
        {activeSubTab === 'USERS' && (
             <div className="space-y-4 animate-slide-up">
                 {users.map((user) => (
                     <div key={user.telegramId || user.name} className="bg-surface border border-border-color p-5 rounded-[2rem] flex items-center gap-4">
                         <img src={user.avatarUrl || `https://ui-avatars.com/api/?name=${user.name}`} className="w-10 h-10 rounded-full object-cover bg-body" />
                         <div className="flex-1 min-w-0">
                             <h4 className="font-bold text-text-primary truncate">{user.name}</h4>
                             <p className="text-[10px] font-black text-text-secondary uppercase">{user.role} • LVL {user.level}</p>
                         </div>
                         <button 
                            onClick={() => toggleUserRole(user)}
                            className={`px-3 py-1 rounded-lg text-[9px] font-black uppercase border ${user.role === 'ADMIN' ? 'bg-[#6C5DD3] text-white border-transparent' : 'border-border-color text-text-secondary'}`}
                         >
                             {user.role}
                         </button>
                     </div>
                 ))}
             </div>
        )}

        {/* --- VIEW: ARENA --- */}
        {activeSubTab === 'ARENA' && (
             <div className="space-y-4 animate-slide-up">
                 {scenarios.map((sc, i) => (
                     <div key={sc.id} className="bg-surface border border-border-color p-5 rounded-[2rem] relative overflow-hidden">
                         <div className={`absolute top-0 left-0 w-1 h-full ${sc.difficulty === 'Hard' ? 'bg-red-500' : sc.difficulty === 'Medium' ? 'bg-orange-500' : 'bg-green-500'}`}></div>
                         <div className="flex justify-between items-start mb-2 pl-3">
                             <h4 className="font-bold text-text-primary">{sc.title}</h4>
                             <span className="text-[9px] font-black uppercase text-text-secondary bg-body px-2 py-1 rounded-lg">{sc.difficulty}</span>
                         </div>
                         <p className="text-xs text-text-secondary pl-3 line-clamp-2">{sc.objective}</p>
                     </div>
                 ))}
                 <button className="w-full py-4 bg-[#6C5DD3] text-white rounded-[2rem] font-black uppercase text-xs shadow-lg shadow-[#6C5DD3]/20">
                     Создать Симуляцию
                 </button>
             </div>
        )}
        
        {/* --- VIEW: SETTINGS --- */}
        {activeSubTab === 'SETTINGS' && (
             <div className="space-y-6 animate-slide-up">
                 <div className="bg-surface border border-border-color p-6 rounded-[2.5rem]">
                     <h3 className="font-bold text-text-primary mb-6">Конфигурация Приложения</h3>
                     <div className="space-y-4">
                         <div className="flex items-center justify-between">
                             <div>
                                 <p className="font-bold text-sm">Технические работы</p>
                                 <p className="text-[10px] text-text-secondary">Блокирует доступ студентам</p>
                             </div>
                             <button 
                                onClick={() => toggleFeature('maintenanceMode')}
                                className={`w-12 h-7 rounded-full transition-colors relative ${config.features.maintenanceMode ? 'bg-[#6C5DD3]' : 'bg-gray-700'}`}
                             >
                                 <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${config.features.maintenanceMode ? 'left-6' : 'left-1'}`}></div>
                             </button>
                         </div>

                         <div className="flex items-center justify-between">
                             <div>
                                 <p className="font-bold text-sm">Авто-проверка ДЗ</p>
                                 <p className="text-[10px] text-text-secondary">ИИ принимает решения без куратора</p>
                             </div>
                             <button 
                                onClick={() => toggleFeature('autoApproveHomework')}
                                className={`w-12 h-7 rounded-full transition-colors relative ${config.features.autoApproveHomework ? 'bg-[#6C5DD3]' : 'bg-gray-700'}`}
                             >
                                 <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${config.features.autoApproveHomework ? 'left-6' : 'left-1'}`}></div>
                             </button>
                         </div>

                         <div className="flex items-center justify-between">
                             <div>
                                 <p className="font-bold text-sm">Публичный Рейтинг</p>
                                 <p className="text-[10px] text-text-secondary">Показывать ТОП-3 всем</p>
                             </div>
                             <button 
                                onClick={() => toggleFeature('publicLeaderboard')}
                                className={`w-12 h-7 rounded-full transition-colors relative ${config.features.publicLeaderboard ? 'bg-[#6C5DD3]' : 'bg-gray-700'}`}
                             >
                                 <div className={`absolute top-1 w-5 h-5 bg-white rounded-full transition-transform ${config.features.publicLeaderboard ? 'left-6' : 'left-1'}`}></div>
                             </button>
                         </div>
                     </div>
                 </div>

                 <div className="text-center">
                     <p className="text-[10px] text-text-secondary uppercase tracking-widest mb-2">Версия системы: 5.0.0</p>
                     <p className="text-[10px] text-text-secondary uppercase tracking-widest">Database: Neon PostgreSQL</p>
                 </div>
             </div>
        )}
    </div>
  );
};

const StatCard = ({ icon, label, value }: { icon: string, label: string, value: number }) => (
    <div className="bg-surface p-5 rounded-[2.5rem] border border-border-color shadow-sm group hover:border-[#6C5DD3]/30 transition-all">
        <div className="text-xl mb-2">{icon}</div>
        <div className="text-2xl font-black text-text-primary">{value}</div>
        <div className="text-[9px] font-black uppercase text-text-secondary tracking-widest">{label}</div>
    </div>
);
