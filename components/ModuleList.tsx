
import React, { useState } from 'react';
import { Module, UserProgress, Lesson } from '../types';
import { telegram } from '../services/telegramService';

interface ModuleListProps {
  modules: Module[];
  userProgress: UserProgress;
  onSelectLesson: (lesson: Lesson) => void;
  onBack: () => void;
}

const getYouTubeThumbnail = (url?: string) => {
    if (!url) return null;
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) 
      ? `https://img.youtube.com/vi/${match[2]}/maxresdefault.jpg` 
      : null;
};

export const ModuleList: React.FC<ModuleListProps> = ({ modules, userProgress, onSelectLesson }) => {
  const [shakingId, setShakingId] = useState<string | null>(null);
  const isAuthenticated = userProgress.isAuthenticated;

  const handleModuleClick = (module: Module, isLocked: boolean) => {
    if (!isAuthenticated) {
        setShakingId(module.id);
        telegram.haptic('error');
        telegram.showAlert('Доступ закрыт. Пожалуйста, авторизуйтесь.', 'Security');
        setTimeout(() => setShakingId(null), 400);
        return;
    }

    if (isLocked) {
        setShakingId(module.id);
        telegram.haptic('error');
        setTimeout(() => setShakingId(null), 400);
        return;
    }
    
    telegram.haptic('medium');
    const nextLesson = module.lessons.find(l => !userProgress.completedLessonIds.includes(l.id)) || module.lessons[0];
    if (nextLesson) onSelectLesson(nextLesson);
  };

  return (
    <div className="grid grid-cols-1 gap-3 pb-24 sm:grid-cols-2">
        {modules.map((module) => {
            const isLevelLocked = userProgress.level < module.minLevel;
            const isLocked = isLevelLocked || !isAuthenticated;
            
            const completedCount = module.lessons.filter(l => userProgress.completedLessonIds.includes(l.id)).length;
            const totalCount = module.lessons.length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isCompleted = progressPercent === 100;
            
            // Resolve Image
            const bgImage = module.imageUrl || getYouTubeThumbnail(module.videoUrl);

            // Visual Config based on Category
            const getConfig = (cat: string) => {
                switch(cat) {
                    case 'SALES': return { 
                        border: 'border-emerald-500/50',
                        accent: '#10B981', 
                        icon: '💰'
                    };
                    case 'PSYCHOLOGY': return { 
                        border: 'border-violet-500/50',
                        accent: '#8B5CF6', 
                        icon: '🧠' 
                    };
                    case 'TACTICS': return { 
                        border: 'border-rose-500/50',
                        accent: '#F43F5E', 
                        icon: '⚔️' 
                    };
                    default: return { 
                        border: 'border-indigo-500/50',
                        accent: '#6366f1', 
                        icon: '🛡️' 
                    };
                }
            };

            const style = getConfig(module.category);
            
            return (
                <div 
                    key={module.id}
                    onClick={() => handleModuleClick(module, isLocked)}
                    className={`
                        relative w-full h-44 sm:h-48 rounded-[1.5rem] overflow-hidden transition-all duration-300
                        flex flex-col justify-end group active:scale-[0.98] shadow-lg
                        ${isLocked ? 'grayscale opacity-70 cursor-not-allowed' : 'hover:shadow-xl hover:-translate-y-0.5'}
                        ${shakingId === module.id ? 'animate-shake' : ''}
                        border ${style.border}
                    `}
                >
                    {/* BACKGROUND IMAGE LAYER */}
                    <div className="absolute inset-0 bg-[#16181D]">
                        {bgImage ? (
                            <img 
                                src={bgImage} 
                                alt={module.title}
                                className="w-full h-full object-cover transition-transform duration-[3s] ease-out group-hover:scale-110 opacity-70"
                            />
                        ) : (
                            <div className={`w-full h-full bg-gradient-to-br from-[#16181D] to-[#2C2F36] opacity-50`}></div>
                        )}
                        {/* Stronger overlay for readability on short cards */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
                    </div>

                    {/* LOCKED OVERLAY */}
                    {isLocked && (
                        <div className="absolute inset-0 flex items-center justify-center z-20 bg-black/50 backdrop-blur-[1px]">
                            <div className="bg-black/80 border border-white/10 rounded-xl px-4 py-2 flex items-center gap-2 backdrop-blur-md">
                                <span className="text-lg">🔒</span>
                                <span className="text-[10px] font-black uppercase text-white tracking-widest">{isAuthenticated ? `LVL ${module.minLevel}` : 'LOCKED'}</span>
                            </div>
                        </div>
                    )}

                    {/* CONTENT LAYER */}
                    <div className="relative z-10 p-4 w-full">
                        <div className="flex justify-between items-start mb-1">
                            <div className="flex items-center gap-2">
                                <span className="text-lg leading-none drop-shadow-md">{style.icon}</span>
                                <h3 className="text-sm font-black text-white leading-tight drop-shadow-md line-clamp-1">
                                    {module.title}
                                </h3>
                            </div>
                            
                            {isCompleted && (
                                <div className="w-5 h-5 rounded-full bg-[#00B050] flex items-center justify-center shadow-lg shadow-[#00B050]/40 -mt-1">
                                    <span className="text-white font-black text-[9px]">✓</span>
                                </div>
                            )}
                        </div>

                        <p className="text-[9px] font-medium text-white/70 line-clamp-1 mb-2 leading-tight">
                            {module.description}
                        </p>

                        {/* Compact Progress Bar */}
                        {!isLocked && (
                             <div className="flex items-center gap-2">
                                 <div className="flex-1 h-1 bg-white/10 rounded-full overflow-hidden backdrop-blur-sm border border-white/5">
                                     <div 
                                        className="h-full rounded-full transition-all duration-700 ease-out relative" 
                                        style={{ 
                                            width: `${progressPercent}%`, 
                                            backgroundColor: style.accent,
                                            boxShadow: `0 0 8px ${style.accent}`
                                        }}
                                     ></div>
                                 </div>
                                 <span className="text-[8px] font-black" style={{ color: style.accent }}>
                                     {Math.round(progressPercent)}%
                                 </span>
                             </div>
                        )}
                    </div>
                </div>
            );
        })}
    </div>
  );
};
