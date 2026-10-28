import React, { useState, useEffect } from 'react';
import {
  Activity,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Search,
  Shield,
  FileCode,
  Clock,
  Eye,
  Lock,
} from 'lucide-react';
import { ActivityItem } from '../types';

interface ActivityViewProps {
  uiLang: 'mn' | 'en' | 'ja';
}

export const ActivityView: React.FC<ActivityViewProps> = ({ uiLang }) => {
  const isMn = uiLang === 'mn';
  const [activities, setActivities] = useState<ActivityItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [filterAgent, setFilterAgent] = useState('ALL');
  const [search, setSearch] = useState('');
  const [selectedDiff, setSelectedDiff] = useState<string | null>(null);

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/activity');
      const data = await res.json();
      setActivities(data || []);
    } catch (err) {
      console.error('Failed to load activities', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchActivities();
  }, []);

  const filtered = activities.filter((act) => {
    const matchAgent = filterAgent === 'ALL' || act.agent === filterAgent;
    const matchSearch =
      act.action.toLowerCase().includes(search.toLowerCase()) ||
      act.target.toLowerCase().includes(search.toLowerCase()) ||
      act.details.toLowerCase().includes(search.toLowerCase());
    return matchAgent && matchSearch;
  });

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Top Banner */}
      <div className="bg-[#0e0a1a] border border-[#23173d] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Activity className="h-5 w-5 text-amber-400" />
            <h2 className="text-lg font-bold text-white">
              {isMn ? 'Ажлын Түүх ба Аудит (Pipeline)' : 'Execution Pipeline & Audit Trail'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {isMn
              ? 'AI ямар үйлдэл хийсэн, ямар файл уншсан, ямар тест шалгасныг мөрдөх боломжтой. Нууц мэдээлэл болон API түлхүүрүүд автоматаар нууцлагдсан.'
              : 'Every file read, calculator AST check, peer-review, and model completion is audited with masked secrets.'}
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/80 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
            <Lock className="h-3.5 w-3.5" />
            <span>Secrets Masked</span>
          </div>

          <button
            onClick={fetchActivities}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-[#170f2b] hover:bg-[#22163d] text-slate-300 rounded-lg text-xs transition border border-[#2f1f4e]"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isMn ? 'Шинэчлэх' : 'Refresh'}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-[#0d0918] p-3 rounded-2xl border border-[#201538]">
        <div className="relative flex-1 min-w-[200px] max-w-md">
          <Search className="h-3.5 w-3.5 absolute left-3 top-3 text-slate-500" />
          <input
            type="text"
            placeholder={isMn ? 'Аудит логиос хайх...' : 'Filter audit events...'}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-[#0a0711] border border-[#261942] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-purple-500"
          />
        </div>

        <div className="flex items-center gap-1.5 overflow-x-auto text-xs font-mono">
          {['ALL', 'Coordinator', 'Planner', 'Researcher', 'Coder', 'Reviewer', 'Tester', 'Memory Agent'].map(
            (ag) => (
              <button
                key={ag}
                onClick={() => setFilterAgent(ag)}
                className={`px-2.5 py-1 rounded-lg transition ${
                  filterAgent === ag
                    ? 'bg-purple-600 text-white font-bold'
                    : 'bg-[#150f24] text-slate-400 hover:text-white border border-[#261a3d]'
                }`}
              >
                {ag}
              </button>
            )
          )}
        </div>
      </div>

      {/* Event Log Table */}
      <div className="bg-[#0d0918] border border-[#201538] rounded-2xl overflow-hidden shadow-xl">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#120c22] border-b border-[#201538] text-[11px] font-mono uppercase text-slate-400">
              <tr>
                <th className="p-3.5 pl-5">Timestamp</th>
                <th className="p-3.5">Agent</th>
                <th className="p-3.5">Action</th>
                <th className="p-3.5">Target</th>
                <th className="p-3.5">Details</th>
                <th className="p-3.5 pr-5">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#1e1336]">
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={6} className="p-8 text-center text-slate-500 text-xs font-mono">
                    No activity records found
                  </td>
                </tr>
              ) : (
                filtered.map((item) => (
                  <tr key={item.id} className="hover:bg-[#130d24] transition">
                    <td className="p-3.5 pl-5 font-mono text-[11px] text-slate-400 whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <Clock className="h-3 w-3 text-slate-500" />
                        <span>{new Date(item.timestamp).toLocaleTimeString()}</span>
                      </div>
                    </td>

                    <td className="p-3.5 font-mono">
                      <span className="px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                        {item.agent}
                      </span>
                    </td>

                    <td className="p-3.5 font-mono text-white font-semibold">
                      {item.action}
                    </td>

                    <td className="p-3.5 font-mono text-cyan-300 max-w-[180px] truncate">
                      {item.target}
                    </td>

                    <td className="p-3.5 text-slate-300 max-w-sm truncate font-sans">
                      {item.details}
                    </td>

                    <td className="p-3.5 pr-5 font-mono whitespace-nowrap">
                      {item.status === 'PASS' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-400 bg-emerald-950 px-2 py-0.5 rounded border border-emerald-500/40">
                          <CheckCircle2 className="h-3 w-3" /> PASS
                        </span>
                      ) : item.status === 'NEEDS_REVIEW' ? (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-300 bg-amber-950 px-2 py-0.5 rounded border border-amber-500/40">
                          <AlertTriangle className="h-3 w-3" /> REVIEW
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[10px] font-bold text-rose-400 bg-rose-950 px-2 py-0.5 rounded border border-rose-500/40">
                          <XCircle className="h-3 w-3" /> FAIL
                        </span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
