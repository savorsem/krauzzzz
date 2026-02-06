
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
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pb-24">
        {modules.map((module, index) => {
            const isLocked = userProgress.level < module.minLevel;
            const completedCount = module.lessons.filter(l => userProgress.completedLessonIds.includes(l.id)).length;
            const totalCount = module.lessons.length;
            const progressPercent = totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0;
            const isCompleted = progressPercent === 100;
            
            // Refined Palette with Gradients
            const getAccentStyles = (category: string) => {
                switch(category) {
                    case 'SALES': return { color: '#10B981', gradient: 'from-emerald-500/20 to-emerald-900/5', border: 'border-emerald-500/30' };
                    case 'PSYCHOLOGY': return { color: '#8B5CF6', gradient: 'from-violet-500/20 to-violet-900/5', border: 'border-violet-500/30' };
                    case 'TACTICS': return { color: '#F43F5E', gradient: 'from-rose-500/20 to-rose-900/5', border: 'border-rose-500/30' };
                    default: return { color: '#6C5DD3', gradient: 'from-[#6C5DD3]/20 to-[#6C5DD3]/5', border: 'border-[#6C5DD3]/30' };
                }
            };

            const style = getAccentStyles(module.category);
            const moduleNum = (index + 1).toString().padStart(2, '0');

            return (
                <div 
                    key={module.id}
                    onClick={() => handleModuleClick(module, isLocked)}
                    className={`
                        relative w-full rounded-3xl overflow-hidden transition-all duration-300 group select-none
                        min-h-[100px] flex flex-col justify-between border
                        ${shakingId === module.id ? 'animate-shake' : ''}
                        ${isLocked 
                            ? 'opacity-60 grayscale bg-[#16181D] border-white/5' 
                            : `cursor-pointer bg-[#1A1D24] ${style.border} hover:shadow-lg active:scale-[0.98]`
                        }
                    `}
                >
                    {/* Background Effects */}
                    {!isLocked && (
                        <div className={`absolute inset-0 bg-gradient-to-br ${style.gradient} opacity-50 group-hover:opacity-80 transition-opacity`}></div>
                    )}
                    
                    {/* Decorative Number */}
                    <div className="absolute -right-1 -bottom-5 text-[4rem] font-black leading-none tracking-tighter opacity-[0.03] select-none pointer-events-none z-0" style={{ color: isLocked ? '#FFF' : style.color }}>
                        {moduleNum}
                    </div>

                    <div className="relative z-10 p-4 flex flex-col h-full">
                        <div className="flex justify-between items-start gap-3">
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2 mb-1">
                                    <span 
                                        className="text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-lg border backdrop-blur-sm"
                                        style={{ 
                                            color: isLocked ? '#64748B' : style.color,
                                            borderColor: isLocked ? '#334155' : `${style.color}40`,
                                            backgroundColor: isLocked ? 'transparent' : `${style.color}10`
                                        }}
                                    >
                                        {module.category}
                                    </span>
                                    {isCompleted && <span className="text-[9px] text-green-500 font-black">✓</span>}
                                </div>
                                <h3 className={`text-sm font-bold leading-snug line-clamp-2 ${isLocked ? 'text-slate-500' : 'text-white'}`}>
                                    {module.title}
                                </h3>
                            </div>
                            
                            {/* Play/Lock Icon */}
                            <div className={`w-9 h-9 rounded-2xl flex items-center justify-center border flex-shrink-0 transition-all ${
                                 isLocked 
                                 ? 'border-white/5 text-slate-600 bg-white/5' 
                                 : 'border-white/10 text-white bg-white/10 shadow-inner group-hover:scale-105'
                             }`} style={{ borderColor: !isLocked ? `${style.color}30` : '' }}>
                                 {isLocked ? (
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                                 ) : (
                                     <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" style={{ color: style.color }}><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                                 )}
                             </div>
                        </div>

                        {/* Stats & Bar */}
                        <div className="mt-4">
                             <div className="flex justify-between items-end mb-2">
                                 <span className="text-[10px] font-bold text-slate-400">
                                     {completedCount} / {totalCount} уроков
                                 </span>
                                 <span className="text-[10px] font-black" style={{ color: isLocked ? '#64748B' : style.color }}>
                                     {progressPercent}%
                                 </span>
                             </div>
                             
                             <div className="w-full h-1.5 bg-black/40 rounded-full overflow-hidden border border-white/5">
                                 <div 
                                    className="h-full rounded-full transition-all duration-700 ease-out relative" 
                                    style={{ 
                                        width: `${progressPercent}%`, 
                                        backgroundColor: isLocked ? '#334155' : style.color,
                                        boxShadow: isLocked ? 'none' : `0 0 10px ${style.color}`
                                    }}
                                 >
                                     {!isLocked && <div className="absolute inset-0 bg-white/30 w-full animate-shimmer"></div>}
                                 </div>
                             </div>
                        </div>
                    </div>
                </div>
            );
        })}
    </div>
  );
};
