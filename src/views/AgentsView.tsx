import React, { useState, useEffect } from 'react';
import {
  Brain,
  Compass,
  Search,
  Code,
  ShieldAlert,
  CheckCheck,
  Cpu,
  Play,
  RefreshCw,
  Sliders,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Shield,
  Layers,
  Sparkles,
} from 'lucide-react';
import { AgentDefinition } from '../types';

interface AgentsViewProps {
  uiLang: 'mn' | 'en' | 'ja';
}

export const AgentsView: React.FC<AgentsViewProps> = ({ uiLang }) => {
  const isMn = uiLang === 'mn';
  const [agents, setAgents] = useState<AgentDefinition[]>([]);
  const [selectedAgent, setSelectedAgent] = useState<AgentDefinition | null>(null);
  const [pipelineGoal, setPipelineGoal] = useState('');
  const [isRunningPipeline, setIsRunningPipeline] = useState(false);
  const [pipelineResult, setPipelineResult] = useState<any | null>(null);

  useEffect(() => {
    fetch('/api/agents')
      .then((r) => r.json())
      .then((d) => {
        setAgents(d || []);
        if (d && d.length > 0) setSelectedAgent(d[0]);
      })
      .catch(() => {});
  }, []);

  const handleRunPipeline = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!pipelineGoal.trim() || isRunningPipeline) return;

    setIsRunningPipeline(true);
    setPipelineResult(null);

    try {
      const res = await fetch('/api/agents/pipeline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ goal: pipelineGoal.trim() }),
      });
      const data = await res.json();
      setPipelineResult(data);
    } catch (err: any) {
      console.error('Pipeline error', err);
    } finally {
      setIsRunningPipeline(false);
    }
  };

  const getAgentIcon = (id: string) => {
    switch (id) {
      case 'planner':
        return <Compass className="h-5 w-5 text-purple-400" />;
      case 'researcher':
        return <Search className="h-5 w-5 text-sky-400" />;
      case 'coder':
        return <Code className="h-5 w-5 text-emerald-400" />;
      case 'reviewer':
        return <ShieldAlert className="h-5 w-5 text-amber-400" />;
      case 'tester':
        return <CheckCheck className="h-5 w-5 text-pink-400" />;
      case 'memory':
        return <Brain className="h-5 w-5 text-indigo-400" />;
      default:
        return <Cpu className="h-5 w-5 text-rose-400" />;
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Top Banner */}
      <div className="bg-[#0e0a1a] border border-[#23173d] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-400" />
            <h2 className="text-lg font-bold text-white">
              {isMn ? 'AI Agent Mastermind — 7 Мэргэшсэн Агент' : 'AI Agent Mastermind — 7 Specialized Roles'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {isMn
              ? 'Код бичсэн агент өөрийгөө эцсийн үнэн гэж үзэхгүй байх зарчмаар Reviewer, Tester нар бие даасан хяналт хийнэ.'
              : 'Independent verification architecture: Reviewer audits for hallucinations, and Tester validates against real test gates.'}
          </p>
        </div>

        <div className="flex items-center gap-2 text-xs font-mono">
          <span className="px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300">
            Peer-Review: ENFORCED
          </span>
        </div>
      </div>

      {/* Interactive Pipeline Runner (Test 7 Agents Working Together) */}
      <div className="bg-[#0d0918] border border-[#22163b] rounded-2xl p-5 space-y-4 shadow-lg">
        <div className="flex items-center justify-between pb-2 border-b border-[#22163b]">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
              {isMn ? 'Multi-Agent Pipeline Ажиллуулах' : 'Run Full Multi-Agent Pipeline'}
            </h3>
          </div>
          <span className="text-[10px] text-slate-400 font-mono">
            Coord → Plan → Res → Code → Rev → Test
          </span>
        </div>

        <form onSubmit={handleRunPipeline} className="flex gap-2">
          <input
            type="text"
            value={pipelineGoal}
            onChange={(e) => setPipelineGoal(e.target.value)}
            placeholder={
              isMn
                ? 'Олон агентаар шийдвэрлүүлэх даалгавар (жишээ: SQLite дээр migration хийх найдвартай төлөвлөгөө)...'
                : 'Enter goal for the agent swarm (e.g. Design safe SQLite migration pipeline)...'
            }
            className="flex-1 bg-[#0a0711] border border-[#2b1c4a] rounded-xl px-4 py-2.5 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500 font-sans"
          />
          <button
            type="submit"
            disabled={!pipelineGoal.trim() || isRunningPipeline}
            className="px-5 py-2.5 rounded-xl bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white font-medium text-xs flex items-center gap-2 transition shadow-md shadow-purple-600/20"
          >
            <Play className={`h-3.5 w-3.5 ${isRunningPipeline ? 'animate-spin' : ''}`} />
            <span>{isMn ? 'Ажиллуулах' : 'Run Pipeline'}</span>
          </button>
        </form>

        {/* Pipeline Execution Output Steps */}
        {isRunningPipeline && (
          <div className="p-6 rounded-xl bg-[#140e24] border border-[#281b45] text-center space-y-2">
            <RefreshCw className="h-6 w-6 animate-spin text-purple-400 mx-auto" />
            <p className="text-xs text-slate-300 font-mono">
              Orchestrating agents: Coordinator decomposing → Planner structuring → Researcher verifying...
            </p>
          </div>
        )}

        {pipelineResult && (
          <div className="space-y-3 pt-2">
            <div className="text-xs font-mono text-purple-300 font-semibold flex items-center gap-1.5">
              <CheckCircle2 className="h-4 w-4 text-emerald-400" />
              <span>Multi-Agent Swarm Execution Complete</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {pipelineResult.pipeline?.map((step: any, idx: number) => (
                <div
                  key={idx}
                  className="p-3.5 rounded-xl bg-[#130d22] border border-[#281a44] space-y-2"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-white flex items-center gap-1.5">
                      <span className="text-purple-400 font-mono">#{idx + 1}</span> {step.agent}
                    </span>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-950/80 text-emerald-300 border border-emerald-500/30">
                      {step.status}
                    </span>
                  </div>
                  <div className="text-[10px] text-slate-400 font-mono">{step.role}</div>
                  <p className="text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-36 overflow-y-auto">
                    {step.output}
                  </p>
                </div>
              ))}
            </div>

            {/* Final Verified Answer */}
            <div className="p-4 rounded-xl bg-[#130d22] border border-[#3b2763] space-y-2">
              <span className="text-xs font-mono uppercase text-purple-300 font-semibold">
                Final Verified Outcome:
              </span>
              <div className="text-xs text-slate-200 whitespace-pre-wrap leading-relaxed font-sans">
                {pipelineResult.finalAnswer}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 7 Agents Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {agents.map((agent) => (
          <div
            key={agent.id}
            onClick={() => setSelectedAgent(agent)}
            className={`p-4 rounded-2xl border transition cursor-pointer space-y-3 ${
              selectedAgent?.id === agent.id
                ? 'bg-[#180f2d] border-purple-500/60 shadow-lg shadow-purple-500/10'
                : 'bg-[#0e0a1a] border-[#22163b] hover:border-purple-500/30 hover:bg-[#130d24]'
            }`}
          >
            <div className="flex items-start justify-between">
              <div className="p-2 rounded-xl bg-[#1d1336] border border-[#2e1d52]">
                {getAgentIcon(agent.id)}
              </div>
              <span
                className={`text-[10px] font-mono px-2 py-0.5 rounded ${
                  agent.status === 'active'
                    ? 'bg-emerald-950/80 text-emerald-300 border border-emerald-500/30'
                    : 'bg-slate-900 text-slate-400 border border-slate-800'
                }`}
              >
                {agent.status.toUpperCase()}
              </span>
            </div>

            <div className="space-y-0.5">
              <h4 className="text-sm font-bold text-white">{agent.name}</h4>
              <div className="text-xs text-purple-300 font-mono">{agent.role}</div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed line-clamp-2">
              {agent.description}
            </p>

            <div className="pt-2 border-t border-[#1d1336] text-[10px] font-mono text-slate-500 flex items-center justify-between">
              <span>Model: {agent.model}</span>
              <span className="text-purple-400">Autonomous</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};
