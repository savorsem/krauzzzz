
import React, { useState } from 'react';
import { Module, UserProgress, Lesson } from '../types';
import { telegram } from '../services/telegramService';

interface ModuleListProps {
  modules: Module[];
  userProgress: UserProgress;
  onSelectLesson: (lesson: Lesson) => void;
  onBack: () => void;
}

export const ModuleList: React.FC<ModuleListProps> = ({ modules, userProgress, onSelectLesson }) => {
  const [shakingId, setShakingId] = useState<string | null>(null);

  const handleModuleClick = (module: Module, isLocked: boolean) => {
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
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-8">
        {modules.map((module, index) => {
            const isLocked = userProgress.level < module.minLevel;
            const completedCount = module.lessons.filter(l => userProgress.completedLessonIds.includes(l.id)).length;
            const totalCount = module.lessons.length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            
            // Refined Palette
            const accentColor = module.category === 'SALES' ? '#10B981' : // Emerald
                                module.category === 'PSYCHOLOGY' ? '#8B5CF6' : // Violet
                                module.category === 'TACTICS' ? '#EF4444' : // Red
                                '#6C5DD3'; // Default Purple

            // Calculate module number (Index + 1 padded)
            const moduleNum = (index + 1).toString().padStart(2, '0');

            return (
                <div 
                    key={module.id}
                    onClick={() => handleModuleClick(module, isLocked)}
                    className={`
                        relative w-full rounded-3xl overflow-hidden transition-all duration-300 group select-none min-h-[110px]
                        ${shakingId === module.id ? 'animate-shake' : ''}
                        ${isLocked ? 'grayscale opacity-70' : 'cursor-pointer hover:scale-[1.02] active:scale-[0.99] shadow-lg'}
                    `}
                    style={{ 
                        backgroundColor: '#14161B',
                        boxShadow: isLocked ? 'none' : `0 4px 20px -5px ${accentColor}20`,
                        border: '1px solid rgba(255,255,255,0.05)'
                    }}
                >
                    {/* Top Accent Line */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5" style={{ backgroundColor: accentColor }}></div>

                    {/* Content Container */}
                    <div className="relative z-10 p-4 pl-6 flex flex-col h-full justify-between">
                        
                        {/* Header: Number & Title */}
                        <div className="flex justify-between items-start gap-4">
                            <div className="flex flex-col">
                                <h2 className="text-3xl font-black text-transparent bg-clip-text bg-gradient-to-br from-white to-white/10 leading-none tracking-tighter opacity-20 absolute right-2 top-2 pointer-events-none">
                                    {moduleNum}
                                </h2>
                                <h3 className="text-sm font-bold text-white leading-tight line-clamp-2 pr-6 z-10">
                                    {module.title}
                                </h3>
                                <p className="text-[9px] font-bold uppercase tracking-wider opacity-60 mt-1" style={{ color: accentColor }}>
                                    {module.category}
                                </p>
                            </div>
                        </div>

                        {/* Bottom: Progress */}
                        <div className="mt-3 flex items-center gap-3">
                             <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                                <div 
                                    className="h-full transition-all duration-1000 ease-out"
                                    style={{ width: `${progressPercent}%`, backgroundColor: accentColor }}
                                ></div>
                             </div>
                             <span className="text-[9px] font-black text-white/40 min-w-[24px] text-right">
                                 {isLocked ? '🔒' : `${progressPercent}%`}
                             </span>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );
};
