
import React, { useState } from 'react';
import { NotebookEntry } from '../types';
import { telegram } from '../services/telegramService';
import { XPService, XP_RULES } from '../services/xpService';

interface NotebookViewProps {
  entries: NotebookEntry[];
  onUpdate: (entries: NotebookEntry[]) => void;
  onBack: () => void;
  onXPEarned: (amount: number) => void;
}

export const NotebookView: React.FC<NotebookViewProps> = ({ entries, onUpdate, onXPEarned }) => {
  const [activeTab, setActiveTab] = useState<'HABIT' | 'GOAL' | 'IDEA' | 'GRATITUDE'>('HABIT');
  const [inputText, setInputText] = useState('');

  const filteredEntries = entries.filter(e => 
      activeTab === 'IDEA' ? (e.type === 'IDEA' || e.type === 'NOTE') : e.type === activeTab
  );

  const addEntry = () => {
      if (!inputText.trim()) return;
      telegram.haptic('light');
      
      const type = activeTab === 'HABIT' ? 'HABIT' : activeTab === 'GOAL' ? 'GOAL' : activeTab === 'GRATITUDE' ? 'GRATITUDE' : 'IDEA';
      
      const newEntry: NotebookEntry = {
          id: Date.now().toString(),
          text: inputText,
          isChecked: false,
          type: type,
          date: new Date().toISOString()
      };
      
      onUpdate([...entries, newEntry]);
      
      // Calculate and award XP
      const xp = XPService.calculateNotebookXP(type);
      if (xp > 0) {
          onXPEarned(xp);
      }

      setInputText('');
  };

  const toggleCheck = (id: string) => {
      telegram.haptic('selection');
      onUpdate(entries.map(e => e.id === id ? { ...e, isChecked: !e.isChecked } : e));
  };

  const deleteEntry = (id: string) => {
      onUpdate(entries.filter(e => e.id !== id));
  };

  return (
    <div className="px-6 pt-10 pb-32 max-w-2xl mx-auto space-y-8 animate-fade-in">
       <div>
            <span className="text-[#6C5DD3] text-[10px] font-black uppercase tracking-[0.3em] mb-2 block">Personal Logs</span>
            <h1 className="text-4xl font-black text-text-primary tracking-tighter">ЖУРНАЛ <br/><span className="text-text-secondary opacity-30">БОЙЦА</span></h1>
       </div>

       {/* Tabs */}
       <div className="grid grid-cols-2 gap-2">
             {[
                 { id: 'HABIT', label: 'Привычки', icon: '⚡', xp: XP_RULES.NOTEBOOK_HABIT },
                 { id: 'GOAL', label: 'Цели', icon: '🎯', xp: XP_RULES.NOTEBOOK_GOAL },
                 { id: 'GRATITUDE', label: 'Благодарности', icon: '🙏', xp: XP_RULES.NOTEBOOK_GRATITUDE },
                 { id: 'IDEA', label: 'Заметки/ДЗ', icon: '💡', xp: XP_RULES.NOTEBOOK_HOMEWORK_LOG }
             ].map(tab => (
                 <button 
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as any)}
                    className={`py-3.5 px-4 rounded-2xl text-left transition-all relative overflow-hidden border ${
                        activeTab === tab.id 
                        ? 'bg-[#1F2128] text-white border-[#6C5DD3]/50 shadow-lg' 
                        : 'bg-surface text-text-secondary border-border-color hover:bg-black/5'
                    }`}
                 >
                    <div className="flex justify-between items-center mb-1">
                        <span className="text-xl">{tab.icon}</span>
                        <span className="text-[9px] font-black bg-[#6C5DD3]/20 text-[#6C5DD3] px-1.5 py-0.5 rounded">+{tab.xp} XP</span>
                    </div>
                    <span className="text-[10px] font-black uppercase tracking-wider block">{tab.label}</span>
                 </button>
             ))}
       </div>

       {/* Quick Add */}
       <div className="flex gap-3">
            <input 
                value={inputText}
                onChange={e => setInputText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && addEntry()}
                placeholder={`Новая запись (${activeTab === 'GRATITUDE' ? 'Кому благодарен?' : 'Текст...'})`}
                className="flex-1 bg-surface border border-border-color rounded-2xl px-5 py-4 text-sm font-bold text-text-primary focus:border-[#6C5DD3] outline-none shadow-sm transition-all"
            />
            <button onClick={addEntry} className="w-14 h-14 bg-[#6C5DD3] text-white rounded-2xl flex items-center justify-center text-2xl shadow-lg shadow-[#6C5DD3]/20 active:scale-95 transition-all">+</button>
       </div>

       {/* List */}
       <div className="space-y-3">
            {filteredEntries.length === 0 ? (
                <div className="text-center py-20 opacity-30">
                    <p className="text-text-secondary text-xs font-black uppercase tracking-widest">Записей нет</p>
                </div>
            ) : (
                filteredEntries.map((item, i) => (
                    <div 
                        key={item.id} 
                        className="bg-surface p-4 rounded-[1.5rem] border border-border-color flex items-center gap-4 animate-slide-up group transition-all"
                        style={{ animationDelay: `${i*0.05}s` }}
                    >
                        <button 
                            onClick={() => toggleCheck(item.id)}
                            className={`w-6 h-6 rounded-lg border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                                item.isChecked ? 'bg-[#00B050] border-[#00B050] text-white' : 'border-border-color group-hover:border-[#6C5DD3]'
                            }`}
                        >
                            {item.isChecked && '✓'}
                        </button>
                        <div className="flex-1">
                            <p className={`text-sm font-bold transition-all ${item.isChecked ? 'text-text-secondary line-through' : 'text-text-primary'}`}>
                                {item.text}
                            </p>
                            <p className="text-[9px] text-text-secondary mt-1">{new Date(item.date).toLocaleDateString()}</p>
                        </div>
                        <button onClick={() => deleteEntry(item.id)} className="text-text-secondary opacity-0 group-hover:opacity-100 hover:text-red-500 transition-all">✕</button>
                    </div>
                ))
            )}
       </div>
    </div>
  );
};
