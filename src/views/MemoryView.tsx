import React, { useState, useEffect, useRef } from 'react';
import {
  Sparkles,
  Search,
  Plus,
  RefreshCw,
  FolderOpen,
  FileText,
  Clock,
  Layers,
  CheckCircle,
  X,
  ExternalLink,
  Milestone,
  Sliders,
  Maximize2,
} from 'lucide-react';
import { MemoryItem, GalaxyGraphData, GalaxyNode } from '../types';

interface MemoryViewProps {
  uiLang: 'mn' | 'en' | 'ja';
  onRunQueryWithFile?: (filename: string, summarize: boolean) => void;
}

export const MemoryView: React.FC<MemoryViewProps> = ({ uiLang, onRunQueryWithFile }) => {
  const isMn = uiLang === 'mn';
  const [subTab, setSubTab] = useState<'recent' | 'notes' | 'structured' | 'graph'>('graph');
  const [graphData, setGraphData] = useState<GalaxyGraphData | null>(null);
  const [memories, setMemories] = useState<MemoryItem[]>([]);
  const [knowledgeFiles, setKnowledgeFiles] = useState<{ name: string; size: number }[]>([]);
  const [selectedNode, setSelectedNode] = useState<GalaxyNode | null>(null);
  const [search, setSearch] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [newCategory, setNewCategory] = useState<MemoryItem['category']>('technical_decision');
  const [newImportance, setNewImportance] = useState<MemoryItem['importance']>('high');
  const [newTags, setNewTags] = useState('agent, memory, decision');
  const [isFlightPaused, setIsFlightPaused] = useState(false);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animationFrameRef = useRef<number | null>(null);
  const rotationRef = useRef({ x: 0.35, y: 0.1 });
  const zoomRef = useRef(1.1);
  const isDraggingRef = useRef(false);
  const lastMousePosRef = useRef({ x: 0, y: 0 });

  // Fetch data
  const fetchData = async () => {
    try {
      const [vaultRes, graphRes, knowRes] = await Promise.all([
        fetch('/api/memory/vault'),
        fetch('/api/memory/galaxy-graph'),
        fetch('/api/knowledge'),
      ]);
      const vaultData = await vaultRes.json();
      const gData = await graphRes.json();
      const kData = await knowRes.json();
      setMemories(vaultData.memories || []);
      setGraphData(gData);
      setKnowledgeFiles(kData || []);
    } catch (err) {
      console.error('Failed to load memory data', err);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  // Canvas 3D Constellation Renderer
  useEffect(() => {
    if (subTab !== 'graph' || !graphData || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let width = (canvas.width = canvas.parentElement?.clientWidth || 900);
    let height = (canvas.height = 540);

    const handleResize = () => {
      if (!canvas.parentElement) return;
      width = canvas.width = canvas.parentElement.clientWidth;
      height = canvas.height = 540;
    };
    window.addEventListener('resize', handleResize);

    const render = () => {
      ctx.clearRect(0, 0, width, height);

      // Deep dark nebula gradient background matching screenshot
      const bgGrad = ctx.createRadialGradient(
        width / 2,
        height / 2,
        40,
        width / 2,
        height / 2,
        width * 0.7
      );
      bgGrad.addColorStop(0, '#1c1130');
      bgGrad.addColorStop(0.4, '#100a1f');
      bgGrad.addColorStop(1, '#07050d');
      ctx.fillStyle = bgGrad;
      ctx.fillRect(0, 0, width, height);

      // Continuous slow rotation if not paused
      if (!isFlightPaused) {
        rotationRef.current.y += 0.0022;
      }

      const rotX = rotationRef.current.x;
      const rotY = rotationRef.current.y;
      const zoom = zoomRef.current;
      const centerX = width / 2;
      const centerY = height / 2;

      // Transform 3D coordinates
      const project = (x: number, y: number, z: number) => {
        // Rotate around Y
        const cosY = Math.cos(rotY);
        const sinY = Math.sin(rotY);
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Rotate around X
        const cosX = Math.cos(rotX);
        const sinX = Math.sin(rotX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        // Perspective projection
        const fov = 400;
        const scale = (fov / (fov + z2 + 300)) * zoom;
        return {
          px: centerX + x1 * scale,
          py: centerY + y2 * scale,
          pz: z2,
          scale,
          visible: z2 > -280,
        };
      };

      // 1. Draw subtle background stars
      graphData.backgroundStars.forEach((star) => {
        const p = project(star.x, star.y, star.z);
        if (!p.visible) return;
        ctx.beginPath();
        ctx.arc(p.px, p.py, Math.max(0.6, star.size * p.scale), 0, Math.PI * 2);
        ctx.fillStyle = `rgba(220, 210, 255, ${star.brightness * Math.min(1, p.scale)})`;
        ctx.fill();
      });

      // Map nodes to projected coordinates
      const projectedNodes = new Map<string, { px: number; py: number; pz: number; scale: number; node: GalaxyNode }>();
      graphData.nodes.forEach((node) => {
        const p = project(node.x, node.y, node.z);
        if (p.visible) {
          projectedNodes.set(node.id, { ...p, node });
        }
      });

      // 2. Draw connecting constellation lines
      ctx.lineWidth = 0.8;
      graphData.links.forEach((link) => {
        const p1 = projectedNodes.get(link.source);
        const p2 = projectedNodes.get(link.target);
        if (p1 && p2) {
          const alpha = Math.max(0.08, Math.min(0.4, (p1.scale + p2.scale) * 0.22));
          ctx.strokeStyle = `rgba(165, 140, 235, ${alpha})`;
          ctx.beginPath();
          ctx.moveTo(p1.px, p1.py);
          ctx.lineTo(p2.px, p2.py);
          ctx.stroke();
        }
      });

      // 3. Draw active cluster stars & glows
      // Sort nodes back-to-front for proper depth
      const sortedNodes = Array.from(projectedNodes.values()).sort((a, b) => b.pz - a.pz);

      sortedNodes.forEach(({ px, py, scale, node }) => {
        const radius = Math.max(2.5, node.size * scale);
        const isHovered = selectedNode?.id === node.id;

        // Outer glow
        const glowRad = radius * (isHovered ? 4.5 : 3);
        const glow = ctx.createRadialGradient(px, py, radius * 0.3, px, py, glowRad);
        glow.addColorStop(0, node.color || '#fff');
        glow.addColorStop(0.5, 'rgba(180, 150, 255, 0.35)');
        glow.addColorStop(1, 'rgba(180, 150, 255, 0)');
        ctx.fillStyle = glow;
        ctx.beginPath();
        ctx.arc(px, py, glowRad, 0, Math.PI * 2);
        ctx.fill();

        // Core star
        ctx.beginPath();
        ctx.arc(px, py, radius, 0, Math.PI * 2);
        ctx.fillStyle = isHovered ? '#ffffff' : '#f5efff';
        ctx.shadowColor = node.color;
        ctx.shadowBlur = isHovered ? 14 : 6;
        ctx.fill();
        ctx.shadowBlur = 0;

        // Label for important or hovered stars
        if (node.importance === 'high' || isHovered || scale > 0.85) {
          ctx.font = `${Math.max(10, Math.round(11 * scale))}px Plus Jakarta Sans, sans-serif`;
          ctx.fillStyle = isHovered ? '#ffffff' : 'rgba(235, 225, 255, 0.88)';
          ctx.textAlign = 'center';
          ctx.fillText(node.label, px, py + radius + 12);
        }
      });

      animationFrameRef.current = requestAnimationFrame(render);
    };

    render();

    return () => {
      window.removeEventListener('resize', handleResize);
      if (animationFrameRef.current) cancelAnimationFrame(animationFrameRef.current);
    };
  }, [subTab, graphData, isFlightPaused, selectedNode]);

  // Mouse drag & zoom handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    isDraggingRef.current = true;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDraggingRef.current) return;
    const dx = e.clientX - lastMousePosRef.current.x;
    const dy = e.clientY - lastMousePosRef.current.y;
    rotationRef.current.y += dx * 0.007;
    rotationRef.current.x += dy * 0.007;
    lastMousePosRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleMouseUp = () => {
    isDraggingRef.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomDelta = e.deltaY * -0.0012;
    zoomRef.current = Math.min(2.5, Math.max(0.5, zoomRef.current + zoomDelta));
  };

  const handleCanvasClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current || !graphData) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const clickY = e.clientY - rect.top;

    // Check hit test for nearest star
    const width = canvasRef.current.width;
    const height = canvasRef.current.height;
    const centerX = width / 2;
    const centerY = height / 2;
    const rotX = rotationRef.current.x;
    const rotY = rotationRef.current.y;
    const zoom = zoomRef.current;

    let closestNode: GalaxyNode | null = null;
    let minDistance = 22;

    graphData.nodes.forEach((node) => {
      const cosY = Math.cos(rotY);
      const sinY = Math.sin(rotY);
      const x1 = node.x * cosY - node.z * sinY;
      const z1 = node.z * cosY + node.x * sinY;

      const cosX = Math.cos(rotX);
      const sinX = Math.sin(rotX);
      const y2 = node.y * cosX - z1 * sinX;
      const z2 = z1 * cosX + node.y * sinX;

      const fov = 400;
      const scale = (fov / (fov + z2 + 300)) * zoom;
      const px = centerX + x1 * scale;
      const py = centerY + y2 * scale;

      const dist = Math.hypot(clickX - px, clickY - py);
      if (dist < minDistance) {
        minDistance = dist;
        closestNode = node;
      }
    });

    if (closestNode) {
      setSelectedNode(closestNode);
    }
  };

  const handleCreateMemory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    try {
      const tagsArray = newTags
        .split(',')
        .map((t) => t.trim())
        .filter(Boolean);
      const res = await fetch('/api/memory/vault', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: newTitle.trim(),
          content: newContent.trim(),
          category: newCategory,
          importance: newImportance,
          tags: tagsArray,
        }),
      });
      const data = await res.json();
      if (data.success) {
        setShowAddModal(false);
        setNewTitle('');
        setNewContent('');
        fetchData();
      }
    } catch (err) {
      console.error('Error adding memory', err);
    }
  };

  const handleDeleteMemory = async (id: string) => {
    try {
      await fetch(`/api/memory/vault/${id}`, { method: 'DELETE' });
      if (selectedNode?.id === id) setSelectedNode(null);
      fetchData();
    } catch (err) {
      console.error('Failed to delete', err);
    }
  };

  const filteredMemories = memories.filter(
    (m) =>
      m.title.toLowerCase().includes(search.toLowerCase()) ||
      m.content.toLowerCase().includes(search.toLowerCase()) ||
      m.tags.some((t) => t.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="p-4 sm:p-6 max-w-7xl mx-auto space-y-4 text-slate-200">
      {/* Outer Card matching the screenshot: | 🌿 Memory — Obsidian Vault */}
      <div className="bg-[#0e0918] border border-[#201633] rounded-2xl overflow-hidden shadow-2xl">
        {/* Card Header */}
        <div className="p-4 px-6 border-b border-[#201633] flex flex-wrap items-center justify-between gap-3 bg-[#110c1e]">
          <div className="flex items-center gap-3">
            <span className="text-emerald-400 font-bold font-mono">| 🌿</span>
            <span className="font-semibold text-white tracking-wide text-sm sm:text-base">
              Memory — Obsidian Vault & Central Knowledge
            </span>
          </div>

          <div className="flex items-center gap-3">
            <span className="px-2.5 py-1 rounded-full bg-[#1b122c] border border-[#2e1f4a] text-[11px] font-mono text-purple-200">
              {graphData?.totalStars || 255} OMI · {knowledgeFiles.length || 186} NOTES
            </span>
          </div>
        </div>

        {/* Tab switcher: Recent 12, Notes, Omi, Graph, Galaxy ✦ */}
        <div className="px-6 py-3 border-b border-[#201633]/80 bg-[#0c0816] flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-1.5 bg-[#150f24] p-1 rounded-xl border border-[#261a3d] text-xs">
            <button
              onClick={() => setSubTab('recent')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                subTab === 'recent'
                  ? 'bg-purple-900/60 text-purple-200 shadow-sm border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Recent 12
            </button>
            <button
              onClick={() => setSubTab('notes')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                subTab === 'notes'
                  ? 'bg-purple-900/60 text-purple-200 shadow-sm border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Notes ({knowledgeFiles.length})
            </button>
            <button
              onClick={() => setSubTab('structured')}
              className={`px-3 py-1.5 rounded-lg transition font-medium ${
                subTab === 'structured'
                  ? 'bg-purple-900/60 text-purple-200 shadow-sm border border-purple-500/30'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              Structured ({memories.length})
            </button>
            <button
              onClick={() => setSubTab('graph')}
              className={`px-3 py-1.5 rounded-lg transition font-medium flex items-center gap-1.5 ${
                subTab === 'graph'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-600/30 font-semibold'
                  : 'text-slate-400 hover:text-white'
              }`}
            >
              <Layers className="h-3.5 w-3.5" />
              <span>Graph</span>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-purple-950/60 hover:bg-purple-900 border border-purple-500/40 text-purple-200 text-xs transition"
            >
              <Plus className="h-3.5 w-3.5" />
              <span>{isMn ? 'Шинэ санамж' : 'New Memory'}</span>
            </button>

            <button
              onClick={() => setSubTab('graph')}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-gradient-to-r from-purple-600/30 to-indigo-600/30 border border-purple-500/40 text-purple-200 text-xs font-mono font-medium"
            >
              <Sparkles className="h-3.5 w-3.5 text-purple-300" />
              <span>Galaxy ✦</span>
            </button>
          </div>
        </div>

        {/* View Content */}
        {subTab === 'graph' ? (
          <div className="relative w-full h-[540px] bg-[#07050d] overflow-hidden select-none cursor-grab active:cursor-grabbing">
            {/* Overlay instruction text matching screenshot! */}
            <div className="absolute top-4 left-6 z-10 pointer-events-none space-y-1 font-mono">
              <div className="flex items-center gap-1.5 text-xs text-purple-300 font-semibold uppercase tracking-wider">
                <Sparkles className="h-3 w-3" />
                <span>MEMORY GALAXY</span>
              </div>
              <div className="text-[11px] text-slate-400">
                {graphData?.totalStars || 255} stars · {graphData?.totalLinks || 1227} links
              </div>
              <div className="text-[10px] text-slate-500 max-w-sm pt-1">
                drag to orbit · scroll to zoom · click a star · double-click to pause flight
              </div>
              <div className="text-[10px] text-purple-400 font-medium">
                ✦ brighter & whiter = more recently touched
              </div>
            </div>

            {/* Flight Pause/Play indicator */}
            <div className="absolute top-4 right-6 z-10">
              <button
                onClick={() => setIsFlightPaused(!isFlightPaused)}
                className="px-2.5 py-1 rounded bg-[#1a122c]/80 border border-[#312152] text-[10px] font-mono text-slate-300 hover:text-white transition"
              >
                {isFlightPaused ? '▶ Resume Flight' : '⏸ Pause Flight'}
              </button>
            </div>

            {/* 3D Canvas */}
            <canvas
              ref={canvasRef}
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onMouseUp={handleMouseUp}
              onWheel={handleWheel}
              onClick={handleCanvasClick}
              onDoubleClick={() => setIsFlightPaused(!isFlightPaused)}
              className="w-full h-full block"
            />

            {/* Selected Star Details Card (Floating Overlay) */}
            {selectedNode && (
              <div className="absolute bottom-6 right-6 z-20 w-80 bg-[#120d20]/95 border border-[#332252] rounded-2xl p-4 shadow-2xl backdrop-blur-md space-y-3 animate-in fade-in zoom-in-95">
                <div className="flex items-start justify-between gap-2 pb-2 border-b border-[#23183b]">
                  <div className="space-y-0.5">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                      {selectedNode.category}
                    </span>
                    <h3 className="text-sm font-bold text-white pt-1">{selectedNode.label}</h3>
                  </div>
                  <button
                    onClick={() => setSelectedNode(null)}
                    className="p-1 rounded text-slate-400 hover:text-white"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-300 leading-relaxed font-sans">
                  {selectedNode.snippet}...
                </p>

                <div className="flex flex-wrap gap-1">
                  {selectedNode.tags?.map((tag) => (
                    <span
                      key={tag}
                      className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#1a132b] text-slate-400"
                    >
                      #{tag}
                    </span>
                  ))}
                </div>

                <div className="pt-2 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-500">
                    Touched: {new Date(selectedNode.updatedAt).toLocaleDateString()}
                  </span>
                  <button
                    onClick={() => {
                      setSubTab('structured');
                      setSearch(selectedNode.label);
                    }}
                    className="text-purple-400 hover:text-purple-200 flex items-center gap-1"
                  >
                    <span>View Record</span>
                    <ExternalLink className="h-3 w-3" />
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : subTab === 'notes' ? (
          /* Notes list from knowledge/ */
          <div className="p-6 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-[#201633]">
              <span className="text-xs font-semibold uppercase font-mono text-slate-400">
                Knowledge & Obsidian Vault Notes ({knowledgeFiles.length})
              </span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {knowledgeFiles.map((file) => (
                <div
                  key={file.name}
                  className="p-4 rounded-xl bg-[#120c22] border border-[#261942] hover:border-purple-500/40 transition flex items-start justify-between gap-3"
                >
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-cyan-400" />
                      <span className="font-mono text-sm font-semibold text-white">
                        {file.name}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400">
                      Grounded local document. Only accessible within safe directory boundaries.
                    </p>
                    <span className="text-[10px] text-slate-500 font-mono">
                      {Math.round(file.size / 1024) || 1} KB
                    </span>
                  </div>

                  <button
                    onClick={() => onRunQueryWithFile?.(file.name, true)}
                    className="px-3 py-1.5 rounded-lg bg-purple-950/80 hover:bg-purple-900 border border-purple-500/30 text-xs text-purple-200 transition shrink-0"
                  >
                    Summarize
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : (
          /* Structured & Recent memories */
          <div className="p-6 space-y-4">
            {/* Search */}
            <div className="relative max-w-md">
              <Search className="h-4 w-4 absolute left-3 top-3 text-slate-500" />
              <input
                type="text"
                placeholder={isMn ? 'Санах ойноос хайх...' : 'Search memory nodes...'}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full bg-[#120c22] border border-[#251840] rounded-xl pl-9 pr-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {filteredMemories.map((m) => (
                <div
                  key={m.id}
                  className="p-4 rounded-xl bg-[#120c22] border border-[#261942] hover:border-purple-500/40 transition space-y-2.5"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-purple-950/80 text-purple-300 border border-purple-500/30">
                      {m.category}
                    </span>
                    <button
                      onClick={() => handleDeleteMemory(m.id)}
                      className="text-slate-500 hover:text-rose-400 text-xs"
                      title="Delete"
                    >
                      &times;
                    </button>
                  </div>

                  <h4 className="text-sm font-semibold text-white">{m.title}</h4>
                  <p className="text-xs text-slate-300 leading-relaxed">{m.content}</p>

                  <div className="flex items-center justify-between pt-2 border-t border-[#1e1336] text-[10px] font-mono text-slate-500">
                    <div className="flex gap-1">
                      {m.tags.map((t) => (
                        <span key={t} className="text-purple-400">
                          #{t}
                        </span>
                      ))}
                    </div>
                    <span>{new Date(m.updatedAt).toLocaleDateString()}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add Memory Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateMemory}
            className="w-full max-w-lg bg-[#120c22] border border-[#312052] rounded-2xl p-6 space-y-4 shadow-2xl"
          >
            <div className="flex items-center justify-between pb-2 border-b border-[#23183b]">
              <h3 className="text-base font-bold text-white">
                {isMn ? 'Төв санах ойд шинэ бүртгэл нэмэх' : 'Add Central Memory Record'}
              </h3>
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="text-slate-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Title / Гарчиг</label>
              <input
                type="text"
                required
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                placeholder="Жишээ: Python AST тооцоолуурын дүрэм..."
                className="w-full bg-[#0a0711] border border-[#2c1d48] rounded-lg px-3 py-2 text-xs text-white outline-none focus:border-purple-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">Category / Төрөл</label>
                <select
                  value={newCategory}
                  onChange={(e) => setNewCategory(e.target.value as any)}
                  className="w-full bg-[#0a0711] border border-[#2c1d48] rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                >
                  <option value="preference">Preference (Сонголт)</option>
                  <option value="goal">Goal (Зорилго)</option>
                  <option value="technical_decision">Technical Decision (Шийдвэр)</option>
                  <option value="knowledge_note">Knowledge Note (Мэдлэг)</option>
                  <option value="error_solution">Error Solution (Шийдэл)</option>
                </select>
              </div>

              <div className="space-y-1">
                <label className="text-xs font-mono text-slate-400">Importance / Ач холбогдол</label>
                <select
                  value={newImportance}
                  onChange={(e) => setNewImportance(e.target.value as any)}
                  className="w-full bg-[#0a0711] border border-[#2c1d48] rounded-lg px-2.5 py-2 text-xs text-white outline-none"
                >
                  <option value="high">High (Өндөр)</option>
                  <option value="medium">Medium (Дунд)</option>
                  <option value="low">Low (Бага)</option>
                </select>
              </div>
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Content / Агуулга</label>
              <textarea
                required
                rows={4}
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Санах ойд хадгалах дэлгэрэнгүй тайлбар..."
                className="w-full bg-[#0a0711] border border-[#2c1d48] rounded-lg p-3 text-xs text-white outline-none focus:border-purple-500 leading-relaxed"
              />
            </div>

            <div className="space-y-1">
              <label className="text-xs font-mono text-slate-400">Tags / Түлхүүр үгс (таслалаар)</label>
              <input
                type="text"
                value={newTags}
                onChange={(e) => setNewTags(e.target.value)}
                placeholder="security, ast, windows"
                className="w-full bg-[#0a0711] border border-[#2c1d48] rounded-lg px-3 py-2 text-xs text-white outline-none"
              />
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={() => setShowAddModal(false)}
                className="px-4 py-2 rounded-lg text-xs text-slate-400 hover:text-white"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-4 py-2 rounded-lg text-xs font-medium bg-purple-600 hover:bg-purple-500 text-white shadow-md transition"
              >
                Save to Vault
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
