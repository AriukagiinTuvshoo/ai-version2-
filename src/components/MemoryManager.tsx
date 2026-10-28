import React, { useState, useEffect } from 'react';
import {
  Database,
  Search,
  Plus,
  Trash2,
  RefreshCw,
  Clock,
  Key,
  MessageSquare,
  ShieldAlert,
  CheckCircle,
} from 'lucide-react';
import { V4MemoryItem, KVMemoryItem } from '../types';

interface MemoryManagerProps {
  uiLang: 'mn' | 'en';
}

export const MemoryManager: React.FC<MemoryManagerProps> = ({ uiLang }) => {
  const isMn = uiLang === 'mn';
  const [subTab, setSubTab] = useState<'v4' | 'kv'>('v4');
  const [v4List, setV4List] = useState<V4MemoryItem[]>([]);
  const [kvList, setKvList] = useState<KVMemoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [newKey, setNewKey] = useState('');
  const [newVal, setNewVal] = useState('');
  const [message, setMessage] = useState<string | null>(null);

  const fetchMemories = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/memories');
      const data = await res.json();
      setV4List(data.v4_conversations || []);
      setKvList(data.kv_memories || []);
    } catch {
      setMessage('Failed to load memories');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMemories();
  }, []);

  const handleAddKV = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKey.trim() || !newVal.trim()) return;

    try {
      const res = await fetch('/api/memories/kv', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: newKey.trim(), value: newVal.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setMessage(isMn ? `Хадгаллаа: ${newKey}` : `Saved: ${newKey}`);
        setNewKey('');
        setNewVal('');
        fetchMemories();
      }
    } catch {
      setMessage('Error adding key-value');
    }
  };

  const handleDeleteKV = async (key: string) => {
    try {
      const res = await fetch(`/api/memories/kv/${encodeURIComponent(key)}`, {
        method: 'DELETE',
      });
      const data = await res.json();
      if (data.success) {
        setMessage(isMn ? `Устгалаа: ${key}` : `Deleted: ${key}`);
        fetchMemories();
      }
    } catch {
      setMessage('Error deleting key');
    }
  };

  const filteredV4 = v4List.filter(
    (item) =>
      item.user_text.toLowerCase().includes(search.toLowerCase()) ||
      item.assistant_text.toLowerCase().includes(search.toLowerCase())
  );

  const filteredKV = kvList.filter(
    (item) =>
      item.key.toLowerCase().includes(search.toLowerCase()) ||
      item.value.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Top Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <Database className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              {isMn ? 'Агентийн Санах Ойн Удирдлага' : 'Dual Agent Memory Management'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isMn
              ? 'V4 ярианы тусгаарлагдсан санах ой болон AI туслахын түлхүүр-утгат санах ой.'
              : 'Isolated V4 explicit opt-in conversation memory and AI Assistant Key-Value storage.'}
          </p>
        </div>

        {/* Sub-tab selection */}
        <div className="flex bg-slate-950 p-1 rounded-lg border border-slate-800 text-xs font-medium">
          <button
            onClick={() => setSubTab('v4')}
            className={`px-3 py-1.5 rounded-md transition ${
              subTab === 'v4'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isMn ? 'V4 Ярианы Санах ой' : 'V4 Conversations'} ({v4List.length})
          </button>
          <button
            onClick={() => setSubTab('kv')}
            className={`px-3 py-1.5 rounded-md transition ${
              subTab === 'kv'
                ? 'bg-indigo-600 text-white'
                : 'text-slate-400 hover:text-white'
            }`}
          >
            {isMn ? 'Түлхүүр-Утгат сан (/санах)' : 'KV Memory (/санах)'} ({kvList.length})
          </button>
        </div>
      </div>

      {message && (
        <div className="bg-indigo-950/80 border border-indigo-500/40 text-indigo-200 text-xs px-4 py-2 rounded-lg flex items-center justify-between">
          <span>{message}</span>
          <button onClick={() => setMessage(null)} className="text-slate-400 hover:text-white">
            &times;
          </button>
        </div>
      )}

      {/* Main Container */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 space-y-4">
        {/* Controls: Search and Refresh */}
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="relative flex-1 max-w-md">
            <Search className="h-3.5 w-3.5 absolute left-3 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder={isMn ? 'Санах ойноос хайх...' : 'Search in memory records...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-9 pr-3 py-1.5 text-xs text-white outline-none focus:border-indigo-500"
            />
          </div>

          <button
            onClick={fetchMemories}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-750 text-slate-300 rounded-lg text-xs transition"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span>{isMn ? 'Шинэчлэх' : 'Refresh'}</span>
          </button>
        </div>

        {/* V4 Conversations View */}
        {subTab === 'v4' && (
          <div className="space-y-3">
            <div className="text-xs text-slate-400 flex items-center gap-2 bg-slate-950/60 p-2.5 rounded-lg border border-slate-850">
              <ShieldAlert className="h-4 w-4 text-cyan-400 shrink-0" />
              <span>
                {isMn
                  ? 'V4 дүрэм: Хэрэглэгч тухай бүр зөвшөөрсөн (opt-in) үед л энэхүү тусдаа санах ойд бичигдэнэ.'
                  : 'V4 Safety rule: Conversations are stored only upon explicit opt-in confirmation per turn.'}
              </span>
            </div>

            {filteredV4.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {isMn
                  ? 'V4 санах ойд одоогоор яриа хадгалагдаагүй байна. Агент дээр "Save to V4 memory" товч дарж хадгална.'
                  : 'No conversations stored in V4 memory yet. Click "Save to V4 memory" on the Agent Console.'}
              </div>
            ) : (
              <div className="space-y-3">
                {filteredV4.map((item) => (
                  <div
                    key={item.id}
                    className="p-3.5 bg-slate-950 rounded-xl border border-slate-850 space-y-2 hover:border-slate-700 transition"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-slate-500">
                      <span className="flex items-center gap-1.5 text-slate-400">
                        <Clock className="h-3 w-3" />
                        {new Date(item.created_at).toLocaleString()}
                      </span>
                      <span className="px-2 py-0.5 rounded bg-slate-800 text-slate-300 uppercase">
                        {item.language}
                      </span>
                    </div>

                    <div className="text-xs">
                      <span className="text-indigo-400 font-semibold font-mono">User: </span>
                      <span className="text-slate-200">{item.user_text}</span>
                    </div>

                    <div className="text-xs bg-slate-900/60 p-2.5 rounded-lg border border-slate-850 text-slate-300 whitespace-pre-wrap">
                      <span className="text-emerald-400 font-semibold font-mono">Assistant: </span>
                      {item.assistant_text}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* KV Memory View */}
        {subTab === 'kv' && (
          <div className="space-y-4">
            {/* Add new KV form */}
            <form
              onSubmit={handleAddKV}
              className="bg-slate-950 p-3 rounded-xl border border-slate-800 flex flex-wrap items-center gap-2"
            >
              <div className="flex items-center gap-1.5 flex-1 min-w-[150px]">
                <Key className="h-3.5 w-3.5 text-indigo-400 shrink-0" />
                <input
                  type="text"
                  placeholder={isMn ? 'Түлхүүр (жишээ: зорилго)...' : 'Key (e.g. goal)...'}
                  value={newKey}
                  onChange={(e) => setNewKey(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-mono"
                />
              </div>

              <div className="flex-2 min-w-[240px]">
                <input
                  type="text"
                  placeholder={
                    isMn
                      ? 'Утга (жишээ: AI инженер болох)...'
                      : 'Value (e.g. Become an AI engineer)...'
                  }
                  value={newVal}
                  onChange={(e) => setNewVal(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1.5 text-xs text-white outline-none focus:border-indigo-500 font-sans"
                />
              </div>

              <button
                type="submit"
                disabled={!newKey.trim() || !newVal.trim()}
                className="flex items-center gap-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white rounded-lg text-xs font-medium transition"
              >
                <Plus className="h-3.5 w-3.5" />
                <span>{isMn ? 'Хадгалах (/санах)' : 'Add Memory'}</span>
              </button>
            </form>

            {/* List of KV entries */}
            {filteredKV.length === 0 ? (
              <div className="p-8 text-center text-slate-500 text-xs">
                {isMn
                  ? 'Түлхүүр-утгат санах ой одоогоор хоосон байна. Дээрх форм эсвэл /санах командыг ашиглана уу.'
                  : 'Key-value memory is empty. Use the form above or "/санах <key> <val>" command.'}
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                {filteredKV.map((m) => (
                  <div
                    key={m.key}
                    className="p-3 bg-slate-950 rounded-xl border border-slate-850 flex items-start justify-between gap-2 hover:border-slate-700 transition"
                  >
                    <div className="space-y-1 min-w-0">
                      <div className="flex items-center gap-1.5 font-mono text-xs text-indigo-300 font-semibold truncate">
                        <Key className="h-3 w-3 text-indigo-400 shrink-0" />
                        <span className="truncate">{m.key}</span>
                      </div>
                      <p className="text-xs text-slate-200 break-words">{m.value}</p>
                      <p className="text-[10px] text-slate-500 font-mono">
                        {new Date(m.updated_at).toLocaleString()}
                      </p>
                    </div>

                    <button
                      onClick={() => handleDeleteKV(m.key)}
                      className="p-1 text-slate-500 hover:text-rose-400 hover:bg-slate-900 rounded transition shrink-0"
                      title={isMn ? 'Устгах (/мартах)' : 'Delete'}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
