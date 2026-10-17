import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import {
  Search,
  Filter,
  Layers,
  Globe,
  Info,
  Maximize2,
  Minimize2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  RefreshCw,
  AlertTriangle,
  CheckCircle,
  HelpCircle,
  MousePointerClick,
  Sparkles,
  Play,
  Network,
  Cpu,
  ShieldAlert,
  Flame,
  FileCode,
  FileText,
  Activity,
  ArrowRight,
  Sliders,
  ExternalLink,
  ChevronRight,
  Crosshair,
  Eye,
} from 'lucide-react';

import { listAudits, getAuditGraph, createAudit } from '../api/client';
import { RootNode, ResourceNode } from '../components/CustomNodes';
import { ResourceDrawer } from '../components/ResourceDrawer';

const nodeTypes = {
  rootNode: RootNode,
  resourceNode: ResourceNode,
};

/**
 * Computes futuristic concentric orbital coordinates around the root node.
 * Dynamically expands radius and spacing in fullscreen mode for clear readability.
 */
function computeOrbitalLayout(rawNodes, rawEdges, isFullscreen = false) {
  if (!rawNodes || rawNodes.length === 0) return { nodes: [], edges: rawEdges };

  const rootNode = rawNodes.find((n) => n.type === 'rootNode');
  const otherNodes = rawNodes.filter((n) => n.type !== 'rootNode');
  if (!rootNode) return { nodes: rawNodes, edges: rawEdges };

  const centerX = isFullscreen ? 750 : 500;
  const centerY = isFullscreen ? 480 : 380;

  const orbitalNodes = [
    {
      ...rootNode,
      position: { x: centerX - 130, y: centerY - 45 },
    },
  ];

  // Group dependencies into 3 concentric orbits:
  // Orbit 1: Core dynamic logic (scripts & APIs)
  // Orbit 2: Visual styling & assets (CSS, fonts, images)
  // Orbit 3: External perimeter & CDNs (third party, iframes, other)
  const orbit1 = [];
  const orbit2 = [];
  const orbit3 = [];

  otherNodes.forEach((node) => {
    const type = node.data?.resourceType;
    const is3P = node.data?.isThirdParty;
    if (is3P || type === 'subframe') {
      orbit3.push(node);
    } else if (type === 'script' || type === 'xhr' || type === 'fetch') {
      orbit1.push(node);
    } else {
      orbit2.push(node);
    }
  });

  // Radii scale up in fullscreen mode so nodes have ample breathing room
  const orbits = isFullscreen
    ? [
        { items: orbit1, radius: 280, offset: 0 },
        { items: orbit2, radius: 460, offset: Math.PI / 5 },
        { items: orbit3, radius: 660, offset: Math.PI / 3 },
      ]
    : [
        { items: orbit1, radius: 210, offset: 0 },
        { items: orbit2, radius: 340, offset: Math.PI / 5 },
        { items: orbit3, radius: 460, offset: Math.PI / 3 },
      ];

  orbits.forEach((orbit) => {
    const count = orbit.items.length;
    if (count === 0) return;
    orbit.items.forEach((node, i) => {
      const angle = orbit.offset + (2 * Math.PI * i) / count;
      const x = Math.round(centerX + orbit.radius * Math.cos(angle) - 110);
      const y = Math.round(centerY + orbit.radius * Math.sin(angle) - 30);
      orbitalNodes.push({
        ...node,
        position: { x, y },
      });
    });
  });

  // Glowing curved edges for orbital mode
  const orbitalEdges = (rawEdges || []).map((e) => ({
    ...e,
    type: 'default',
    animated: true,
    style: {
      stroke: e.style?.stroke || '#06B6D4',
      strokeWidth: e.style?.strokeWidth || 1.8,
      filter: 'drop-shadow(0 0 5px currentColor)',
    },
  }));

  return { nodes: orbitalNodes, edges: orbitalEdges };
}

