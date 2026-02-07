
import React, { useEffect, useState } from 'react';
import ReactPlayer from 'react-player';
import { Tab, UserProgress, Lesson, Material, Stream, ArenaScenario, AppNotification, Module, AppConfig } from '../types';
import { ModuleList } from './ModuleList';
import { telegram } from '../services/telegramService';

const VideoPlayer = ReactPlayer as unknown as React.ComponentType<any>;

interface HomeDashboardProps {
  onNavigate: (tab: Tab) => void;
  userProgress: UserProgress;
  onProfileClick: () => void;
  modules: Module[];
  materials: Material[];
  streams: Stream[];
  scenarios: ArenaScenario[];
  onSelectLesson: (lesson: Lesson) => void;
  onUpdateUser: (data: Partial<UserProgress>) => void;
  allUsers: UserProgress[];
  notifications?: AppNotification[];
  appConfig?: AppConfig;
}

const QUOTES = [
  "Продажа начинается после слова 'Нет'.",
  "Твой доход — это уровень твоей пользы для рынка.",
  "Дисциплина — это решение делать то, чего очень не хочется делать, чтобы достичь того, чего очень хочется достичь.",
  "Клиент покупает не продукт, а решение своей проблемы.",
  "Спартанцы не спрашивают, сколько врагов, они спрашивают, где они.",
  "Побеждают не числом, а умением.",
  "Страх — это просто сигнал к действию."
];

const MOCK_INTEL = [
    { user: 'Агент 007', action: 'закрыл сделку на 1M', type: 'money' },
    { user: 'Мария К.', action: 'получила ранг Ветеран', type: 'rank' },
    { user: 'Алекс', action: 'выполнил миссию "Холодный звонок"', type: 'mission' },
    { user: 'Дмитрий', action: 'зашел в Арену', type: 'arena' },
];

