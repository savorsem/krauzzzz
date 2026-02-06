
import React, { useState, useEffect } from 'react';
import { Habit, Goal, SmartNavAction } from '../types';
import { telegram } from '../services/telegramService';
import { XPService } from '../services/xpService';

interface HabitTrackerProps {
    habits: Habit[];
    goals: Goal[];
    onUpdateHabits: (newHabits: Habit[]) => void;
    onUpdateGoals: (newGoals: Goal[]) => void;
    onXPEarned: (amount: number) => void;
    onBack: () => void;
    setNavAction?: (action: SmartNavAction | null) => void;
}

type TabType = 'HABITS' | 'GOALS';

export const HabitTracker: React.FC<HabitTrackerProps> = ({ 
    habits, goals, onUpdateHabits, onUpdateGoals, onXPEarned, onBack, setNavAction 
}) => {
    const [activeTab, setActiveTab] = useState<TabType>('HABITS');
    const [isAddModalOpen, setIsAddModalOpen] = useState(false);
    
    // Add Form State
    const [newTitle, setNewTitle] = useState('');
    const [newGoalTarget, setNewGoalTarget] = useState('');
    const [newGoalUnit, setNewGoalUnit] = useState('₽');

    const today = new Date().toISOString().split('T')[0];

    // --- SMART NAV INTEGRATION ---
    useEffect(() => {
        if (!setNavAction) return;

        if (isAddModalOpen) {
            setNavAction({
                label: 'СОЗДАТЬ',
                onClick: activeTab === 'HABITS' ? addHabit : addGoal,
                variant: 'success',
                icon: '✨'
            });
        } else {
            setNavAction({
                label: activeTab === 'HABITS' ? 'НОВАЯ ПРИВЫЧКА' : 'НОВАЯ ЦЕЛЬ',
                onClick: () => { 
                    setIsAddModalOpen(true); 
                    telegram.haptic('selection'); 
                },
                variant: 'primary',
                icon: '+'
            });
        }

        return () => { setNavAction(null); };
    }, [activeTab, isAddModalOpen, newTitle, newGoalTarget, newGoalUnit]); // Dependencies important for closure capture in add functions

    // --- HABIT LOGIC ---

    const toggleHabit = (habitId: string, date: string) => {
        telegram.haptic('selection');
        const updated = habits.map(h => {
            if (h.id === habitId) {
                const isCompleted = h.completedDates.includes(date);
                let newDates = isCompleted 
                    ? h.completedDates.filter(d => d !== date)
                    : [...h.completedDates, date];
                
                // Streak Calc
                newDates.sort((a, b) => new Date(b).getTime() - new Date(a).getTime());
                let streak = 0;
                let checkDate = new Date();
                
                if (newDates.includes(today)) {
                    streak = 1;
                    checkDate.setDate(checkDate.getDate() - 1);
                } else {
                    checkDate.setDate(checkDate.getDate() - 1);
                }

                while (true) {
                    const iso = checkDate.toISOString().split('T')[0];
                    if (newDates.includes(iso)) {
                        streak++;
                        checkDate.setDate(checkDate.getDate() - 1);
                    } else {
                        break;
                    }
                }

                if (!isCompleted) telegram.haptic('success');
                return { ...h, completedDates: newDates, streak };
            }
            return h;
        });
        onUpdateHabits(updated);
    };

    const addHabit = () => {
        if (!newTitle.trim()) {
            telegram.haptic('error');
            return;
        }
        const newHabit: Habit = {
            id: Date.now().toString(),
            title: newTitle,
            streak: 0,
            completedDates: [],
            targetDaysPerWeek: 7,
            icon: '🔥'
        };
        onUpdateHabits([...habits, newHabit]);
        closeModal();
    };

    const deleteHabit = (id: string) => {
        if(confirm('Удалить привычку?')) {
            onUpdateHabits(habits.filter(h => h.id !== id));
            telegram.haptic('warning');
        }
    };

    // --- GOAL LOGIC ---

    const addGoal = () => {
        if (!newTitle.trim() || !newGoalTarget) {
            telegram.haptic('error');
            return;
        }
        const newGoal: Goal = {
            id: Date.now().toString(),
            title: newTitle,
            currentValue: 0,
            targetValue: parseFloat(newGoalTarget),
            unit: newGoalUnit,
            isCompleted: false,
            colorStart: '#6C5DD3',
            colorEnd: '#FFAB7B'
        };
        onUpdateGoals([...goals, newGoal]);
        closeModal();
    };

    const updateGoalProgress = (id: string, amount: number) => {
        const updated = goals.map(g => {
            if (g.id === id) {
                const newValue = Math.min(g.targetValue, Math.max(0, g.currentValue + amount));
                const wasCompleted = g.isCompleted;
                const isNowCompleted = newValue >= g.targetValue;
                
                if (!wasCompleted && isNowCompleted) {
                    telegram.haptic('success');
                    telegram.showAlert(`Цель "${g.title}" достигнута!`, 'Поздравляем');
                    // Award XP
                    const result = XPService.achieveGoal({ goals: [], xp: 0 } as any); // Mock user for XP calc
                    onXPEarned(result.xp);
                } else if (amount > 0) {
                    telegram.haptic('light');
                }

                return { ...g, currentValue: newValue, isCompleted: isNowCompleted };
            }
            return g;
        });
        onUpdateGoals(updated);
    };

    const deleteGoal = (id: string) => {
        if(confirm('Удалить цель?')) {
            onUpdateGoals(goals.filter(g => g.id !== id));
            telegram.haptic('warning');
        }
    };

    // --- SHARED ---
    const closeModal = () => {
        setNewTitle('');
        setNewGoalTarget('');
        setIsAddModalOpen(false);
        telegram.haptic('medium');
    };

    // Calendar Days Generator
    const getCalendarDays = () => {
        const days = [];
        for (let i = -4; i <= 2; i++) {
            const d = new Date();
            d.setDate(d.getDate() + i);
            days.push(d);
        }
        return days;
    };
    const calendarDays = getCalendarDays();

    return (
        <div className="flex flex-col h-full bg-[#0F1115] text-white animate-fade-in relative">
            {/* Header */}
            <div className="px-6 pt-[calc(var(--safe-top)+10px)] pb-4 flex items-center justify-between bg-[#0F1115]/90 backdrop-blur-md sticky top-0 z-20 border-b border-white/5">
                <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center active:scale-90 transition-transform">
                    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
                </button>
                <div className="flex bg-[#1F2128] p-1 rounded-xl">
                    <button 
                        onClick={() => setActiveTab('HABITS')}
                        className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'HABITS' ? 'bg-[#6C5DD3] text-white shadow-lg' : 'text-white/40'}`}
                    >
                        Привычки
                    </button>
                    <button 
                        onClick={() => setActiveTab('GOALS')}
                        className={`px-4 py-2 text-[9px] font-black uppercase tracking-widest rounded-lg transition-all ${activeTab === 'GOALS' ? 'bg-[#6C5DD3] text-white shadow-lg' : 'text-white/40'}`}
                    >
                        Цели
                    </button>
                </div>
                <div className="w-10"></div> {/* Spacer for symmetry */}
            </div>

            <div className="p-6 space-y-6 pb-32 overflow-y-auto">
                {/* --- HABITS VIEW --- */}
                {activeTab === 'HABITS' && (
                    <div className="space-y-4 animate-slide-up">
                        {/* Weekly Calendar Header */}
                        <div className="bg-[#1F2128] p-4 rounded-[2rem] border border-white/5 mb-4">
                            <div className="flex justify-between">
                                {calendarDays.map((d, i) => {
                                    const iso = d.toISOString().split('T')[0];
                                    const isToday = iso === today;
                                    return (
                                        <div key={i} className={`flex flex-col items-center gap-2 ${isToday ? 'scale-110' : 'opacity-40'}`}>
                                            <span className="text-[8px] font-bold uppercase tracking-wider">{['Вс','Пн','Вт','Ср','Чт','Пт','Сб'][d.getDay()]}</span>
                                            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-black border ${isToday ? 'bg-white text-black border-white' : 'border-white/20'}`}>
                                                {d.getDate()}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>

                        {habits.length === 0 && (
                            <div className="text-center py-20 opacity-30">
                                <span className="text-4xl block mb-2">🧘</span>
                                <p className="text-xs font-black uppercase tracking-widest">Список пуст</p>
                            </div>
                        )}

                        {habits.map((habit) => {
                            return (
                                <div key={habit.id} className="bg-[#1F2128] border border-white/5 rounded-[2rem] p-5 relative overflow-hidden group">
                                    <div className="flex justify-between items-start mb-4 relative z-10">
                                        <div className="flex items-center gap-3">
                                            <div className="w-10 h-10 rounded-xl bg-[#2C2F36] flex items-center justify-center text-xl shadow-inner">
                                                {habit.icon}
                                            </div>
                                            <div>
                                                <h3 className="font-bold text-sm text-white">{habit.title}</h3>
                                                <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wide">
                                                    <span className={`${habit.streak > 0 ? 'text-orange-500 animate-pulse' : 'text-white/30'}`}>🔥</span> 
                                                    <span className="text-white/60">{habit.streak} дней</span>
                                                </div>
                                            </div>
                                        </div>
                                        <button onClick={() => deleteHabit(habit.id)} className="text-white/10 hover:text-red-500 transition-colors">✕</button>
                                    </div>

                                    {/* Interaction Row */}
                                    <div className="flex justify-between items-center bg-black/20 rounded-xl p-2 relative z-10">
                                        {calendarDays.map((d, i) => {
                                            const iso = d.toISOString().split('T')[0];
                                            const isDone = habit.completedDates.includes(iso);
                                            const isFuture = d > new Date();
                                            
                                            if (iso === today) {
                                                return (
                                                    <button 
                                                        key={i}
                                                        onClick={() => toggleHabit(habit.id, today)}
                                                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all shadow-lg ${isDone ? 'bg-[#00B050] text-white' : 'bg-white/10 hover:bg-white/20 border border-white/10'}`}
                                                    >
                                                        {isDone ? '✓' : ''}
                                                    </button>
                                                );
                                            }
                                            return (
                                                <div key={i} className={`w-2 h-2 rounded-full ${isFuture ? 'bg-white/5' : isDone ? 'bg-[#00B050]' : 'bg-red-500/20'}`}></div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>
                )}

                {/* --- GOALS VIEW --- */}
                {activeTab === 'GOALS' && (
                    <div className="space-y-4 animate-slide-up">
                        {goals.length === 0 && (
                            <div className="text-center py-20 opacity-30">
                                <span className="text-4xl block mb-2">🎯</span>
                                <p className="text-xs font-black uppercase tracking-widest">Целей нет</p>
                            </div>
                        )}

                        {goals.map((goal) => {
                            const percent = Math.min(100, Math.round((goal.currentValue / goal.targetValue) * 100));
                            const step = goal.targetValue > 1000 ? 100 : goal.targetValue > 100 ? 10 : 1;

                            return (
                                <div key={goal.id} className="bg-[#1F2128] border border-white/5 rounded-[2rem] p-6 relative overflow-hidden">
                                    {/* Progress Background */}
                                    <div className="absolute bottom-0 left-0 h-1.5 w-full bg-white/5">
                                        <div 
                                            className="h-full transition-all duration-1000 ease-out"
                                            style={{ 
                                                width: `${percent}%`,
                                                background: `linear-gradient(to right, ${goal.colorStart || '#6C5DD3'}, ${goal.colorEnd || '#FFAB7B'})` 
                                            }}
                                        ></div>
                                    </div>

                                    <div className="flex justify-between items-start mb-4">
                                        <div>
                                            <div className="flex items-center gap-2 mb-1">
                                                <h3 className="font-black text-lg text-white">{goal.title}</h3>
                                                {goal.isCompleted && <span className="text-lg animate-bounce">🏆</span>}
                                            </div>
                                            <p className="text-[10px] font-bold text-white/40 uppercase tracking-widest">
                                                {goal.currentValue.toLocaleString()} / {goal.targetValue.toLocaleString()} {goal.unit}
                                            </p>
                                        </div>
                                        <div className="text-right">
                                            <span className="text-2xl font-black text-white">{percent}%</span>
                                        </div>
                                    </div>

                                    {/* Controls */}
                                    {!goal.isCompleted && (
                                        <div className="flex gap-2 mt-4">
                                            <button 
                                                onClick={() => updateGoalProgress(goal.id, step)}
                                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black border border-white/5 active:scale-95 transition-all"
                                            >
                                                +{step} {goal.unit}
                                            </button>
                                            <button 
                                                onClick={() => updateGoalProgress(goal.id, step * 5)}
                                                className="flex-1 py-3 bg-white/5 hover:bg-white/10 rounded-xl text-xs font-black border border-white/5 active:scale-95 transition-all"
                                            >
                                                +{step * 5} {goal.unit}
                                            </button>
                                            <button 
                                                onClick={() => deleteGoal(goal.id)} 
                                                className="px-4 bg-red-500/10 text-red-500 rounded-xl hover:bg-red-500 hover:text-white transition-colors"
                                            >
                                                ✕
                                            </button>
                                        </div>
                                    )}
                                    
                                    {goal.isCompleted && (
                                        <div className="mt-4 py-3 bg-[#00B050]/20 text-[#00B050] text-center rounded-xl text-xs font-black uppercase tracking-widest border border-[#00B050]/20">
                                            Цель Достигнута
                                        </div>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                )}
            </div>

            {/* ADD MODAL */}
            {isAddModalOpen && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-end sm:items-center justify-center animate-fade-in pb-20">
                    <div className="w-full sm:max-w-sm bg-[#1F2128] rounded-t-[2.5rem] sm:rounded-[2.5rem] p-6 pb-10 border-t border-white/10 shadow-2xl animate-slide-up">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-black uppercase tracking-wide">
                                Новая {activeTab === 'HABITS' ? 'Привычка' : 'Цель'}
                            </h3>
                            <button onClick={closeModal} className="text-white/40 hover:text-white text-xl">✕</button>
                        </div>

                        <div className="space-y-4">
                            <input 
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="Название..."
                                className="w-full bg-black/20 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-[#6C5DD3]"
                                autoFocus
                            />

                            {activeTab === 'GOALS' && (
                                <div className="flex gap-3">
                                    <input 
                                        type="number"
                                        value={newGoalTarget}
                                        onChange={e => setNewGoalTarget(e.target.value)}
                                        placeholder="Цель (число)"
                                        className="flex-1 bg-black/20 border border-white/10 p-4 rounded-xl text-white font-bold outline-none focus:border-[#6C5DD3]"
                                    />
                                    <select 
                                        value={newGoalUnit}
                                        onChange={e => setNewGoalUnit(e.target.value)}
                                        className="w-20 bg-black/20 border border-white/10 p-4 rounded-xl text-white font-bold outline-none"
                                    >
                                        <option value="₽">₽</option>
                                        <option value="$">$</option>
                                        <option value="km">км</option>
                                        <option value="kg">кг</option>
                                        <option value="#">шт</option>
                                    </select>
                                </div>
                            )}
                            
                            {/* NOTE: Create button is now in the Smart Island */}
                            <p className="text-center text-white/30 text-[10px] font-bold uppercase tracking-widest mt-4">
                                Нажмите "Создать" внизу
                            </p>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};
