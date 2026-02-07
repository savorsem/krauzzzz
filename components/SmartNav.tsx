
import React, { useRef, useState } from 'react';
import { Tab, UserRole, AppNotification, SmartNavAction } from '../types';
import { telegram } from '../services/telegramService';

interface SmartNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  role: UserRole;
  adminSubTab: string;
  setAdminSubTab: (tab: string) => void;
  isLessonActive: boolean;
  onExitLesson: () => void;
  notifications: AppNotification[];
  onClearNotifications: () => void;
  action?: SmartNavAction | null; 
}

export const SmartNav: React.FC<SmartNavProps> = ({ 
  activeTab, 
  setActiveTab, 
  role,
  adminSubTab,
  setAdminSubTab,
  isLessonActive,
  onExitLesson,
  notifications,
  onClearNotifications,
  action
}) => {
  const [expandedPanel, setExpandedPanel] = useState<'NONE' | 'NOTIFICATIONS'>('NONE');
  const touchStart = useRef<{ x: number, y: number } | null>(null);

  const unreadCount = notifications.filter(n => !n.isRead).length;

  const handleTabClick = (tab: Tab) => {
    telegram.haptic('selection');
    if (isLessonActive) onExitLesson();
    setActiveTab(tab);
    setExpandedPanel('NONE');
  };

  const toggleNotifs = () => {
    telegram.haptic('light');
    setExpandedPanel(prev => prev === 'NOTIFICATIONS' ? 'NONE' : 'NOTIFICATIONS');
  };

  const isHome = activeTab === Tab.HOME;
  const isProfile = activeTab === Tab.PROFILE;

  return (
    <div className="fixed bottom-0 left-0 right-0 z-[100] pb-[calc(var(--safe-bottom)+16px)] px-6 pointer-events-none flex justify-center">
      <div className="relative flex items-center justify-center gap-3 pointer-events-auto">
        
        {/* MAIN NAV ISLAND */}
        <div className={`
            flex items-center bg-[#0F1115]/95 backdrop-blur-2xl border border-white/10 shadow-[0_20px_40px_rgba(0,0,0,0.4)]
            rounded-[2.5rem] transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] overflow-hidden
            ${expandedPanel === 'NOTIFICATIONS' ? 'w-[320px] h-[300px] flex-col' : 'h-[64px] px-2 w-[220px]'}
        `}>
            {expandedPanel === 'NOTIFICATIONS' ? (
                <div className="w-full h-full flex flex-col p-6 animate-fade-in">
                    <div className="flex justify-between items-center mb-6">
                        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Уведомления</span>
                        <button onClick={onClearNotifications} className="text-[9px] text-white/40 font-bold">Очистить</button>
                    </div>
                    <div className="flex-1 overflow-y-auto space-y-3 no-scrollbar pb-12">
                        {notifications.length === 0 ? (
                            <div className="h-full flex items-center justify-center opacity-20 text-[10px] font-bold uppercase">Нет вестей</div>
                        ) : (
                            notifications.map(n => (
                                <div key={n.id} className="p-4 bg-white/5 rounded-2xl border border-white/5">
                                    <h4 className="text-[11px] font-bold text-white mb-1">{n.title}</h4>
                                    <p className="text-[10px] text-white/60 leading-tight">{n.message}</p>
                                </div>
                            ))
                        )}
                    </div>
                    <button onClick={() => setExpandedPanel('NONE')} className="absolute bottom-4 left-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white">✕</button>
                </div>
            ) : (
                <div className="flex items-center justify-around w-full h-full">
                    <button 
                        onClick={() => handleTabClick(Tab.HOME)}
                        className={`w-12 h-12 flex flex-col items-center justify-center transition-all ${isHome ? 'text-white' : 'text-white/30'}`}
                    >
                        <svg className="w-6 h-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isHome ? 2.5 : 2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
                        </svg>
                        {isHome && <div className="w-1 h-1 bg-[#6C5DD3] rounded-full shadow-[0_0_8px_#6C5DD3]"></div>}
                    </button>

                    <button 
                        onClick={() => handleTabClick(Tab.PROFILE)}
                        className={`w-12 h-12 flex flex-col items-center justify-center transition-all ${isProfile ? 'text-white' : 'text-white/30'}`}
                    >
                        <svg className="w-6 h-6 mb-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={isProfile ? 2.5 : 2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        {isProfile && <div className="w-1 h-1 bg-[#6C5DD3] rounded-full shadow-[0_0_8px_#6C5DD3]"></div>}
                    </button>
                </div>
            )}
        </div>

        {/* NOTIFICATION ISLAND */}
        <button 
            onClick={toggleNotifs}
            className={`
                flex items-center justify-center w-[64px] h-[64px] bg-[#0F1115]/95 backdrop-blur-2xl border border-white/10
                rounded-full shadow-[0_20px_40px_rgba(0,0,0,0.4)] transition-all duration-500
                ${expandedPanel === 'NOTIFICATIONS' ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}
            `}
        >
            <div className="relative">
                <svg className="w-6 h-6 text-white/80" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                {unreadCount > 0 && (
                    <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-600 rounded-full border-2 border-[#0F1115] animate-pulse"></span>
                )}
            </div>
        </button>

      </div>
    </div>
  );
};