export function DependencyExplorer() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [audits, setAudits] = useState([]);
  const [selectedAuditId, setSelectedAuditId] = useState(searchParams.get('auditId') || '');
  const [loading, setLoading] = useState(false);
  const [rawGraphData, setRawGraphData] = useState(null);
  const [selectedNode, setSelectedNode] = useState(null);

  // Layout mode: 'orbital' or 'hierarchical'
  const [layoutMode, setLayoutMode] = useState('orbital');

  // Fullscreen and Sidebar Controls
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showLeftSidebar, setShowLeftSidebar] = useState(true);
  const [showRightSidebar, setShowRightSidebar] = useState(true);
  const [reactFlowInstance, setReactFlowInstance] = useState(null);

  // Filters
  const [typeFilter, setTypeFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');

  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const navigate = useNavigate();

  // Escape key listener to exit fullscreen
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && isFullscreen) {
        setIsFullscreen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isFullscreen]);

  // Load available audits list
  useEffect(() => {
    listAudits(1, 20).then((data) => {
      const list = data.audits || [];
      setAudits(list);
      if (!selectedAuditId && list.length > 0) {
        const defaultId = list[0]._id;
        setSelectedAuditId(defaultId);
        setSearchParams({ auditId: defaultId });
      }
    });
  }, []);

  // Fetch graph whenever selectedAuditId changes
  useEffect(() => {
    if (!selectedAuditId) return;

    setLoading(true);
    getAuditGraph(selectedAuditId)
      .then((res) => {
        setRawGraphData(res.graph);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Failed to load audit graph', err);
        setLoading(false);
      });
  }, [selectedAuditId]);

  // Recalculate layout whenever rawGraphData, layoutMode, or isFullscreen changes
  useEffect(() => {
    if (!rawGraphData?.nodes) return;

    if (layoutMode === 'orbital') {
      const { nodes: orbNodes, edges: orbEdges } = computeOrbitalLayout(
        rawGraphData.nodes,
        rawGraphData.edges,
        isFullscreen
      );
      setNodes(orbNodes);
      setEdges(orbEdges);
    } else {
      setNodes(rawGraphData.nodes || []);
      setEdges(rawGraphData.edges || []);
    }
  }, [rawGraphData, layoutMode, isFullscreen]);

  // Automatically zoom & fit view with ample padding when view mode or sidebars toggle
  useEffect(() => {
    if (reactFlowInstance) {
      const timer = setTimeout(() => {
        reactFlowInstance.fitView({ padding: 0.22, duration: 400 });
      }, 150);
      return () => clearTimeout(timer);
    }
  }, [isFullscreen, layoutMode, showLeftSidebar, showRightSidebar, reactFlowInstance]);

  // Dynamic grid span for standard layout
  const centerColSpan = useMemo(() => {
    if (showLeftSidebar && showRightSidebar) return 'lg:col-span-6';
    if (!showLeftSidebar && !showRightSidebar) return 'lg:col-span-12';
    return 'lg:col-span-9';
  }, [showLeftSidebar, showRightSidebar]);

  // Computed statistics from current graph
  const stats = useMemo(() => {
    if (!rawGraphData?.nodes) {
      return {
        total: 0,
        scripts: 0,
        styles: 0,
        apis: 0,
        thirdParty: 0,
        v6Failures: 0,
        v6Passed: 0,
        healthScore: 100,
        debtScore: 0,
        categories: {},
      };
    }

    const resNodes = rawGraphData.nodes.filter((n) => n.type !== 'rootNode');
    const total = resNodes.length;
    let v6Failures = 0;
    let v6Passed = 0;
    let scripts = 0;
    let styles = 0;
    let apis = 0;
    let thirdParty = 0;

    let scriptsPass = 0;
    let stylesPass = 0;
    let apisPass = 0;
    let thirdPartyPass = 0;

    resNodes.forEach((n) => {
      const data = n.data || {};
      const isPass = data.overallStatus === 'Passed';
      const isFail = data.isIpv6SpecificFailure;

      if (isFail) v6Failures++;
      if (isPass) v6Passed++;

      if (data.isThirdParty) {
        thirdParty++;
        if (isPass) thirdPartyPass++;
      }

      if (data.resourceType === 'script') {
        scripts++;
        if (isPass) scriptsPass++;
      } else if (data.resourceType === 'stylesheet') {
        styles++;
        if (isPass) stylesPass++;
      } else if (data.resourceType === 'xhr' || data.resourceType === 'fetch') {
        apis++;
        if (isPass) apisPass++;
      }
    });

    const healthScore = total > 0 ? Math.round((v6Passed / total) * 100) : 100;
    const debtScore = 100 - healthScore;

    return {
      total,
      scripts,
      styles,
      apis,
      thirdParty,
      v6Failures,
      v6Passed,
      healthScore,
      debtScore,
      scriptsRate: scripts > 0 ? Math.round((scriptsPass / scripts) * 100) : 100,
      stylesRate: styles > 0 ? Math.round((stylesPass / styles) * 100) : 100,
      apisRate: apis > 0 ? Math.round((apisPass / apis) * 100) : 100,
      thirdPartyRate: thirdParty > 0 ? Math.round((thirdPartyPass / thirdParty) * 100) : 100,
    };
  }, [rawGraphData]);

  // Apply filters to nodes
  const filteredNodes = useMemo(() => {
    return nodes.map((node) => {
      if (node.type === 'rootNode') return { ...node, hidden: false };

      const data = node.data;
      let matchesType = typeFilter === 'all' || data.resourceType === typeFilter;
      let matchesStatus = true;

      if (statusFilter === 'passed') {
        matchesStatus = data.overallStatus === 'Passed';
      } else if (statusFilter === 'ipv6_failure') {
        matchesStatus = data.isIpv6SpecificFailure;
      } else if (statusFilter === 'dns_failure') {
        matchesStatus = data.overallStatus === 'DNS failure';
      }

      let matchesSearch = true;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        matchesSearch =
          data.label?.toLowerCase().includes(q) ||
          data.hostname?.toLowerCase().includes(q) ||
          data.url?.toLowerCase().includes(q);
      }

      const isVisible = matchesType && matchesStatus && matchesSearch;
      return {
        ...node,
        hidden: !isVisible,
      };
    });
  }, [nodes, typeFilter, statusFilter, searchQuery]);

  const onNodeClick = useCallback((event, node) => {
    setSelectedNode(node);
  }, []);

  const handleAuditSelect = (id) => {
    setSelectedAuditId(id);
    setSearchParams({ auditId: id });
    setSelectedNode(null);
  };

  const handleLaunchQuickDemo = async () => {
    try {
      setLoading(true);
      const res = await createAudit('https://www.google.com', {
        timeoutMs: 15000,
        maxResources: 20,
      });
      if (res.audit?._id) {
        setSelectedAuditId(res.audit._id);
        setSearchParams({ auditId: res.audit._id });
        listAudits(1, 20).then((data) => setAudits(data.audits || []));
      }
    } catch (err) {
      console.error(err);
      navigate('/new-audit');
    } finally {
      setLoading(false);
    }
  };

  // Selected audit metadata
  const currentAudit = audits.find((a) => a._id === selectedAuditId);

  return (
    <div className="flex flex-col h-[calc(100vh-6.5rem)] space-y-3">
      {/* 1. Futuristic Observatory Top HUD Bar (Hidden in Fullscreen mode) */}
      {!isFullscreen && (
        <div className="p-3.5 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border border-cyan-500/30 shadow-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
              <Network className="w-5 h-5 animate-pulse" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                  OBSERVATORY v1.2
                </span>
                <h1 className="text-sm font-bold text-white font-mono tracking-tight">
                  NetScope Dependency Archi-Graph
                </h1>
              </div>
              <p className="text-[11px] text-slate-400 font-mono">
                Live Real-Time Browser Session Dependency Topology & Dual-Stack Inspection
              </p>
            </div>
          </div>

          {/* Audit Target Selector & Quick Actions */}
          <div className="flex flex-wrap items-center gap-2.5">
            <div className="flex items-center gap-2 bg-navy-950/80 px-3 py-1.5 rounded-xl border border-navy-750">
              <Globe className="w-3.5 h-3.5 text-cyan-400" />
              <select
                value={selectedAuditId}
                onChange={(e) => handleAuditSelect(e.target.value)}
                className="bg-transparent text-white font-mono text-xs focus:outline-none cursor-pointer max-w-[210px]"
              >
                {audits.length === 0 ? (
                  <option value="">No audits in database</option>
                ) : (
                  audits.map((a) => (
                    <option key={a._id} value={a._id} className="bg-navy-900 text-white">
                      {a.targetHost} ({new Date(a.createdAt).toLocaleDateString()})
                    </option>
                  ))
                )}
              </select>
            </div>

            {/* Layout Mode Switcher */}
            <div className="flex items-center bg-navy-950/80 p-0.5 rounded-xl border border-navy-750 text-xs font-mono">
              <button
                onClick={() => setLayoutMode('orbital')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  layoutMode === 'orbital'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌌 Orbital
              </button>
              <button
                onClick={() => setLayoutMode('hierarchical')}
                className={`px-3 py-1 rounded-lg transition-all ${
                  layoutMode === 'hierarchical'
                    ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-bold'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
              >
                🌳 Tree
              </button>
            </div>

            {/* Fullscreen Quick Button in Top Bar */}
            <button
              onClick={() => setIsFullscreen(true)}
              className="px-3 py-1.5 rounded-xl bg-navy-950 border border-cyan-500/40 text-cyan-300 hover:bg-cyan-950/60 font-mono text-xs font-bold transition-all flex items-center gap-1.5 shadow-[0_0_12px_rgba(6,182,212,0.2)] hover:scale-105"
              title="View in Fullscreen"
            >
              <Maximize2 className="w-3.5 h-3.5 text-cyan-400" />
              <span>Fullscreen</span>
            </button>

            <button
              onClick={() => navigate('/new-audit')}
              className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 text-navy-950 font-bold text-xs shadow-md shadow-cyan-500/20 hover:scale-102 transition-all flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 fill-navy-950" />
              <span>Audit Target</span>
            </button>
          </div>
        </div>
      )}

      {/* 2. Panoramic 3-Column Command-Center Layout */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-3 min-h-0">
        
        {/* LEFT COLUMN: System Architecture & Blast Radius (Col span 3) */}
        {showLeftSidebar && !isFullscreen && (
          <div className="hidden lg:flex lg:col-span-3 flex-col space-y-3 overflow-y-auto pr-1 animate-in fade-in duration-200">
            {/* Card A: System Component Hierarchy */}
            <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-750 backdrop-blur shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-navy-800 pb-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                <Cpu className="w-3.5 h-3.5" /> SYSTEM COMPONENT MAP
              </span>
              <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-navy-800 text-slate-300 border border-navy-700">
                {stats.total} Nodes
              </span>
            </div>

            <div className="space-y-2 text-xs font-mono">
              <button
                onClick={() => setTypeFilter('all')}
                className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                  typeFilter === 'all'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'border-navy-800 bg-navy-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Globe className="w-3.5 h-3.5 text-cyan-400" />
                  <span>Apex Target Domain</span>
                </span>
                <span className="text-[10px] text-cyan-400 font-bold">1</span>
              </button>

              <button
                onClick={() => setTypeFilter('script')}
                className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                  typeFilter === 'script'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'border-navy-800 bg-navy-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileCode className="w-3.5 h-3.5 text-amber-400" />
                  <span>Script Bundles (.js)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{stats.scripts}</span>
              </button>

              <button
                onClick={() => setTypeFilter('stylesheet')}
                className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                  typeFilter === 'stylesheet'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'border-navy-800 bg-navy-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <FileText className="w-3.5 h-3.5 text-teal-400" />
                  <span>Stylesheets (.css)</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{stats.styles}</span>
              </button>

              <button
                onClick={() => setTypeFilter('xhr')}
                className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                  typeFilter === 'xhr'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'border-navy-800 bg-navy-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <Activity className="w-3.5 h-3.5 text-cyan-400" />
                  <span>API & Data Feeds</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{stats.apis}</span>
              </button>

              <button
                onClick={() => setTypeFilter('other')}
                className={`w-full text-left p-2 rounded-xl border flex items-center justify-between transition-all ${
                  typeFilter === 'other'
                    ? 'border-cyan-500/40 bg-cyan-500/10 text-cyan-300 shadow-[0_0_10px_rgba(6,182,212,0.2)]'
                    : 'border-navy-800 bg-navy-950/60 text-slate-300 hover:border-slate-700'
                }`}
              >
                <span className="flex items-center gap-2">
                  <ExternalLink className="w-3.5 h-3.5 text-violet-400" />
                  <span>Perimeter / CDNs</span>
                </span>
                <span className="text-[10px] text-slate-400 font-bold">{stats.thirdParty}</span>
              </button>
            </div>
          </div>

          {/* Card B: Protocol Pipeline Flow */}
          <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-750 backdrop-blur shadow-xl space-y-3">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5" /> DUAL-STACK PIPELINE FLOW
            </span>

            <div className="grid grid-cols-4 gap-1.5 text-center font-mono">
              <div className="p-2 rounded-xl bg-navy-950/80 border border-navy-800">
                <span className="text-[9px] text-slate-400 block">DNS</span>
                <span className="text-xs font-bold text-cyan-400">AAAA</span>
              </div>
              <div className="p-2 rounded-xl bg-navy-950/80 border border-navy-800">
                <span className="text-[9px] text-slate-400 block">TCP</span>
                <span className="text-xs font-bold text-emerald-400">SYN</span>
              </div>
              <div className="p-2 rounded-xl bg-navy-950/80 border border-navy-800">
                <span className="text-[9px] text-slate-400 block">TLS</span>
                <span className="text-xs font-bold text-violet-400">v1.3</span>
              </div>
              <div className="p-2 rounded-xl bg-navy-950/80 border border-navy-800">
                <span className="text-[9px] text-slate-400 block">HTTP</span>
                <span className="text-xs font-bold text-teal-400">GET</span>
              </div>
            </div>
          </div>

          {/* Card C: Blast Radius & Readiness Meters */}
          <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-750 backdrop-blur shadow-xl space-y-3">
            <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-rose-400 flex items-center gap-1.5">
              <Flame className="w-3.5 h-3.5" /> BLAST RADIUS & READINESS
            </span>

            <div className="space-y-2.5 font-mono text-[11px]">
              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Script Readiness</span>
                  <span className="text-cyan-400 font-bold">{stats.scriptsRate}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-navy-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-cyan-500 to-teal-400 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(6,182,212,0.6)]"
                    style={{ width: `${stats.scriptsRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>API Services</span>
                  <span className="text-teal-400 font-bold">{stats.apisRate}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-navy-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(20,184,166,0.6)]"
                    style={{ width: `${stats.apisRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Styles & Fonts</span>
                  <span className="text-emerald-400 font-bold">{stats.stylesRate}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-navy-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-emerald-500 to-cyan-400 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
                    style={{ width: `${stats.stylesRate}%` }}
                  />
                </div>
              </div>

              <div>
                <div className="flex justify-between text-slate-300 mb-1">
                  <span>Third-Party CDNs</span>
                  <span className="text-violet-400 font-bold">{stats.thirdPartyRate}%</span>
                </div>
                <div className="w-full h-1.5 rounded-full bg-navy-950 overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-violet-500 to-rose-400 rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(139,92,246,0.6)]"
                    style={{ width: `${stats.thirdPartyRate}%` }}
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* CENTER COLUMN: Cyberpunk Interactive React Flow Canvas */}
        <div
          className={
            isFullscreen
              ? 'fixed inset-0 z-50 bg-navy-950 p-4 w-screen h-screen flex flex-col space-y-3 overflow-hidden animate-in fade-in duration-200'
              : `col-span-1 ${centerColSpan} flex flex-col space-y-2 relative min-h-[480px] transition-all duration-300`
          }
        >
          {/* Fullscreen Dedicated Top Bar */}
          {isFullscreen ? (
            <div className="p-3 rounded-2xl bg-gradient-to-r from-navy-950 via-navy-900 to-navy-950 border border-cyan-500/40 shadow-2xl flex flex-wrap items-center justify-between gap-3 shrink-0">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400 shadow-[0_0_15px_rgba(6,182,212,0.3)]">
                  <Network className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-cyan-500/20 text-cyan-300 font-bold border border-cyan-500/30">
                      FULLSCREEN OBSERVATORY
                    </span>
                    <h2 className="text-sm font-bold text-white font-mono tracking-tight">
                      {currentAudit?.targetHost || 'Target Website'}
                    </h2>
                    <span className="text-[10px] font-mono text-slate-400">
                      ({stats.total} total nodes • {stats.v6Passed} passed • {stats.v6Failures} IPv6 failures)
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-400 font-mono">
                    Expanded Dual-Stack Dependency Graph Topology & Deep Packet Inspection
                  </p>
                </div>
              </div>

              {/* Fullscreen Controls & Exit */}
              <div className="flex items-center gap-2.5">
                <div className="relative min-w-[170px]">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter nodes..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-navy-950 border border-navy-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-navy-950 border border-navy-800 text-xs font-mono text-slate-300 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="passed">🟢 Dual-Stack Pass</option>
                  <option value="ipv6_failure">🔴 IPv6 Failures</option>
                  <option value="dns_failure">⚠️ DNS Failures</option>
                </select>

                <div className="flex items-center bg-navy-950/80 p-0.5 rounded-xl border border-navy-750 text-xs font-mono">
                  <button
                    onClick={() => setLayoutMode('orbital')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      layoutMode === 'orbital'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🌌 Orbital
                  </button>
                  <button
                    onClick={() => setLayoutMode('hierarchical')}
                    className={`px-3 py-1 rounded-lg transition-all ${
                      layoutMode === 'hierarchical'
                        ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40 shadow-[0_0_10px_rgba(6,182,212,0.25)] font-bold'
                        : 'text-slate-400 hover:text-slate-200'
                    }`}
                  >
                    🌳 Tree
                  </button>
                </div>

                <button
                  onClick={() => reactFlowInstance?.fitView({ padding: 0.22, duration: 300 })}
                  className="px-3 py-1.5 rounded-xl bg-navy-900 hover:bg-navy-850 text-cyan-400 border border-cyan-500/30 text-xs font-mono flex items-center gap-1.5 cursor-pointer shadow-sm hover:scale-105 transition-all"
                  title="Center and fit all nodes"
                >
                  <Crosshair className="w-3.5 h-3.5" />
                  <span>Fit Center</span>
                </button>

                <button
                  onClick={() => setIsFullscreen(false)}
                  className="px-4 py-1.5 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/40 text-xs font-bold font-mono flex items-center gap-2 shadow-[0_0_18px_rgba(244,63,94,0.35)] hover:scale-105 transition-all cursor-pointer"
                >
                  <Minimize2 className="w-4 h-4" />
                  <span>✕ Exit Fullscreen (Esc)</span>
                </button>
              </div>
            </div>
          ) : (
            /* Standard Canvas Filter Sub-Bar */
            <div className="p-2.5 rounded-xl bg-navy-900/90 border border-navy-750 shadow-md flex flex-wrap items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 flex-1">
                {/* Sidebar Collapse/Expand Toggles */}
                <button
                  onClick={() => setShowLeftSidebar((prev) => !prev)}
                  className={`p-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                    showLeftSidebar
                      ? 'border-navy-750 bg-navy-950/80 text-slate-300 hover:text-white'
                      : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                  }`}
                  title={showLeftSidebar ? 'Collapse Component Panel' : 'Expand Component Panel'}
                >
                  {showLeftSidebar ? (
                    <PanelLeftClose className="w-3.5 h-3.5" />
                  ) : (
                    <PanelLeftOpen className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="hidden xl:inline text-[10px]">{showLeftSidebar ? 'Hide Left' : 'Show Left'}</span>
                </button>

                <button
                  onClick={() => setShowRightSidebar((prev) => !prev)}
                  className={`p-1.5 rounded-lg border text-xs font-mono transition-all flex items-center gap-1 cursor-pointer ${
                    showRightSidebar
                      ? 'border-navy-750 bg-navy-950/80 text-slate-300 hover:text-white'
                      : 'border-cyan-500/40 bg-cyan-500/15 text-cyan-300 shadow-[0_0_8px_rgba(6,182,212,0.25)]'
                  }`}
                  title={showRightSidebar ? 'Collapse Inventory Panel' : 'Expand Inventory Panel'}
                >
                  {showRightSidebar ? (
                    <PanelRightClose className="w-3.5 h-3.5" />
                  ) : (
                    <PanelRightOpen className="w-3.5 h-3.5 text-cyan-400" />
                  )}
                  <span className="hidden xl:inline text-[10px]">{showRightSidebar ? 'Hide Right' : 'Show Right'}</span>
                </button>

                <div className="relative flex-1 min-w-[130px]">
                  <Search className="absolute left-2.5 top-2 w-3.5 h-3.5 text-slate-500" />
                  <input
                    type="text"
                    placeholder="Filter by label or host..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-8 pr-2.5 py-1 rounded-lg bg-navy-950 border border-navy-800 text-xs font-mono text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="px-2.5 py-1 rounded-lg bg-navy-950 border border-navy-800 text-[11px] font-mono text-slate-300 focus:outline-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="passed">🟢 Dual-Stack Pass</option>
                  <option value="ipv6_failure">🔴 IPv6 Failures</option>
                  <option value="dns_failure">⚠️ DNS Failures</option>
                </select>
              </div>

              <div className="flex items-center gap-2">
                <div className="flex items-center gap-2 text-[10px] font-mono text-slate-400 mr-1">
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_6px_#10B981]" /> Pass
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-2 h-2 rounded-full bg-rose-500 shadow-[0_0_6px_#F43F5E]" /> Fail
                  </span>
                </div>

                {/* Prominent Fullscreen Button */}
                <button
                  onClick={() => setIsFullscreen(true)}
                  className="px-3 py-1.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-navy-950 text-xs font-mono font-bold flex items-center gap-1.5 shadow-[0_0_15px_rgba(6,182,212,0.35)] hover:scale-105 active:scale-95 transition-all cursor-pointer"
                  title="Expand Graph to Fullscreen"
                >
                  <Maximize2 className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Fullscreen</span>
                </button>
              </div>
            </div>
          )}

          {/* Graph Canvas Container */}
          <div
            className={`relative flex-1 rounded-2xl bg-navy-950 border border-navy-800 shadow-2xl overflow-hidden ${
              isFullscreen ? 'min-h-[500px]' : 'min-h-[420px]'
            }`}
            onDoubleClick={(e) => {
              if (!e.target.closest('.react-flow__node')) {
                setIsFullscreen((prev) => !prev);
              }
            }}
          >
            {/* Floating Expand Button inside Canvas (Normal Mode) */}
            {!isFullscreen && (
              <button
                onClick={() => setIsFullscreen(true)}
                className="absolute top-3 right-3 z-10 px-3.5 py-1.5 rounded-xl bg-navy-900/90 hover:bg-cyan-950/80 text-cyan-300 border border-cyan-500/40 text-xs font-mono font-semibold flex items-center gap-2 backdrop-blur-md shadow-xl hover:shadow-[0_0_20px_rgba(6,182,212,0.4)] transition-all cursor-pointer group"
                title="Click or double-click canvas to enter Fullscreen"
              >
                <Maximize2 className="w-3.5 h-3.5 group-hover:scale-110 transition-transform text-cyan-400" />
                <span>Fullscreen</span>
              </button>
            )}

            {/* SVG Background Orbital Concentric Rings in Orbital Mode */}
            {layoutMode === 'orbital' && (
              <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-25">
                <defs>
                  <radialGradient id="orbitGlow" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#06b6d4" stopOpacity="0.15" />
                    <stop offset="100%" stopColor="#06b6d4" stopOpacity="0" />
                  </radialGradient>
                </defs>
                <circle cx={isFullscreen ? 750 : 500} cy={isFullscreen ? 480 : 380} r={isFullscreen ? 680 : 500} fill="url(#orbitGlow)" />
                <circle cx={isFullscreen ? 750 : 500} cy={isFullscreen ? 480 : 380} r={isFullscreen ? 280 : 210} fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="4 6" />
                <circle cx={isFullscreen ? 750 : 500} cy={isFullscreen ? 480 : 380} r={isFullscreen ? 460 : 340} fill="none" stroke="#06b6d4" strokeWidth="1" strokeDasharray="3 8" />
                <circle cx={isFullscreen ? 750 : 500} cy={isFullscreen ? 480 : 380} r={isFullscreen ? 660 : 460} fill="none" stroke="#8b5cf6" strokeWidth="1" strokeDasharray="2 10" />
              </svg>
            )}

            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center bg-navy-950/85 backdrop-blur z-20 text-xs font-mono text-cyan-400">
                <div className="flex flex-col items-center gap-2">
                  <div className="w-8 h-8 border-2 border-cyan-400 border-t-transparent rounded-full animate-spin" />
                  <span>Computing orbital graph topology...</span>
                </div>
              </div>
            ) : !rawGraphData || rawGraphData.nodes?.length === 0 ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-6 space-y-4">
                <div className="w-14 h-14 rounded-full bg-cyan-500/10 border border-cyan-500/20 text-cyan-400 flex items-center justify-center mx-auto shadow-[0_0_20px_rgba(6,182,212,0.3)]">
                  <Layers className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-semibold text-white font-mono">
                    No Dependency Graph Recorded
                  </h4>
                  <p className="text-xs text-slate-400 max-w-sm mt-1">
                    Launch a dual-stack audit on any website to extract real browser dependencies and plot them on this graph!
                  </p>
                </div>
                <div className="flex gap-3">
                  <button
                    onClick={handleLaunchQuickDemo}
                    className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-teal-400 hover:from-cyan-400 hover:to-teal-300 text-navy-950 text-xs font-bold shadow-lg shadow-cyan-500/20 cursor-pointer flex items-center gap-2"
                  >
                    <Play className="w-3.5 h-3.5 fill-navy-950" />
                    Audit Google.com Live
                  </button>
                  <button
                    onClick={() => navigate('/new-audit')}
                    className="px-4 py-2.5 rounded-xl bg-navy-800 hover:bg-navy-750 text-slate-200 border border-navy-700 text-xs font-semibold cursor-pointer"
                  >
                    Custom URL
                  </button>
                </div>
              </div>
            ) : (
              <ReactFlow
                nodes={filteredNodes}
                edges={edges}
                nodeTypes={nodeTypes}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                onNodeClick={onNodeClick}
                onInit={setReactFlowInstance}
                fitView
                fitViewOptions={{ padding: 0.22 }}
                attributionPosition="bottom-left"
                minZoom={0.15}
                maxZoom={2.5}
              >
                <Background color="#131e35" gap={28} size={1} />
                <Controls className="!bg-navy-900 !border-navy-700 !rounded-xl overflow-hidden" />
                <MiniMap
                  nodeStrokeColor="#06B6D4"
                  nodeColor="#070b14"
                  nodeBorderRadius={4}
                  className="!bg-navy-950 !border !border-navy-800 !rounded-xl"
                />
              </ReactFlow>
            )}

            {/* Selected Resource Drawer modal/slideout */}
            <ResourceDrawer
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
            />
          </div>

          {/* Fullscreen Bottom Helper Pill */}
          {isFullscreen && (
            <div className="py-2 px-4 rounded-xl bg-navy-900/80 border border-navy-750 text-[11px] font-mono text-slate-300 flex items-center justify-between shadow-lg shrink-0">
              <span className="flex items-center gap-2 text-cyan-300">
                <Info className="w-3.5 h-3.5 text-cyan-400" />
                Click any resource node to inspect complete IPv4 vs IPv6 DNS, TCP, TLS & HTTP packet evidence
              </span>
              <span className="text-slate-400">
                Double-click empty canvas or press <kbd className="px-1.5 py-0.5 rounded bg-navy-950 border border-slate-700 text-rose-300 text-[10px] font-bold">Esc</kbd> to exit fullscreen
              </span>
            </div>
          )}
        </div>

        {/* RIGHT COLUMN: Audit Debt & Observed Dependency Inventory (Col span 3) */}
        {showRightSidebar && !isFullscreen && (
          <div className="hidden lg:flex lg:col-span-3 flex-col space-y-3 overflow-y-auto pl-1 animate-in fade-in duration-200">
            {/* Card 1: Audit Debt Score Gauge */}
            <div className="p-4 rounded-2xl bg-navy-900/90 border border-navy-750 backdrop-blur shadow-xl space-y-3">
            <div className="flex items-center justify-between border-b border-navy-800 pb-2">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-cyan-400 flex items-center gap-1.5">
                <ShieldAlert className="w-3.5 h-3.5" /> IPV6 READINESS & DEBT
              </span>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-bold ${
                stats.debtScore > 0 ? 'bg-rose-500/15 border-rose-500/30 text-rose-300' : 'bg-emerald-500/15 border-emerald-500/30 text-emerald-300'
              }`}>
                {stats.debtScore > 0 ? `${stats.debtScore}% Debt` : 'Ready'}
              </span>
            </div>

            {/* Circular Gauge Graphic */}
            <div className="flex items-center gap-4 py-2">
              <div className="relative w-20 h-20 flex items-center justify-center shrink-0">
                <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                  <path
                    className="text-navy-950"
                    strokeWidth="3.5"
                    stroke="currentColor"
                    fill="none"
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                  <path
                    className={stats.healthScore > 75 ? 'text-emerald-400' : 'text-amber-400'}
                    strokeDasharray={`${stats.healthScore}, 100`}
                    strokeWidth="3.5"
                    strokeLinecap="round"
                    stroke="currentColor"
                    fill="none"
                    style={{ filter: 'drop-shadow(0 0 4px currentColor)' }}
                    d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                  />
                </svg>
                <div className="absolute flex flex-col items-center">
                  <span className="text-base font-bold font-mono text-white">
                    {stats.healthScore}%
                  </span>
                  <span className="text-[8px] font-mono text-slate-400">HEALTH</span>
                </div>
              </div>

              <div className="space-y-1 font-mono text-[11px] flex-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Total Scanned:</span>
                  <span className="text-white font-bold">{stats.total}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Dual-Stack Pass:</span>
                  <span className="text-emerald-400 font-bold">{stats.v6Passed}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">IPv6 Failures:</span>
                  <span className="text-rose-400 font-bold">{stats.v6Failures}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Card 2: Observed Module Dependency List */}
          <div className="flex-1 p-4 rounded-2xl bg-navy-900/90 border border-navy-750 backdrop-blur shadow-xl flex flex-col space-y-3 min-h-[300px]">
            <div className="flex items-center justify-between border-b border-navy-800 pb-2 shrink-0">
              <span className="text-[10px] uppercase font-mono font-bold tracking-wider text-slate-300">
                OBSERVED DEPENDENCY LIST
              </span>
              <span className="text-[10px] font-mono text-slate-400">
                {rawGraphData?.nodes?.length ? rawGraphData.nodes.length - 1 : 0} items
              </span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-1 font-mono">
              {!rawGraphData?.nodes || rawGraphData.nodes.length <= 1 ? (
                <div className="text-center py-8 text-xs text-slate-500">
                  No dependencies observed yet.
                </div>
              ) : (
                rawGraphData.nodes
                  .filter((n) => n.type !== 'rootNode')
                  .map((node) => {
                    const data = node.data || {};
                    const isFail = data.isIpv6SpecificFailure;
                    const isPass = data.overallStatus === 'Passed';

                    return (
                      <div
                        key={node.id}
                        onClick={() => setSelectedNode(node)}
                        className={`p-2.5 rounded-xl border transition-all cursor-pointer hover:scale-[1.02] flex items-center justify-between gap-2 ${
                          isFail
                            ? 'border-rose-500/40 bg-rose-500/10 hover:border-rose-500'
                            : isPass
                            ? 'border-navy-800 bg-navy-950/70 hover:border-emerald-500/50'
                            : 'border-navy-800 bg-navy-950/70 hover:border-slate-700'
                        }`}
                      >
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-1.5 mb-0.5">
                            <span className="text-[9px] uppercase font-bold text-slate-400">
                              {data.resourceType}
                            </span>
                            {isFail ? (
                              <span className="text-[8px] font-bold px-1.5 py-0.2 rounded bg-rose-500/20 text-rose-300 border border-rose-500/30">
                                CRITICAL FAIL
                              </span>
                            ) : (
                              <span className="text-[8px] px-1.5 py-0.2 rounded bg-emerald-500/20 text-emerald-300">
                                DUAL-STACK
                              </span>
                            )}
                          </div>
                          <p className="text-xs text-white truncate font-medium">
                            {data.label}
                          </p>
                          <span className="text-[9.5px] text-slate-400 truncate block">
                            {data.hostname}
                          </span>
                        </div>

                        <ChevronRight className="w-4 h-4 text-slate-500 shrink-0" />
                      </div>
                    );
                  })
              )}
            </div>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}
