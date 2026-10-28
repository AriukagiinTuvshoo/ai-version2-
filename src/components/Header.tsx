import React from 'react';
import { Bot, Cpu, Database, FileText, CheckCircle2, ShieldCheck, Globe, Sparkles } from 'lucide-react';
import { LanguageMode } from '../types';

interface HeaderProps {
  activeTab: 'console' | 'knowledge' | 'memory' | 'reports' | 'diagnostics';
  setActiveTab: (tab: 'console' | 'knowledge' | 'memory' | 'reports' | 'diagnostics') => void;
  uiLang: 'mn' | 'en';
  setUiLang: (lang: 'mn' | 'en') => void;
  multiAgent: boolean;
  setMultiAgent: (val: boolean) => void;
  langMode: LanguageMode;
  setLangMode: (m: LanguageMode) => void;
}

export const Header: React.FC<HeaderProps> = ({
  activeTab,
  setActiveTab,
  uiLang,
  setUiLang,
  multiAgent,
  setMultiAgent,
  langMode,
  setLangMode,
}) => {
  const isMn = uiLang === 'mn';

  return (
    <header className="border-b border-slate-800 bg-slate-900/90 backdrop-blur sticky top-0 z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-cyan-500 via-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <Bot className="h-5 w-5 text-white" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="font-bold text-white text-base sm:text-lg tracking-tight">
                  {isMn ? 'Autonomous AI Agent V4' : 'Autonomous AI Agent V4'}
                </h1>
                <span className="px-1.5 py-0.5 text-[10px] font-semibold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30 rounded">
                  React + Node
                </span>
              </div>
              <p className="text-xs text-slate-400 hidden sm:block">
                {isMn
                  ? 'Монгол / Англи хос хэл • Локал тооцоолуур • Баримтын шинжилгээ • Санах ой'
                  : 'Bilingual MN/EN • Safe AST Calculator • Grounded Reader • Dual Memory'}
              </p>
            </div>
          </div>

          {/* Controls: Multi-Agent toggle, Language, UI Switch */}
          <div className="flex items-center gap-3">
            {/* Multi-Agent Toggle */}
            <button
              onClick={() => setMultiAgent(!multiAgent)}
              title={
                isMn
                  ? 'Multi-Agent горим: Төлөвлөгч -> Гүйцэтгэгч -> Баталгаажуулагч'
                  : 'Multi-Agent mode: Planner -> Executor -> Verifier'
              }
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition-colors ${
                multiAgent
                  ? 'bg-purple-950/60 border-purple-500/50 text-purple-300 shadow-sm shadow-purple-500/20'
                  : 'bg-slate-800/80 border-slate-700 text-slate-400 hover:text-slate-200'
              }`}
            >
              <Cpu className="h-3.5 w-3.5" />
              <span className="hidden md:inline">{isMn ? 'Олон агент (3-рөл):' : 'Multi-Agent:'}</span>
              <span className={`font-semibold ${multiAgent ? 'text-purple-300' : 'text-slate-500'}`}>
                {multiAgent ? 'ON' : 'OFF'}
              </span>
            </button>

            {/* Response Language Select */}
            <div className="flex items-center bg-slate-800/90 rounded-lg p-0.5 border border-slate-700 text-xs">
              <button
                onClick={() => setLangMode('auto')}
                className={`px-2 py-1 rounded transition-colors ${
                  langMode === 'auto'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isMn ? 'Асуултаас хэлээ автоматаар тодорхойлно' : 'Auto detect from input'}
              >
                Auto
              </button>
              <button
                onClick={() => setLangMode('mn')}
                className={`px-2 py-1 rounded transition-colors ${
                  langMode === 'mn'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Хариулт: Монгол хэлээр"
              >
                MN
              </button>
              <button
                onClick={() => setLangMode('en')}
                className={`px-2 py-1 rounded transition-colors ${
                  langMode === 'en'
                    ? 'bg-indigo-600 text-white font-medium'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title="Response: English"
              >
                EN
              </button>
            </div>

            {/* UI Language Toggle */}
            <button
              onClick={() => setUiLang(uiLang === 'mn' ? 'en' : 'mn')}
              className="flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-slate-300 hover:text-white bg-slate-800/80 hover:bg-slate-800 border border-slate-700 rounded-lg transition-colors"
              title={isMn ? 'Switch UI to English' : 'Интерфэйсийг Монгол болгох'}
            >
              <Globe className="h-3.5 w-3.5 text-slate-400" />
              <span>{uiLang === 'mn' ? 'Монгол' : 'English'}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex space-x-1 sm:space-x-4 border-t border-slate-800/80 overflow-x-auto py-1 scrollbar-none">
          <button
            onClick={() => setActiveTab('console')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'console'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Bot className="h-4 w-4" />
            <span>{isMn ? 'Агент Терминал' : 'Agent Console'}</span>
          </button>

          <button
            onClick={() => setActiveTab('knowledge')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'knowledge'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <FileText className="h-4 w-4" />
            <span>{isMn ? 'Мэдлэгийн сан (knowledge/)' : 'Knowledge Base'}</span>
          </button>

          <button
            onClick={() => setActiveTab('memory')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'memory'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <Database className="h-4 w-4" />
            <span>{isMn ? 'Санах ой (V4 & KV)' : 'Dual Memory'}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'reports'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <ShieldCheck className="h-4 w-4" />
            <span>{isMn ? 'Тайлангууд (reports/)' : 'Reports Archive'}</span>
          </button>

          <button
            onClick={() => setActiveTab('diagnostics')}
            className={`flex items-center gap-2 px-3 py-2 text-xs sm:text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'diagnostics'
                ? 'border-indigo-500 text-indigo-400'
                : 'border-transparent text-slate-400 hover:text-slate-200 hover:border-slate-700'
            }`}
          >
            <CheckCircle2 className="h-4 w-4" />
            <span>{isMn ? 'Оношилгоо ба Тест' : 'Acceptance Tests'}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
