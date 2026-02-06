
import React, { useState, useRef, useEffect } from 'react';
import ReactPlayer from 'react-player';
import ReactMarkdown from 'react-markdown';
import { Lesson, Module, UserProgress } from '../types';
import { checkHomeworkWithAI } from '../services/geminiService';
import { telegram } from '../services/telegramService';
import { XPService, XP_RULES } from '../services/xpService';

const VideoPlayer = ReactPlayer as unknown as React.ComponentType<any>;

interface LessonViewProps {
  lesson: Lesson;
  isCompleted: boolean;
  onComplete: (lessonId: string, xpBonus: number) => void;
  onBack: () => void;
  parentModule?: Module | null;
  userProgress: UserProgress;
  onUpdateUser: (data: Partial<UserProgress>) => void;
  onUpdateLesson?: (updatedLesson: Lesson) => void;
}

export const LessonView: React.FC<LessonViewProps> = ({ 
  lesson, 
  isCompleted, 
  onComplete, 
  onBack, 
  parentModule,
  userProgress,
  onUpdateUser
}) => {
  const [inputText, setInputText] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [isAsking, setIsAsking] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const questionsAskedCount = userProgress.stats?.questionsAsked?.[lesson.id] || 0;
  const questionsRemaining = XP_RULES.MAX_QUESTIONS_PER_LESSON - questionsAskedCount;

  const handleAskQuestion = () => {
      if (!questionText.trim()) return;
      setIsAsking(true);
      setTimeout(() => {
          const result = XPService.askQuestion(userProgress, lesson.id);
          if (result.allowed) {
              onUpdateUser(result.user);
              telegram.showAlert(`Запрос принят. Начислено ${result.xp} XP.`, 'Связь со штабом');
              setQuestionText('');
          } else {
              telegram.showAlert(result.message || 'Лимит исчерпан', 'Ошибка');
          }
          setIsAsking(false);
      }, 800);
  };

  const handleSubmit = async () => {
    if (isSubmitting) return;
    setIsSubmitting(true);
    setFeedback(null);
    telegram.haptic('medium');

    const contentToSend = lesson.homeworkType === 'TEXT' ? inputText : selectedFile!;
    const result = await checkHomeworkWithAI(contentToSend, lesson.homeworkType, lesson.aiGradingInstruction);

    setIsSubmitting(false);
    if (result.passed) {
        const processResult = XPService.processHomework(userProgress, lesson.id, false); 
        onUpdateUser(processResult.user);
        onComplete(lesson.id, processResult.xp);
        setFeedback(result.feedback);
        telegram.haptic('success');
    } else {
        setFeedback(result.feedback);
        telegram.haptic('error');
    }
  };

  const videoUrl = lesson.videoUrl || parentModule?.videoUrl;
  const hasVideo = !!videoUrl;

  return (
    <div className="flex flex-col min-h-screen bg-body">
      {/* Premium Header */}
      <div className="sticky top-0 z-40 px-6 pt-[calc(var(--safe-top)+10px)] pb-4 flex items-center justify-between island-blur bg-body/80 border-b border-white/5 transition-all">
        <button onClick={onBack} className="w-10 h-10 rounded-2xl bg-surface border border-border-color flex items-center justify-center text-text-primary active:scale-90 transition-all shadow-sm">
           <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div className="text-center px-4 flex-1">
             <span className="text-[8px] font-black uppercase tracking-[0.2em] text-[#6C5DD3] mb-0.5 block">Текущая задача</span>
             <h2 className="text-sm font-black text-text-primary truncate">{lesson.title}</h2>
        </div>
        <div className="w-10 h-10 rounded-2xl bg-[#6C5DD3]/10 text-[#6C5DD3] flex items-center justify-center font-black text-[10px] border border-[#6C5DD3]/20">
            {lesson.xpReward}
        </div>
      </div>

      <div className="px-6 pt-6 pb-40 max-w-2xl mx-auto w-full space-y-8 animate-fade-in">
        
        {/* Video Player Section */}
        {hasVideo && (
            <div className="relative rounded-[2.5rem] overflow-hidden shadow-2xl aspect-video bg-black ring-1 ring-white/5">
                <VideoPlayer 
                    url={videoUrl} 
                    width="100%" 
                    height="100%" 
                    controls={true} 
                    config={{ youtube: { playerVars: { origin: window.location.origin }}}}
                />
            </div>
        )}

        {/* Content Card */}
        <div className="bg-surface p-8 rounded-[2.5rem] border border-border-color shadow-sm relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-[#6C5DD3]/5 rounded-full blur-3xl -mr-16 -mt-16"></div>
            
            <div className="markdown-content text-text-primary/90">
                <ReactMarkdown
                    components={{
                        h1: (p) => <h1 className="text-2xl font-black mb-6 text-text-primary tracking-tight" {...p} />,
                        h2: (p) => <h2 className="text-xl font-bold mt-10 mb-4 text-text-primary border-l-4 border-[#6C5DD3] pl-4" {...p} />,
                        p: (p) => <p className="mb-6 leading-relaxed font-medium opacity-80" {...p} />,
                        ul: (p) => <ul className="list-disc pl-6 mb-6 space-y-2 marker:text-[#6C5DD3]" {...p} />,
                        blockquote: (p) => <blockquote className="border-l-4 border-[#6C5DD3] bg-[#6C5DD3]/5 p-5 rounded-2xl italic my-8 text-text-primary/70" {...p} />,
                    }}
                >
                    {lesson.content}
                </ReactMarkdown>
            </div>
        </div>

        {/* Questions Section */}
        <div className="bg-surface p-6 rounded-[2.5rem] border border-border-color shadow-sm space-y-4">
             <div className="flex justify-between items-center">
                 <h3 className="text-text-primary font-black uppercase text-xs tracking-widest">Прямая связь</h3>
                 <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${questionsRemaining > 0 ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'}`}>
                     Лимит: {questionsRemaining}/5
                 </span>
             </div>
             <div className="flex gap-2">
                 <input 
                    value={questionText}
                    onChange={(e) => setQuestionText(e.target.value)}
                    placeholder="Ваш вопрос Командиру..."
                    disabled={questionsRemaining <= 0 || isAsking}
                    className="flex-1 bg-body border border-border-color rounded-2xl px-5 py-3 text-sm focus:border-[#6C5DD3] outline-none disabled:opacity-50 transition-all"
                 />
                 <button 
                    onClick={handleAskQuestion}
                    disabled={questionsRemaining <= 0 || isAsking || !questionText.trim()}
                    className="bg-[#6C5DD3] text-white rounded-2xl w-12 h-12 flex items-center justify-center active:scale-90 transition-transform disabled:opacity-50"
                 >
                    {isAsking ? <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : '➤'}
                 </button>
             </div>
        </div>

        {/* Homework Section */}
        {!isCompleted ? (
            <div className="relative rounded-[3rem] overflow-hidden bg-[#16181D] shadow-2xl p-8 group border border-white/5">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-[#6C5DD3] to-[#FFAB7B]"></div>
                
                <div className="flex items-center gap-4 mb-8">
                    <div className="w-14 h-14 rounded-2xl bg-[#6C5DD3] flex items-center justify-center text-2xl shadow-[0_0_20px_rgba(108,93,211,0.3)]">
                        {lesson.homeworkType === 'VIDEO' ? '📹' : lesson.homeworkType === 'PHOTO' ? '📸' : '✍️'}
                    </div>
                    <div>
                        <h3 className="font-black text-xl text-white tracking-tight">Боевая задача</h3>
                        <p className="text-[#6C5DD3] text-[9px] font-black uppercase tracking-[0.2em] mt-1">Вердикт выносит AI-Командир</p>
                    </div>
                </div>
                
                <div className="bg-white/5 p-6 rounded-2xl border border-white/5 mb-8 italic text-white/80 text-sm leading-relaxed">
                     "{lesson.homeworkTask}"
                </div>
                
                {lesson.homeworkType === 'TEXT' ? (
                    <textarea
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        placeholder="Введите отчет о выполнении..."
                        className="w-full bg-black/40 text-white p-5 rounded-2xl border border-white/10 focus:border-[#6C5DD3] outline-none h-48 mb-8 resize-none text-sm transition-all focus:ring-1 focus:ring-[#6C5DD3]/50"
                    />
                ) : (
                    <div onClick={() => fileInputRef.current?.click()} className={`w-full h-40 mb-8 border-2 border-dashed rounded-3xl flex flex-col items-center justify-center cursor-pointer transition-all ${selectedFile ? 'border-green-500 bg-green-500/5' : 'border-white/10 hover:border-[#6C5DD3] bg-white/5'}`}>
                        <input type="file" ref={fileInputRef} onChange={e => {
                            const f = e.target.files?.[0];
                            if(f) {
                                const r = new FileReader();
                                r.onloadend = () => setSelectedFile(r.result as string);
                                r.readAsDataURL(f);
                            }
                        }} className="hidden" />
                        {selectedFile ? <span className="text-green-500 font-black uppercase text-xs">✓ Материал загружен</span> : <span className="text-white/30 text-xs font-black uppercase">Нажмите для загрузки</span>}
                    </div>
                )}
                
                {feedback && (
                    <div className="mb-8 p-6 bg-red-500/10 border border-red-500/20 rounded-2xl animate-fade-in backdrop-blur-md">
                        <p className="text-white/90 text-sm leading-relaxed font-medium">👮‍♂️ <span className="font-black uppercase text-[10px] text-red-400 tracking-widest ml-1">Командир:</span> {feedback}</p>
                    </div>
                )}

                <button 
                    onClick={handleSubmit} 
                    disabled={isSubmitting || (lesson.homeworkType === 'TEXT' ? !inputText.trim() : !selectedFile)} 
                    className="w-full py-5 bg-[#6C5DD3] text-white rounded-2xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#6C5DD3]/20 active:scale-95 transition-all disabled:opacity-50"
                >
                    {isSubmitting ? 'АНАЛИЗ...' : 'ОТПРАВИТЬ ОТЧЕТ'}
                </button>
            </div>
        ) : (
            <div className="bg-green-500/10 rounded-[3rem] p-12 text-center border border-green-500/20 shadow-inner">
                <div className="w-20 h-20 bg-green-500 text-white rounded-full flex items-center justify-center text-4xl mx-auto mb-6 shadow-xl animate-float">✓</div>
                <h3 className="text-green-500 font-black text-2xl uppercase tracking-tighter mb-2">Задача Выполнена</h3>
                <p className="text-green-500/60 text-xs font-black uppercase tracking-widest">+ {lesson.xpReward} XP получено</p>
            </div>
        )}
      </div>
    </div>
  );
};
