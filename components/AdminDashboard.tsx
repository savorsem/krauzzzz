
import React, { useState } from 'react';
import { AppConfig, Module, UserProgress, Material, Stream, CalendarEvent, ArenaScenario, EventType, AppNotification, Lesson, UserRole } from '../types';
import { Button } from './Button';

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
  activeSubTab: string;
  onSendBroadcast: (notif: AppNotification) => void;
  notifications: AppNotification[];
  onClearNotifications: () => void;
  addToast: (type: 'success' | 'error' | 'info', message: string, link?: string) => void;
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ 
  config, onUpdateConfig, 
  modules, onUpdateModules, 
  materials, onUpdateMaterials,
  streams, onUpdateStreams,
  events, onUpdateEvents,
  scenarios, onUpdateScenarios,
  users, onUpdateUsers,
  activeSubTab, onSendBroadcast, notifications, onClearNotifications, addToast
}) => {

  const [notifTitle, setNotifTitle] = useState('');
  const [notifMsg, setNotifMsg] = useState('');
  const [notifType, setNotifType] = useState<AppNotification['type']>('INFO');

  const sendNotif = () => {
      if(!notifTitle || !notifMsg) return;
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
  };

  return (
    <div className="min-h-screen pb-32 pt-[calc(var(--safe-top)+20px)] px-6 space-y-8 animate-fade-in">
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
            <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                    <StatCard icon="👥" label="Бойцов" value={users.length} />
                    <StatCard icon="📦" label="Модулей" value={modules.length} />
                    <StatCard icon="📅" label="Событий" value={events.length} />
                    <StatCard icon="🎥" label="Эфиров" value={streams.length} />
                </div>
                
                <div className="bg-surface border border-border-color p-6 rounded-[2.5rem] shadow-sm space-y-4">
                    <h3 className="font-black text-xs uppercase tracking-widest text-[#6C5DD3] flex items-center gap-2">
                        <span className="animate-pulse">📡</span> Системное Оповещение
                    </h3>
                    <input value={notifTitle} onChange={e => setNotifTitle(e.target.value)} className="w-full bg-body border border-border-color p-4 rounded-2xl text-sm font-bold outline-none focus:border-[#6C5DD3] transition-all" placeholder="Заголовок" />
                    <textarea value={notifMsg} onChange={e => setNotifMsg(e.target.value)} className="w-full bg-body border border-border-color p-4 rounded-2xl text-sm h-24 resize-none outline-none focus:border-[#6C5DD3] transition-all" placeholder="Текст сообщения..." />
                    <div className="flex gap-2">
                        {['INFO', 'SUCCESS', 'WARNING', 'ALERT'].map(t => (
                            <button key={t} onClick={() => setNotifType(t as any)} className={`flex-1 py-2 rounded-xl text-[8px] font-black uppercase border transition-all ${notifType === t ? 'bg-[#6C5DD3] text-white border-[#6C5DD3]' : 'border-border-color text-text-secondary'}`}>{t}</button>
                        ))}
                    </div>
                    <Button onClick={sendNotif} fullWidth className="!rounded-2xl !py-4">ОТПРАВИТЬ ВСЕМ</Button>
                </div>
            </div>
        )}

        {/* ... (Existing logic for other subtabs remains connected via App.tsx) ... */}
        {activeSubTab !== 'OVERVIEW' && (
            <div className="py-20 text-center opacity-30 italic text-sm">
                Раздел "{activeSubTab}" открыт. <br/> Управляйте данными через соответствующие интерфейсы.
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
