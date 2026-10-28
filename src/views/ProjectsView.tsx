import React, { useState, useEffect } from 'react';
import {
  Paperclip,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileText,
  FolderOpen,
  Calendar,
  Milestone,
  ArrowRight,
  ShieldCheck,
  CheckCheck,
} from 'lucide-react';
import { Project, ProjectTask, ProjectDecision } from '../types';

interface ProjectsViewProps {
  uiLang: 'mn' | 'en' | 'ja';
}

export const ProjectsView: React.FC<ProjectsViewProps> = ({ uiLang }) => {
  const isMn = uiLang === 'mn';
  const [projects, setProjects] = useState<Project[]>([]);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskAgent, setNewTaskAgent] = useState('Coder');
  const [newDecTitle, setNewDecTitle] = useState('');
  const [newDecRationale, setNewDecRationale] = useState('');
  const [showAddProject, setShowAddProject] = useState(false);
  const [newProjName, setNewProjName] = useState('');
  const [newProjDesc, setNewProjDesc] = useState('');
  const [newProjPath, setNewProjPath] = useState('');

  const fetchProjects = async () => {
    try {
      const res = await fetch('/api/projects');
      const data = await res.json();
      setProjects(data || []);
      if (data && data.length > 0 && !selectedProject) {
        setSelectedProject(data[0]);
      } else if (selectedProject) {
        const found = data.find((p: any) => p.id === selectedProject.id);
        if (found) setSelectedProject(found);
      }
    } catch (err) {
      console.error('Failed to load projects', err);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, []);

  const handleAddTask = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newTaskTitle.trim()) return;

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/tasks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newTaskTitle.trim(), agent: newTaskAgent }),
      });
      const data = await res.json();
      if (data.success) {
        setNewTaskTitle('');
        fetchProjects();
      }
    } catch (err) {
      console.error('Error adding task', err);
    }
  };

  const handleUpdateTaskStatus = async (taskId: string, currentStatus: string) => {
    if (!selectedProject) return;
    const nextStatus = currentStatus === 'todo' ? 'in_progress' : currentStatus === 'in_progress' ? 'verified' : 'todo';
    const progress = nextStatus === 'verified' ? 100 : nextStatus === 'in_progress' ? 50 : 0;

    try {
      await fetch(`/api/projects/${selectedProject.id}/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: nextStatus, progress }),
      });
      fetchProjects();
    } catch (err) {
      console.error('Failed to update task', err);
    }
  };

  const handleAddDecision = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedProject || !newDecTitle.trim() || !newDecRationale.trim()) return;

    try {
      const res = await fetch(`/api/projects/${selectedProject.id}/decisions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: newDecTitle.trim(), rationale: newDecRationale.trim() }),
      });
      const data = await res.json();
      if (data.success) {
        setNewDecTitle('');
        setNewDecRationale('');
        fetchProjects();
      }
    } catch (err) {
      console.error('Error adding decision', err);
    }
  };

  const handleCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjName.trim()) return;

    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: newProjName.trim(),
          description: newProjDesc.trim(),
          path: newProjPath.trim() || 'knowledge/',
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddProject(false);
        setNewProjName('');
        setNewProjDesc('');
        setNewProjPath('');
        fetchProjects();
      }
    } catch (err) {
      console.error('Error creating project', err);
    }
  };

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-6 text-slate-200">
      {/* Top Banner */}
      <div className="bg-[#0e0a1a] border border-[#23173d] rounded-2xl p-6 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <Paperclip className="h-5 w-5 text-cyan-400" />
            <h2 className="text-lg font-bold text-white">
              {isMn ? 'Төслийн Удирдлага (Paperclip)' : 'Paperclip Project Management'}
            </h2>
          </div>
          <p className="text-xs text-slate-400 max-w-2xl leading-relaxed">
            {isMn
              ? 'Төсөл тус бүрийн зорилго, даалгаврын хуваарилалт, шийдвэрийн бүртгэл, файлын байршил.'
              : 'Isolated workspaces per project with dedicated task milestones, decision logs, and audit histories.'}
          </p>
        </div>

        <button
          onClick={() => setShowAddProject(true)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 text-white text-xs font-medium transition shadow-md shadow-purple-600/20"
        >
          <Plus className="h-4 w-4" />
          <span>{isMn ? 'Шинэ төсөл үүсгэх' : 'Create Project'}</span>
        </button>
      </div>

      {/* Main Grid: Projects List + Selected Project Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Project Selector Sidebar */}
        <div className="space-y-3">
          <div className="text-xs font-mono uppercase tracking-wider text-slate-400 px-1">
            Projects ({projects.length})
          </div>

          <div className="space-y-2">
            {projects.map((proj) => {
              const isSelected = selectedProject?.id === proj.id;
              return (
                <div
                  key={proj.id}
                  onClick={() => setSelectedProject(proj)}
                  className={`p-4 rounded-2xl border transition cursor-pointer space-y-2 ${
                    isSelected
                      ? 'bg-[#180f2d] border-purple-500/60 shadow-lg shadow-purple-500/10'
                      : 'bg-[#0d0918] border-[#201538] hover:border-purple-500/30 hover:bg-[#120b22]'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <h4 className="text-sm font-bold text-white">{proj.name}</h4>
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950/80 text-purple-300">
                      {proj.status}
                    </span>
                  </div>

                  <p className="text-xs text-slate-400 line-clamp-2">{proj.description}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1e1336] text-[10px] font-mono text-slate-500">
                    <span>{proj.tasks?.length || 0} tasks</span>
                    <span>{proj.decisions?.length || 0} decisions</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Selected Project Details */}
        {selectedProject && (
          <div className="lg:col-span-2 space-y-5">
            {/* Project Overview Card */}
            <div className="p-5 rounded-2xl bg-[#0d0918] border border-[#201538] space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-2 pb-2 border-b border-[#201538]">
                <div>
                  <h3 className="text-base font-bold text-white">{selectedProject.name}</h3>
                  <div className="text-xs text-purple-300 font-mono">{selectedProject.tagline}</div>
                </div>
                <div className="text-[11px] font-mono text-slate-400 bg-[#160f26] px-3 py-1 rounded-lg border border-[#2b1c4a]">
                  Path: {selectedProject.path}
                </div>
              </div>

              <p className="text-xs text-slate-300 leading-relaxed font-sans">
                {selectedProject.description}
              </p>
            </div>

            {/* Tasks Board & Add Task */}
            <div className="p-5 rounded-2xl bg-[#0d0918] border border-[#201538] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#201538]">
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  {isMn ? 'Даалгавруудын жагсаалт (Tasks)' : 'Project Tasks'} ({selectedProject.tasks?.length || 0})
                </h4>
                <span className="text-[10px] text-slate-400 font-mono">
                  Click status pill to advance: Todo → In Progress → Verified
                </span>
              </div>

              {/* Add Task Input Form */}
              <form onSubmit={handleAddTask} className="flex gap-2">
                <input
                  type="text"
                  value={newTaskTitle}
                  onChange={(e) => setNewTaskTitle(e.target.value)}
                  placeholder={isMn ? 'Шинэ даалгавар нэмэх...' : 'Add new task...'}
                  className="flex-1 bg-[#0a0711] border border-[#2b1c4a] rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 outline-none focus:border-purple-500"
                />
                <select
                  value={newTaskAgent}
                  onChange={(e) => setNewTaskAgent(e.target.value)}
                  className="bg-[#0a0711] border border-[#2b1c4a] rounded-xl px-2.5 py-2 text-xs text-white outline-none"
                >
                  <option value="Planner">Planner</option>
                  <option value="Researcher">Researcher</option>
                  <option value="Coder">Coder</option>
                  <option value="Reviewer">Reviewer</option>
                  <option value="Tester">Tester</option>
                  <option value="Memory Agent">Memory</option>
                </select>
                <button
                  type="submit"
                  disabled={!newTaskTitle.trim()}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-xl text-xs font-medium transition"
                >
                  {isMn ? 'Нэмэх' : 'Add'}
                </button>
              </form>

              {/* Tasks List */}
              <div className="space-y-2">
                {selectedProject.tasks?.map((task) => (
                  <div
                    key={task.id}
                    className="p-3 rounded-xl bg-[#120c22] border border-[#24173e] flex items-center justify-between gap-3"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-500/30">
                          {task.agent}
                        </span>
                        <span className="text-xs font-semibold text-white truncate">
                          {task.title}
                        </span>
                      </div>
                    </div>

                    <button
                      onClick={() => handleUpdateTaskStatus(task.id, task.status)}
                      className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold transition flex items-center gap-1 shrink-0 ${
                        task.status === 'verified'
                          ? 'bg-emerald-950 text-emerald-400 border border-emerald-500/40'
                          : task.status === 'in_progress'
                          ? 'bg-purple-950 text-purple-300 border border-purple-500/40'
                          : 'bg-slate-900 text-slate-400 border border-slate-700'
                      }`}
                    >
                      {task.status === 'verified' && <CheckCheck className="h-3 w-3" />}
                      <span>{task.status.toUpperCase()}</span>
                    </button>
                  </div>
                ))}
              </div>
            </div>

            {/* Decision Log (Section 3.5 Шийдвэрийн бүртгэл) */}
            <div className="p-5 rounded-2xl bg-[#0d0918] border border-[#201538] space-y-4">
              <div className="flex items-center justify-between pb-2 border-b border-[#201538]">
                <h4 className="text-sm font-bold text-white font-mono uppercase tracking-wider">
                  {isMn ? 'Шийдвэрийн бүртгэл (Decision Log)' : 'Architecture Decisions'}
                </h4>
              </div>

              {/* Add Decision Form */}
              <form onSubmit={handleAddDecision} className="space-y-2 bg-[#120c22] p-3 rounded-xl border border-[#261942]">
                <input
                  type="text"
                  value={newDecTitle}
                  onChange={(e) => setNewDecTitle(e.target.value)}
                  placeholder="Шийдвэр / Title (жишээ: PostgreSQL оронд SQLite сонгосон)"
                  className="w-full bg-[#0a0711] border border-[#2b1c4a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                />
                <input
                  type="text"
                  value={newDecRationale}
                  onChange={(e) => setNewDecRationale(e.target.value)}
                  placeholder="Шалтгаан / Rationale (жишээ: Windows болон офлайн орчинд хялбар ажиллана)"
                  className="w-full bg-[#0a0711] border border-[#2b1c4a] rounded-lg px-3 py-1.5 text-xs text-white outline-none focus:border-purple-500"
                />
                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={!newDecTitle.trim() || !newDecRationale.trim()}
                    className="px-3 py-1.5 bg-purple-600 hover:bg-purple-500 disabled:opacity-40 text-white rounded-lg text-xs font-medium transition"
                  >
                    Log Decision
                  </button>
                </div>
              </form>

              {/* Decisions list */}
              <div className="space-y-2">
                {selectedProject.decisions?.map((dec) => (
                  <div
                    key={dec.id}
                    className="p-3 rounded-xl bg-[#120c22] border border-[#24173e] space-y-1"
                  >
                    <div className="flex items-center justify-between text-[11px] font-mono text-purple-300">
                      <span className="font-semibold">{dec.title}</span>
                      <span className="text-slate-500">{dec.date}</span>
                    </div>
                    <p className="text-xs text-slate-300 leading-relaxed font-sans">
                      {dec.rationale}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Create Project Modal */}
      {showAddProject && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateProject}
            className="w-full max-w-md bg-[#120c22] border border-[#312052] rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <h3 className="text-base font-bold text-white pb-2 border-b border-[#24173e]">
              {isMn ? 'Шинэ төсөл үүсгэх' : 'Create New Project'}
            </h3>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Project Name</label>
              <input
                type="text"
                required
                value={newProjName}
                onChange={(e) => setNewProjName(e.target.value)}
                placeholder="My Personal Agent Project"
                className="w-full bg-[#0a0711] border border-[#2c1d48] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Path / Code Location</label>
              <input
                type="text"
                value={newProjPath}
                onChange={(e) => setNewProjPath(e.target.value)}
                placeholder="C:\Users\enhtv\Documents\ai-engineer-course"
                className="w-full bg-[#0a0711] border border-[#2c1d48] rounded-lg px-3 py-2 text-xs text-white outline-none font-mono"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Description</label>
              <textarea
                rows={3}
                value={newProjDesc}
                onChange={(e) => setNewProjDesc(e.target.value)}
                placeholder="Төслийн зорилго ба шаардлага..."
                className="w-full bg-[#0a0711] border border-[#2c1d48] rounded-lg p-3 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddProject(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-md transition"
              >
                Create Project
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
