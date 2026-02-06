
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-8">
        {modules.map((module, index) => {
            const isLocked = userProgress.level < module.minLevel;
            const completedCount = module.lessons.filter(l => userProgress.completedLessonIds.includes(l.id)).length;
            const totalCount = module.lessons.length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isCompleted = progressPercent === 100;
            
            // Refined Palette
            const accentColor = module.category === 'SALES' ? '#10B981' : // Emerald
                                module.category === 'PSYCHOLOGY' ? '#8B5CF6' : // Violet
                                module.category === 'TACTICS' ? '#F43F5E' : // Rose
                                '#6C5DD3'; // Default Purple

            const moduleNum = (index + 1).toString().padStart(2, '0');

            return (
                <div 
                    key={module.id}
                    onClick={() => handleModuleClick(module, isLocked)}
                    className={`
                        relative w-full rounded-[1.5rem] overflow-hidden transition-all duration-300 group select-none
                        min-h-[110px] flex flex-col justify-between
                        ${shakingId === module.id ? 'animate-shake' : ''}
                        ${isLocked ? 'opacity-70 grayscale' : 'cursor-pointer hover:shadow-lg active:scale-[0.98]'}
                    `}
                    style={{ 
                        background: isLocked 
                            ? '#16181D' 
                            : `rgba(22, 24, 29, 0.7)`,
                        backdropFilter: 'blur(10px)',
                        border: isLocked ? '1px solid rgba(255,255,255,0.05)' : `1px solid ${accentColor}30`,
                        boxShadow: isLocked ? 'none' : `0 4px 20px -5px ${accentColor}15`
                    }}
                >
                    {/* Watermark Number */}
                    <div className="absolute -right-2 -bottom-4 text-[5rem] font-black leading-none tracking-tighter opacity-5 select-none pointer-events-none" style={{ color: isLocked ? '#FFF' : accentColor }}>
                        {moduleNum}
                    </div>

                    {/* Gradient Mesh Overlay */}
                    {!isLocked && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/5 to-transparent opacity-50 pointer-events-none"></div>
                    )}

                    <div className="relative z-10 p-5 flex flex-col h-full">
                        <div className="flex justify-between items-start gap-4 mb-3">
                            <div className="flex-1">
                                <div className="flex items-center gap-2 mb-1.5">
                                    <span 
                                        className="text-[8px] font-black uppercase tracking-[0.2em] px-1.5 py-0.5 rounded-md border"
                                        style={{ 
                                            color: isLocked ? '#64748B' : accentColor,
                                            borderColor: isLocked ? '#334155' : `${accentColor}40`,
                                            backgroundColor: isLocked ? 'transparent' : `${accentColor}10`
                                        }}
                                    >
                                        {module.category}
                                    </span>
                                    {isCompleted && <span className="text-[8px] text-green-500 font-bold">✓ DONE</span>}
                                </div>
                                <h3 className={`text-sm font-bold leading-tight line-clamp-2 ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                                    {module.title}
                                </h3>
                            </div>
                            
                            {/* Status Icon */}
                            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border flex-shrink-0 ${
                                 isLocked 
                                 ? 'border-white/5 text-slate-600 bg-white/5' 
                                 : 'border-white/10 text-white bg-white/5 shadow-inner'
                             }`} style={{ borderColor: !isLocked ? `${accentColor}30` : '' }}>
                                 {isLocked ? (
                                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                 ) : (
                                     <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: accentColor }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                 )}
                             </div>
                        </div>

                        {/* Progress Bar & Stats */}
                        <div className="mt-auto">
                             <div className="flex justify-between items-end mb-1.5">
                                 <div className="flex gap-0.5">
                                     {[...Array(Math.min(4, module.lessons.length))].map((_, i) => (
                                         <div key={i} className={`w-1 h-1 rounded-full ${i < completedCount ? 'bg-white' : 'bg-white/10'}`}></div>
                                     ))}
                                     {module.lessons.length > 4 && <span className="text-[6px] text-white/20 ml-0.5">+</span>}
                                 </div>
                                 <span className="text-[9px] font-bold uppercase tracking-wide opacity-40">
                                     {completedCount}/{totalCount}
                                 </span>
                             </div>
                             
                             {/* Line Progress */}
                             <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                                 <div 
                                    className="h-full transition-all duration-700 ease-out" 
                                    style={{ 
                                        width: `${progressPercent}%`, 
                                        backgroundColor: isLocked ? '#334155' : accentColor,
                                        boxShadow: isLocked ? 'none' : `0 0 8px ${accentColor}`
                                    }}
                                 ></div>
                             </div>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );
};
