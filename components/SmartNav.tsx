
import React, { useRef, useEffect, useState } from 'react';
import { Tab, UserRole } from '../types';
import { telegram } from '../services/telegramService';

interface SmartNavProps {
  activeTab: Tab;
  setActiveTab: (tab: Tab) => void;
  role: UserRole;
  adminSubTab: string;
  setAdminSubTab: (tab: any) => void;
  isLessonActive: boolean;
  onExitLesson: () => void;
}

export const SmartNav: React.FC<SmartNavProps> = ({ 
  activeTab, 
  setActiveTab, 
  role,
  adminSubTab,
  setAdminSubTab,
  isLessonActive,
  onExitLesson
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  // Admin Sub-tabs Configuration
  const adminLinks = [
    { id: 'OVERVIEW', icon: '📊', label: 'Штаб' },
    { id: 'NEURAL_CORE', icon: '🧠', label: 'ИИ Ядро' },
    { id: 'COURSE', icon: '🎓', label: 'Курс' },
    { id: 'ARENA', icon: '⚔️', label: 'Арена' },
    { id: 'USERS', icon: '👥', label: 'Люди' },
    { id: 'SETTINGS', icon: '⚙️', label: 'Система' },
  ];

  const isAdminView = activeTab === Tab.ADMIN_DASHBOARD;
  const isMainTab = [Tab.HOME, Tab.PROFILE, Tab.ADMIN_DASHBOARD].includes(activeTab);
  
  // Logic: Show Back Button if in Lesson OR in a Sub-tab (Arena, Materials, etc)
  const showBackButton = isLessonActive || !isMainTab;

  // Auto-scroll admin tabs
  useEffect(() => {
    if (isAdminView) {
        setIsExpanded(true);
    } else {
        setIsExpanded(false);
    }
  }, [isAdminView]);

  const handleTabChange = (tab: Tab) => {
    if (tab === activeTab) return;
    telegram.haptic('selection');
    setActiveTab(tab);
  };

  const handleBack = () => {
      telegram.haptic('medium');
      if (isLessonActive) {
          onExitLesson();
      } else {
          setActiveTab(Tab.HOME);
      }
  };

  // --- RENDER: BACK BUTTON MODE (ISLAND MORPH) ---
  if (showBackButton) {
    return (
      <div className="fixed bottom-8 left-0 right-0 z-[100] px-6 flex justify-center pointer-events-none">
        <button 
            onClick={handleBack}
            className="pointer-events-auto group relative flex items-center gap-3 bg-[#16181D]/90 backdrop-blur-2xl border border-white/10 pr-5 pl-1.5 py-1.5 rounded-full shadow-[0_20px_40px_-10px_rgba(0,0,0,0.5)] active:scale-95 transition-all duration-500 ease-[cubic-bezier(0.23,1,0.32,1)] animate-island hover:border-[#6C5DD3]/30"
        >
            <div className="w-10 h-10 rounded-full bg-[#6C5DD3] flex items-center justify-center shadow-[0_0_15px_rgba(108,93,211,0.4)] group-hover:scale-110 transition-transform">
                <svg className="w-4 h-4 text-white -ml-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" />
                </svg>
            </div>
            <div className="flex flex-col items-start mr-2">
                <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#6C5DD3] opacity-80 group-hover:opacity-100 transition-opacity">
                    {isLessonActive ? 'В ШТАБ' : 'НАЗАД'}
                </span>
                <span className="text-[10px] font-bold text-white tracking-wide">
                    {isLessonActive ? 'ВЫЙТИ ИЗ БОЯ' : 'ГЛАВНОЕ МЕНЮ'}
                </span>
            </div>
        </button>
      </div>
    );
  }

  // --- RENDER: MAIN NAVIGATION MODE ---
  return (
    <div className="fixed bottom-6 left-0 right-0 z-[100] flex justify-center pointer-events-none px-4" style={{ paddingBottom: 'var(--safe-bottom)' }}>
      <div 
        className={`
          pointer-events-auto relative island-blur bg-[#0F1115]/90 overflow-hidden
          transition-all duration-500 cubic-bezier(0.23, 1, 0.32, 1) shadow-2xl border border-white/5
          ${isExpanded ? 'w-full max-w-[380px] rounded-[2.2rem] p-1.5' : 'w-auto px-1.5 py-1.5 rounded-full'}
        `}
      >
        {/* Background Mesh for Island */}
        <div className="absolute inset-0 opacity-20 pointer-events-none bg-[radial-gradient(circle_at_50%_100%,_rgba(108,93,211,0.2),_transparent_70%)]"></div>

        <div className="flex flex-col w-full relative z-10">
            
            {/* EXPANDED CONTENT (ADMIN SUB-TABS) */}
            <div 
                className={`
                    w-full overflow-x-auto no-scrollbar flex gap-1 mb-1 transition-all duration-500 ease-out origin-top
                    ${isExpanded ? 'max-h-[80px] opacity-100 py-1 scale-100' : 'max-h-0 opacity-0 py-0 scale-95'}
                `}
                ref={scrollRef}
            >
                {adminLinks.map((link) => (
                  <button
                    key={link.id}
                    onClick={() => { telegram.haptic('light'); setAdminSubTab(link.id); }}
                    className={`
                        flex-shrink-0 flex flex-col items-center justify-center w-[70px] h-[60px] rounded-2xl transition-all border
                        ${adminSubTab === link.id 
                            ? 'bg-[#6C5DD3] border-[#6C5DD3] text-white shadow-lg shadow-[#6C5DD3]/20' 
                            : 'bg-white/5 border-transparent text-white/40 hover:bg-white/10 hover:text-white'}
                    `}
                  >
                    <span className="text-xl mb-1">{link.icon}</span>
                    <span className="text-[8px] font-black uppercase tracking-tight">{link.label}</span>
                  </button>
                ))}
            </div>

            {/* MAIN ROW */}
            <div className={`flex items-center justify-between transition-all duration-500 ${isExpanded ? 'w-full px-4 h-14' : 'gap-2 h-16'}`}>
                
                <NavButton 
                    isActive={activeTab === Tab.HOME}
                    onClick={() => handleTabChange(Tab.HOME)}
                    icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path><polyline points="9 22 9 12 15 12 15 22"></polyline></svg>}
                    label="Главная"
                />
                
                {/* Separator / Decoration */}
                {!isExpanded && <div className="w-px h-8 bg-white/5 mx-1"></div>}

                <NavButton 
                    isActive={activeTab === Tab.PROFILE}
                    onClick={() => handleTabChange(Tab.PROFILE)}
                    icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>}
                    label="Профиль"
                />

                {role === 'ADMIN' && (
                    <>
                        {!isExpanded && <div className="w-px h-8 bg-white/5 mx-1"></div>}
                        <NavButton 
                            isActive={activeTab === Tab.ADMIN_DASHBOARD}
                            onClick={() => handleTabChange(Tab.ADMIN_DASHBOARD)}
                            icon={<svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"></path><path d="M12 2v10l4.24-4.24"></path></svg>}
                            label="Админ"
                            badge={true}
                            isAdmin
                        />
                    </>
                )}
            </div>
        </div>
      </div>
    </div>
  );
};

