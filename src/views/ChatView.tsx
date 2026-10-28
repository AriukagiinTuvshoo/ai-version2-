import React, { useState, useEffect } from 'react';
import { AgentConsole } from '../components/AgentConsole';
import { LanguageMode } from '../types';
import { Volume2, VolumeX, Mic, MicOff, Paperclip, FileText, CheckCircle2 } from 'lucide-react';

interface ChatViewProps {
  uiLang: 'mn' | 'en' | 'ja';
  initialPrompt?: string | null;
  onClearInitialPrompt?: () => void;
}

export const ChatView: React.FC<ChatViewProps> = ({
  uiLang,
  initialPrompt,
  onClearInitialPrompt,
}) => {
  const isMn = uiLang === 'mn';
  const [langMode, setLangMode] = useState<LanguageMode>('auto');
  const [multiAgent, setMultiAgent] = useState(false);
  const [voiceActive, setVoiceActive] = useState(false);
  const [knowledgeFiles, setKnowledgeFiles] = useState<{ name: string }[]>([]);
  const [selectedFilePrompt, setSelectedFilePrompt] = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/knowledge')
      .then((r) => r.json())
      .then((d) => setKnowledgeFiles(d || []))
      .catch(() => {});
  }, []);

  return (
    <div className="flex flex-col h-full space-y-2">
      {/* Voice & Attachment Top Toolbar */}
      <div className="px-4 pt-2 max-w-5xl mx-auto w-full flex flex-wrap items-center justify-between gap-2 text-xs">
        <div className="flex items-center gap-2">
          {/* Voice Mode Toggle (Section 3.2 Дуу хоолойгоор харилцах) */}
          <button
            onClick={() => setVoiceActive(!voiceActive)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs transition ${
              voiceActive
                ? 'bg-purple-950/80 border-purple-500/50 text-purple-200'
                : 'bg-[#140e22] border-[#251840] text-slate-400 hover:text-white'
            }`}
          >
            {voiceActive ? <Mic className="h-3.5 w-3.5 text-purple-400" /> : <MicOff className="h-3.5 w-3.5" />}
            <span>{isMn ? 'Дуу хоолой:' : 'Voice Input:'} {voiceActive ? 'ON' : 'OFF'}</span>
          </button>

          {/* Quick Grounded File Context attachment */}
          {knowledgeFiles.length > 0 && (
            <div className="flex items-center gap-1 text-[11px] font-mono text-slate-400 bg-[#120c22] px-2.5 py-1 rounded-lg border border-[#23173c]">
              <Paperclip className="h-3 w-3 text-cyan-400" />
              <span>Grounded:</span>
              <span className="text-purple-300 font-semibold">{knowledgeFiles[0].name}</span>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          {/* Multi-Agent 3-Role Toggle */}
          <button
            onClick={() => setMultiAgent(!multiAgent)}
            className={`flex items-center gap-1.5 px-3 py-1 rounded-lg border text-xs font-mono transition ${
              multiAgent
                ? 'bg-purple-950/80 border-purple-500/50 text-purple-200'
                : 'bg-[#140e22] border-[#251840] text-slate-400 hover:text-white'
            }`}
          >
            <span>Multi-Agent Review:</span>
            <span className={multiAgent ? 'text-purple-300 font-bold' : 'text-slate-500'}>
              {multiAgent ? 'ON' : 'OFF'}
            </span>
          </button>
        </div>
      </div>

      <div className="flex-1">
        <AgentConsole
          uiLang={uiLang === 'ja' ? 'en' : uiLang}
          langMode={langMode}
          setLangMode={setLangMode}
          multiAgent={multiAgent}
        />
      </div>
    </div>
  );
};
