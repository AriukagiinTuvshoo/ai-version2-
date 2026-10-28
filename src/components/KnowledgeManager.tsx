import React, { useState, useEffect } from 'react';
import {
  FileText,
  FolderOpen,
  Plus,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  Save,
  CheckCircle,
  AlertCircle,
  FileCode,
} from 'lucide-react';
import { KnowledgeFile } from '../types';

interface KnowledgeManagerProps {
  uiLang: 'mn' | 'en';
  onRunQueryWithFile?: (filename: string, summarize: boolean) => void;
}

export const KnowledgeManager: React.FC<KnowledgeManagerProps> = ({
  uiLang,
  onRunQueryWithFile,
}) => {
  const isMn = uiLang === 'mn';
  const [files, setFiles] = useState<KnowledgeFile[]>([]);
  const [selectedFile, setSelectedFile] = useState<KnowledgeFile | null>(null);
  const [search, setSearch] = useState('');
  const [loading, setLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newFilename, setNewFilename] = useState('');
  const [fileContent, setFileContent] = useState('');
  const [statusMsg, setStatusMsg] = useState<{ text: string; ok: boolean } | null>(null);

  const fetchFiles = async () => {
    setLoading(true);
    try {
      const res = await fetch('/api/knowledge');
      const data: KnowledgeFile[] = await res.json();
      setFiles(data);
      if (data.length > 0 && !selectedFile) {
        setSelectedFile(data[0]);
        setFileContent(data[0].content);
      } else if (selectedFile) {
        const found = data.find((f) => f.name === selectedFile.name);
        if (found) {
          setSelectedFile(found);
          setFileContent(found.content);
        }
      }
    } catch {
      setStatusMsg({
        text: isMn ? 'Файлуудыг уншихад алдаа гарлаа' : 'Failed to fetch knowledge files',
        ok: false,
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFiles();
  }, []);

  const handleSelectFile = (file: KnowledgeFile) => {
    setIsCreating(false);
    setSelectedFile(file);
    setFileContent(file.content);
  };

  const handleSaveFile = async () => {
    const filenameToSave = isCreating ? newFilename.trim() : selectedFile?.name;
    if (!filenameToSave) {
      setStatusMsg({
        text: isMn ? 'Файлын нэр оруулна уу' : 'Please provide a filename',
        ok: false,
      });
      return;
    }

    if (!filenameToSave.endsWith('.txt') && !filenameToSave.endsWith('.md')) {
      setStatusMsg({
        text: isMn ? 'Зөвхөн .txt эсвэл .md өргөтгөлтэй файл зөвшөөрнө' : 'Only .txt and .md allowed',
        ok: false,
      });
      return;
    }

    try {
      const res = await fetch('/api/knowledge', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ filename: filenameToSave, content: fileContent }),
      });
      const data = await res.json();
      if (data.success) {
        setStatusMsg({
          text: isMn ? `Файл амжилттай хадгалагдлаа: ${data.filename}` : `Saved ${data.filename}`,
          ok: true,
        });
        setIsCreating(false);
        setNewFilename('');
        await fetchFiles();
      } else {
        setStatusMsg({ text: data.error || 'Save error', ok: false });
      }
    } catch (err: any) {
      setStatusMsg({ text: err.message, ok: false });
    }
  };

  const filteredFiles = files.filter((f) =>
    f.name.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-6xl mx-auto p-4 space-y-4">
      {/* Header Info Banner */}
      <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <FolderOpen className="h-5 w-5 text-indigo-400" />
            <h2 className="text-base font-bold text-white">
              {isMn ? 'Орон нутгийн мэдлэгийн сан (knowledge/)' : 'Knowledge Repository (knowledge/)'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 mt-1">
            {isMn
              ? 'Агент энэ хавтас дахь бодит .txt болон .md файлуудыг уншиж, бодит баримтаар баталгаажсан дүгнэлт гаргана.'
              : 'The agent reads real local .txt & .md documents from this directory to ground answers in verified facts.'}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-mono">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{isMn ? 'Хандалтын хамгаалалт: Идэвхтэй' : 'Path Traversal Shield: Active'}</span>
          </div>

          <button
            onClick={() => {
              setIsCreating(true);
              setSelectedFile(null);
              setNewFilename('new_notes.txt');
              setFileContent('');
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-lg text-xs font-medium transition"
          >
            <Plus className="h-3.5 w-3.5" />
            <span>{isMn ? 'Шинэ файл үүсгэх' : 'New Note'}</span>
          </button>
        </div>
      </div>

      {statusMsg && (
        <div
          className={`px-4 py-2.5 rounded-lg text-xs flex items-center gap-2 ${
            statusMsg.ok
              ? 'bg-emerald-950/80 border border-emerald-500/50 text-emerald-300'
              : 'bg-rose-950/80 border border-rose-500/50 text-rose-300'
          }`}
        >
          {statusMsg.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
          <span>{statusMsg.text}</span>
        </div>
      )}

      {/* Main Grid: File List & Content Editor */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Sidebar / Files List */}
        <div className="bg-slate-900 border border-slate-800 rounded-xl p-3 space-y-3">
          <div className="flex items-center justify-between pb-2 border-b border-slate-800">
            <span className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
              {isMn ? 'Файлууд' : 'Files'} ({files.length})
            </span>
            <button
              onClick={fetchFiles}
              className="p-1 hover:bg-slate-800 rounded text-slate-400 hover:text-white transition"
              title="Refresh"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="h-3.5 w-3.5 absolute left-2.5 top-2.5 text-slate-500" />
            <input
              type="text"
              placeholder={isMn ? 'Хайх...' : 'Filter files...'}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-lg pl-8 pr-3 py-1.5 text-xs text-slate-200 outline-none focus:border-indigo-500"
            />
          </div>

          {/* List items */}
          <div className="space-y-1.5 max-h-96 overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <p className="text-xs text-slate-500 p-2 text-center">
                {isMn ? 'Файл олдсонгүй' : 'No files found'}
              </p>
            ) : (
              filteredFiles.map((file) => {
                const isSelected = selectedFile?.name === file.name && !isCreating;
                return (
                  <button
                    key={file.name}
                    onClick={() => handleSelectFile(file)}
                    className={`w-full text-left p-2.5 rounded-lg text-xs transition border flex items-center justify-between ${
                      isSelected
                        ? 'bg-indigo-600/20 border-indigo-500/50 text-indigo-200'
                        : 'bg-slate-950/60 border-slate-850 text-slate-300 hover:bg-slate-800/80 hover:text-white'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <FileText
                        className={`h-4 w-4 shrink-0 ${
                          isSelected ? 'text-indigo-400' : 'text-slate-400'
                        }`}
                      />
                      <span className="truncate font-mono">{file.name}</span>
                    </div>
                    <span className="text-[10px] text-slate-500 font-mono shrink-0">
                      {Math.round(file.size / 1024) || 1} KB
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Content Viewer / Editor */}
        <div className="md:col-span-2 bg-slate-900 border border-slate-800 rounded-xl p-4 flex flex-col space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-slate-800">
            {isCreating ? (
              <div className="flex items-center gap-2 flex-1">
                <span className="text-xs text-slate-400 font-mono">knowledge/</span>
                <input
                  type="text"
                  value={newFilename}
                  onChange={(e) => setNewFilename(e.target.value)}
                  placeholder="filename.txt"
                  className="bg-slate-950 border border-slate-700 rounded px-2.5 py-1 text-xs text-white font-mono outline-none focus:border-indigo-500"
                />
              </div>
            ) : selectedFile ? (
              <div className="flex items-center gap-2">
                <FileCode className="h-4 w-4 text-cyan-400" />
                <span className="font-mono text-sm font-semibold text-white">
                  knowledge/{selectedFile.name}
                </span>
                <span className="text-[11px] text-slate-400 font-mono">
                  ({fileContent.length} chars)
                </span>
              </div>
            ) : (
              <span className="text-xs text-slate-400">{isMn ? 'Файл сонгоно уу' : 'Select a file'}</span>
            )}

            {/* Quick Actions with Agent */}
            {selectedFile && !isCreating && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onRunQueryWithFile?.(selectedFile.name, true)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-cyan-950/70 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-900 text-xs transition"
                  title="Хураангуйлах хүсэлт илгээх"
                >
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{isMn ? 'Агентаар хураангуйлах' : 'Summarize with Agent'}</span>
                </button>
                <button
                  onClick={() => onRunQueryWithFile?.(selectedFile.name, false)}
                  className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-indigo-950/70 border border-indigo-500/40 text-indigo-300 hover:bg-indigo-900 text-xs transition"
                >
                  <span>{isMn ? 'Асуух' : 'Query'}</span>
                </button>
              </div>
            )}
          </div>

          {/* Text Editor Textarea */}
          <textarea
            value={fileContent}
            onChange={(e) => setFileContent(e.target.value)}
            placeholder={
              isMn
                ? 'Файлын агуулгыг энд бичнэ үү...'
                : 'Enter the text or markdown content of this knowledge document...'
            }
            className="w-full flex-1 min-h-[340px] bg-slate-950 border border-slate-800 rounded-lg p-3 text-xs sm:text-sm font-mono text-slate-200 outline-none focus:border-indigo-500 leading-relaxed resize-y"
          />

          {/* Footer Save Button */}
          <div className="flex items-center justify-between pt-2">
            <span className="text-[11px] text-slate-500 font-mono">
              {isMn
                ? 'Аюулгүй байдал: Зөвхөн knowledge хавтас доторх файлуудад хандана.'
                : 'Safety rule: Confined strictly within knowledge/ directory.'}
            </span>

            <button
              onClick={handleSaveFile}
              className="flex items-center gap-1.5 px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-medium transition shadow-md shadow-emerald-600/20"
            >
              <Save className="h-3.5 w-3.5" />
              <span>{isMn ? 'Хадгалах' : 'Save File'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