// --- SUB-COMPONENT: NAV BUTTON ---
const NavButton = ({ isActive, onClick, icon, label, badge, isAdmin }: { isActive: boolean, onClick: () => void, icon: React.ReactNode, label: string, badge?: boolean, isAdmin?: boolean }) => (
    <button 
      onClick={onClick} 
      className={`
        relative w-16 h-full flex flex-col items-center justify-center transition-all duration-300 rounded-2xl group
        ${isActive ? '' : 'hover:bg-white/5'}
      `}
    >
      {/* Active Lamp Effect */}
      <div className={`
        absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-4 rounded-t-full blur-md transition-all duration-500
        ${isActive ? 'bg-[#6C5DD3] opacity-60' : 'bg-transparent opacity-0'}
      `}></div>

      {/* Icon Wrapper */}
      <div className={`
        relative transition-all duration-300 flex items-center justify-center
        ${isActive ? 'text-white -translate-y-1 scale-110 drop-shadow-[0_0_12px_rgba(108,93,211,0.6)]' : 'text-slate-500 group-hover:text-white'}
        ${isAdmin && isActive ? 'text-[#FFAB7B] drop-shadow-[0_0_12px_rgba(255,171,123,0.6)]' : ''}
      `}>
          {icon}
          {badge && (
            <span className="absolute -top-1 -right-1 flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500 border border-[#0F1115]"></span>
            </span>
          )}
      </div>

      {/* Label */}
      <span className={`
        text-[9px] font-black uppercase mt-1 tracking-tighter transition-all duration-300
        ${isActive ? 'text-white opacity-100 translate-y-0' : 'text-slate-500 opacity-0 translate-y-2 group-hover:opacity-100 group-hover:translate-y-0'}
      `}>
          {label}
      </span>
      
      {/* Active Dot */}
      <div className={`
        absolute bottom-1 w-1 h-1 rounded-full bg-white transition-all duration-300
        ${isActive ? 'opacity-100 scale-100 shadow-[0_0_5px_white]' : 'opacity-0 scale-0'}
      `}></div>
    </button>
);