export const HomeDashboard: React.FC<HomeDashboardProps> = ({ 
  onNavigate, 
  userProgress, 
  onProfileClick,
  modules,
  onSelectLesson,
  appConfig,
  scenarios
}) => {
  const [quote, setQuote] = useState('');
  const [intelIndex, setIntelIndex] = useState(0);

  useEffect(() => {
      setQuote(QUOTES[new Date().getDate() % QUOTES.length]);
      const interval = setInterval(() => {
          setIntelIndex(prev => (prev + 1) % MOCK_INTEL.length);
      }, 3000);
      return () => clearInterval(interval);
  }, []);

  const totalLessons = modules.reduce((acc, m) => acc + m.lessons.length, 0);
  const completedCount = userProgress.completedLessonIds.length;
  const overallProgress = totalLessons > 0 ? Math.round((completedCount / totalLessons) * 100) : 0;
  const isAuthenticated = userProgress.isAuthenticated;

  // Time based greeting
  const hour = new Date().getHours();
  const greeting = hour < 5 ? 'Ночной дозор' : hour < 12 ? 'Доброе утро' : hour < 18 ? 'Добрый день' : 'Добрый вечер';

  const handleStartPath = () => {
    telegram.haptic('heavy');
    if (!isAuthenticated) {
        onProfileClick();
    } else {
        const firstIncomplete = modules.flatMap(m => m.lessons).find(l => !userProgress.completedLessonIds.includes(l.id));
        if (firstIncomplete) onSelectLesson(firstIncomplete);
        else if (modules[0]?.lessons[0]) onSelectLesson(modules[0].lessons[0]);
    }
  };

  const activeIntel = MOCK_INTEL[intelIndex];

  return (
    <div className="min-h-screen bg-transparent relative overflow-hidden pb-40">
      
      {/* 1. HEADER & STATUS */}
      <div className="px-6 pt-[calc(var(--safe-top)+10px)] pb-2 flex justify-between items-center sticky top-0 z-40 bg-body/80 backdrop-blur-xl border-b border-white/5 transition-all">
          <div className="flex items-center gap-3" onClick={onProfileClick}>
              <div className="relative group">
                  <div className={`absolute inset-0 bg-gradient-to-tr ${isAuthenticated ? 'from-[#6C5DD3] to-[#FFAB7B]' : 'from-slate-400 to-slate-600'} rounded-full blur-[4px] opacity-70 group-hover:opacity-100 transition-opacity`}></div>
                  <img 
                    src={userProgress.avatarUrl || `https://ui-avatars.com/api/?name=${userProgress.name}&background=1A1A1A&color=fff`} 
                    className="relative w-10 h-10 rounded-full object-cover border border-white/10" 
                  />
                  {isAuthenticated && (
                      <div className="absolute -bottom-1 -right-1 bg-[#1F2128] text-white text-[8px] font-black px-1.5 py-0.5 rounded-md border border-white/10">
                          L{userProgress.level}
                      </div>
                  )}
              </div>
              <div className="flex flex-col">
                  <span className="text-[#6C5DD3] text-[9px] font-black uppercase tracking-[0.1em]">{greeting}</span>
                  <h1 className="text-sm font-black text-text-primary tracking-tight leading-none">{userProgress.name}</h1>
              </div>
          </div>
          <button 
            onClick={onProfileClick}
            className="w-10 h-10 rounded-xl bg-surface border border-border-color flex items-center justify-center relative overflow-hidden group active:scale-95 transition-transform"
          >
             <div className="absolute inset-0 bg-[#6C5DD3]/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
             <span className="text-xl">⚙️</span>
          </button>
      </div>

      <div className="px-5 pt-6 space-y-8 animate-fade-in max-w-2xl mx-auto">
        
        {/* 2. STATS SCROLLER (Horizontal) */}
        {isAuthenticated && (
            <div className="flex gap-3 overflow-x-auto no-scrollbar pb-1">
                {[
                    { label: 'XP Total', value: userProgress.xp, icon: '⚡', color: 'text-yellow-500' },
                    { label: 'Стрик', value: `${Math.max(...(userProgress.habits?.map(h => h.streak) || [0]))} дн`, icon: '🔥', color: 'text-orange-500' },
                    { label: 'Задачи', value: `${completedCount}/${totalLessons}`, icon: '🎯', color: 'text-blue-500' },
                ].map((stat, i) => (
                    <div key={i} className="flex-shrink-0 bg-surface border border-border-color rounded-2xl p-3 flex items-center gap-3 min-w-[120px] shadow-sm">
                        <div className={`text-lg ${stat.color}`}>{stat.icon}</div>
                        <div>
                            <div className="text-[9px] font-bold text-text-secondary uppercase tracking-wider">{stat.label}</div>
                            <div className="text-xs font-black text-text-primary">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>
        )}

        {/* 3. HERO: DAILY MISSION & BRIEFING */}
        <div className="space-y-4">
            {/* Video Card */}
            <div className="relative rounded-[2.5rem] overflow-hidden bg-[#050505] shadow-2xl group border border-white/5 isolate">
                 <div className="aspect-video w-full relative opacity-80 group-hover:opacity-100 transition-opacity duration-500">
                     <VideoPlayer 
                        url={appConfig?.welcomeVideoUrl || "https://www.youtube.com/watch?v=dQw4w9WgXcQ"} 
                        width="100%" 
                        height="100%" 
                        light={true}
                        playIcon={
                            <div className="w-16 h-16 bg-white/10 backdrop-blur-md border border-white/20 rounded-full flex items-center justify-center text-white text-3xl group-hover:scale-110 group-hover:bg-[#6C5DD3] transition-all shadow-[0_0_30px_rgba(108,93,211,0.4)]">
                                ▶
                            </div>
                        }
                     />
                     <div className="absolute inset-0 bg-gradient-to-t from-[#050505] via-transparent to-transparent pointer-events-none"></div>
                 </div>

                 <div className="absolute bottom-0 left-0 right-0 p-6 space-y-4">
                     <div>
                        <div className="flex items-center gap-2 mb-1">
                            <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse"></span>
                            <span className="text-[9px] font-black text-red-500 uppercase tracking-widest">Live Mission</span>
                        </div>
                        <h2 className="text-xl font-black text-white tracking-tight leading-tight">Академия Продаж</h2>
                     </div>

                     <button 
                        onClick={handleStartPath}
                        className="w-full h-12 bg-white text-black rounded-2xl flex items-center justify-center gap-2 group/btn active:scale-[0.98] transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(108,93,211,0.4)] relative overflow-hidden"
                     >
                        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-[#6C5DD3]/20 to-transparent translate-x-[-100%] group-hover/btn:animate-shimmer"></div>
                        <span className="text-[10px] font-black uppercase tracking-[0.2em] relative z-10">
                            {isAuthenticated ? 'Продолжить' : 'Начать путь'}
                        </span>
                        <span className="text-lg transition-transform group-hover/btn:translate-x-1 relative z-10">→</span>
                     </button>
                 </div>
            </div>

            {/* Daily Briefing Card */}
            <div className="bg-surface border border-border-color rounded-[2rem] p-5 relative overflow-hidden">
                <div className="absolute -right-4 -top-4 text-[100px] opacity-[0.03] rotate-12 font-serif">"</div>
                <div className="flex flex-col gap-2 relative z-10">
                    <span className="text-[9px] font-black text-[#6C5DD3] uppercase tracking-widest flex items-center gap-2">
                        <span className="text-lg">💡</span> Тактика дня
                    </span>
                    <p className="text-xs font-medium text-text-primary leading-relaxed italic">
                        "{quote}"
                    </p>
                </div>
            </div>
        </div>

        {/* 4. COMMAND POINT (BENTO GRID) */}
        <div className="space-y-4">
            <div className="flex justify-between items-end px-2">
                <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] opacity-60">Командный Пункт</h3>
                <span className="text-[9px] font-bold text-[#00B050] animate-pulse">● System Online</span>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
                {/* Arena - Big Card */}
                <button 
                    onClick={() => { telegram.haptic('selection'); onNavigate(Tab.ARENA); }}
                    className="col-span-2 bg-[#1F2128] rounded-[2.5rem] p-6 relative overflow-hidden group border border-white/5 h-32 flex flex-col justify-center items-start text-left shadow-lg"
                >
                    <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
                    <div className="absolute inset-0 bg-gradient-to-r from-[#6C5DD3]/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
                    <div className="absolute right-0 top-0 bottom-0 w-1/2 bg-gradient-to-l from-[#6C5DD3]/10 to-transparent"></div>
                    
                    <div className="relative z-10">
                        <div className="flex items-center gap-2 mb-1">
                            <span className="text-2xl">⚔️</span>
                            <h4 className="text-lg font-black text-white tracking-wide">АРЕНА</h4>
                        </div>
                        <p className="text-[10px] text-white/50 font-medium max-w-[70%]">Симуляция переговоров с AI. Отработай возражения.</p>
                    </div>
                    
                    <div className="absolute bottom-4 right-6 bg-[#6C5DD3] text-white text-[9px] font-black px-3 py-1.5 rounded-lg uppercase tracking-widest shadow-lg group-hover:scale-105 transition-transform">
                        В Бой
                    </div>
                </button>

                {/* Tracker - Medium Card */}
                <button 
                    onClick={() => { telegram.haptic('selection'); onNavigate(Tab.HABITS); }}
                    className="bg-surface rounded-[2rem] p-5 border border-border-color flex flex-col justify-between h-32 group relative overflow-hidden active:scale-[0.98] transition-all"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">🔥</div>
                    <div className="w-10 h-10 rounded-xl bg-orange-500/10 text-orange-500 flex items-center justify-center text-xl">
                        📊
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest block mb-1">Дисциплина</span>
                        <h4 className="text-sm font-black text-text-primary">Трекер</h4>
                    </div>
                </button>

                {/* Video Hub - Medium Card */}
                <button 
                    onClick={() => { telegram.haptic('selection'); onNavigate(Tab.STREAMS); }}
                    className="bg-surface rounded-[2rem] p-5 border border-border-color flex flex-col justify-between h-32 group relative overflow-hidden active:scale-[0.98] transition-all"
                >
                    <div className="absolute top-0 right-0 p-3 opacity-10 group-hover:opacity-20 transition-opacity text-4xl">🎬</div>
                    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center text-xl">
                        📹
                    </div>
                    <div>
                        <span className="text-[9px] font-black text-text-secondary uppercase tracking-widest block mb-1">Медиа</span>
                        <h4 className="text-sm font-black text-text-primary">Эфиры</h4>
                    </div>
                </button>

                {/* Materials & Notebook - Small Wide Cards */}
                <button 
                    onClick={() => { telegram.haptic('selection'); onNavigate(Tab.MATERIALS); }}
                    className="col-span-2 sm:col-span-1 bg-surface rounded-[2rem] p-4 border border-border-color flex items-center gap-4 group active:scale-[0.98] transition-all"
                >
                    <div className="w-10 h-10 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-lg">📂</div>
                    <div className="text-left">
                        <h4 className="text-xs font-black text-text-primary uppercase tracking-wide">База Знаний</h4>
                        <p className="text-[9px] text-text-secondary">Скрипты и книги</p>
                    </div>
                </button>

                <button 
                    onClick={() => { telegram.haptic('selection'); onNavigate(Tab.NOTEBOOK); }}
                    className="col-span-2 sm:col-span-1 bg-surface rounded-[2rem] p-4 border border-border-color flex items-center gap-4 group active:scale-[0.98] transition-all"
                >
                    <div className="w-10 h-10 rounded-xl bg-blue-500/10 text-blue-500 flex items-center justify-center text-lg">📝</div>
                    <div className="text-left">
                        <h4 className="text-xs font-black text-text-primary uppercase tracking-wide">Блокнот</h4>
                        <p className="text-[9px] text-text-secondary">Инсайты и идеи</p>
                    </div>
                </button>
            </div>
        </div>

        {/* 5. LIVE INTEL (NEW) */}
        <div className="bg-[#14161B] rounded-2xl p-4 border border-white/5 flex items-center gap-4 overflow-hidden relative">
            <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#6C5DD3]"></div>
            <div className="w-8 h-8 rounded-full bg-[#6C5DD3]/10 flex items-center justify-center text-lg animate-pulse">
                📡
            </div>
            <div className="flex-1 min-w-0">
                <p className="text-[9px] font-black text-[#6C5DD3] uppercase tracking-widest mb-0.5">Разведданные (Live)</p>
                <div className="relative h-4 overflow-hidden">
                    <div key={intelIndex} className="absolute inset-0 animate-slide-up">
                        <p className="text-xs text-white/80 font-medium truncate">
                            <span className="font-bold text-white">{activeIntel.user}</span> {activeIntel.action}
                        </p>
                    </div>
                </div>
            </div>
        </div>

        {/* 6. ACADEMY PREVIEW */}
        <div className="space-y-4 pt-4">
             <div className="flex justify-between items-center px-2">
                 <h3 className="text-[11px] font-black text-text-primary uppercase tracking-[0.2em] opacity-60">Академия</h3>
                 <button onClick={() => onNavigate(Tab.MODULES)} className="text-[10px] font-bold text-[#6C5DD3]">Открыть все</button>
             </div>
             <ModuleList modules={modules.slice(0, 1)} userProgress={userProgress} onSelectLesson={onSelectLesson} onBack={() => {}} />
        </div>
      </div>
    </div>
  );
};
