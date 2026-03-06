import React, { useState, useEffect, useCallback } from 'react';
import { ThemeProvider, useTheme } from '@kg/visualization';
import { GraphView } from '@kg/visualization';
import type { Triple, LayoutType } from '@kg/visualization';
import { RDFPanel } from '@kg/visualization';
import type { RDFStats } from '@kg/visualization';
import { OntologyPanel } from '@kg/visualization';
import type { OntologyClass } from '@kg/visualization';
import { SPARQLPanel } from '@kg/visualization';
import type { QueryResult } from '@kg/visualization';
import { ReasoningPanel } from '@kg/visualization';
import { ReasoningMode } from '@kg/visualization';

type SidebarTab = 'rdf' | 'ontology' | 'sparql' | 'reasoning';

const TABS: { id: SidebarTab; icon: string; label: string }[] = [
  { id: 'rdf', icon: '📁', label: 'RDF' },
  { id: 'ontology', icon: '📊', label: 'Ontology' },
  { id: 'sparql', icon: '🔍', label: 'SPARQL' },
  { id: 'reasoning', icon: '🧠', label: 'Reasoning' },
];

// ─── Stub data for demo mode ──────────────────────────────────────────────

const DEMO_TRIPLES: Triple[] = [
  { subject: 'http://example.org#Alice', predicate: 'http://xmlns.com/foaf/0.1/knows', object: 'http://example.org#Bob' },
  { subject: 'http://example.org#Alice', predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', object: 'http://xmlns.com/foaf/0.1/Person' },
  { subject: 'http://example.org#Bob', predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', object: 'http://xmlns.com/foaf/0.1/Person' },
  { subject: 'http://example.org#Bob', predicate: 'http://xmlns.com/foaf/0.1/name', object: 'Bob Smith' },
  { subject: 'http://example.org#Alice', predicate: 'http://xmlns.com/foaf/0.1/name', object: 'Alice Jones' },
  { subject: 'http://example.org#Pizza', predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type', object: 'http://example.org#Food' },
  { subject: 'http://example.org#Margherita', predicate: 'http://www.w3.org/2000/01/rdf-schema#subClassOf', object: 'http://example.org#Pizza' },
  { subject: 'http://example.org#Quattro', predicate: 'http://www.w3.org/2000/01/rdf-schema#subClassOf', object: 'http://example.org#Pizza' },
];

function AppContent() {
  const { isDark, toggleTheme } = useTheme();
  const [activeTab, setActiveTab] = useState<SidebarTab>('rdf');
  const [triples, setTriples] = useState<Triple[]>(DEMO_TRIPLES);
  const [layout, setLayout] = useState<LayoutType>('force');
  const [reasoningEnabled, setReasoningEnabled] = useState(false);
  const [reasoningMode, setReasoningMode] = useState<ReasoningMode>('RDFS');
  const [inferredTriples, setInferredTriples] = useState<Triple[]>([]);
  const [fileName, setFileName] = useState<string>('demo.ttl');

  const stats: RDFStats = {
    totalTriples: triples.length,
    subjects: new Set(triples.map((t) => t.subject)).size,
    predicates: new Set(triples.map((t) => t.predicate)).size,
    objects: new Set(triples.map((t) => t.object)).size,
    classes: triples.filter((t) => t.predicate.endsWith('#type')).length,
    literals: triples.filter((t) => !t.object.startsWith('http')).length,
  };

  const demoClasses: OntologyClass[] = [
    {
      uri: 'http://www.w3.org/2002/07/owl#Thing',
      label: 'Thing',
      instanceCount: triples.length,
      children: [
        { uri: 'http://xmlns.com/foaf/0.1/Person', label: 'Person', instanceCount: 2 },
        {
          uri: 'http://example.org#Food',
          label: 'Food',
          instanceCount: 1,
          children: [{ uri: 'http://example.org#Pizza', label: 'Pizza', instanceCount: 2 }],
        },
      ],
    },
  ];

  // Register Electron menu events
  useEffect(() => {
    if (!window.electronAPI) return;
    const cleanTheme = window.electronAPI.onMenuToggleTheme(toggleTheme);
    const cleanLayout = window.electronAPI.onMenuLayout((l) => setLayout(l as LayoutType));
    const cleanOpen = window.electronAPI.onMenuOpenFile(handleOpenFile);
    return () => { cleanTheme(); cleanLayout(); cleanOpen(); };
  }, [toggleTheme]);

  const handleOpenFile = useCallback(async () => {
    if (!window.electronAPI) return;
    const result = await window.electronAPI.openFile();
    if (!result) return;
    setFileName(result.fileName);
    // In real app: parse result.content with RDFManager
    console.log('File loaded:', result.filePath);
  }, []);

  const handleImport = useCallback(async (file: File) => {
    setFileName(file.name);
    // Real impl: const manager = new RDFManager(); await manager.loadFromFile(file.path);
    // setTriples(manager.getTriples());
    console.log('Importing:', file.name);
  }, []);

  const handleExport = useCallback((format: string) => {
    console.log('Exporting as:', format);
    // Real impl: const content = RDFManager.exportAs(format, triples); download(content);
  }, [triples]);

  const handleQuery = useCallback(async (_query: string): Promise<QueryResult> => {
    // Real impl: return await QueryManager.execute(query, triples);
    // Demo stub:
    await new Promise((r) => setTimeout(r, 300));
    return {
      variables: ['subject', 'predicate', 'object'],
      rows: triples.slice(0, 10).map((t) => ({
        subject: t.subject,
        predicate: t.predicate,
        object: t.object,
      })),
    };
  }, [triples]);

  const handleReasoningToggle = (enabled: boolean) => {
    setReasoningEnabled(enabled);
    if (enabled) {
      // Demo: stub inferred triples
      const inferred: Triple[] = [
        {
          subject: 'http://example.org#Margherita',
          predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
          object: 'http://example.org#Food',
          inferred: true,
        },
        {
          subject: 'http://example.org#Quattro',
          predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
          object: 'http://example.org#Food',
          inferred: true,
        },
      ];
      setInferredTriples(inferred);
      setTriples((prev) => [...prev.filter((t) => !t.inferred), ...inferred]);
    } else {
      setInferredTriples([]);
      setTriples((prev) => prev.filter((t) => !t.inferred));
    }
  };

  const bg = isDark ? '#0F172A' : '#F8FAFC';
  const sidebar = isDark ? '#0F172A' : '#FFFFFF';
  const border = isDark ? '#1E293B' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#1E293B';
  const muted = isDark ? '#475569' : '#94A3B8';
  const panel = isDark ? '#1E293B' : '#FFFFFF';

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'column' as const,
        height: '100vh',
        background: bg,
        color: text,
        fontFamily: '"Inter", -apple-system, sans-serif',
        overflow: 'hidden',
      }}
    >
      {/* ── Title bar / header ── */}
      <div
        style={{
          height: 48,
          background: isDark ? '#0D1117' : '#FFFFFF',
          borderBottom: `1px solid ${border}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 16px',
          flexShrink: 0,
          WebkitAppRegion: 'drag',
        } as React.CSSProperties}
      >  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontSize: 18 }}>🕸️</span>
          <span style={{ fontSize: 14, fontWeight: 700, color: text }}>Knowledge Graph Desktop</span>
          {fileName && (
            <span style={{ fontSize: 12, color: muted, background: isDark ? '#1E293B' : '#F1F5F9', padding: '2px 8px', borderRadius: 4 }}>
              {fileName}
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: 8, WebkitAppRegion: 'no-drag' } as React.CSSProperties}>
          {/* Theme toggle */}
          <button
            onClick={toggleTheme}
            aria-label={`Switch to ${isDark ? 'light' : 'dark'} theme`}
            style={{
              background: isDark ? '#1E293B' : '#F1F5F9',
              border: `1px solid ${border}`,
              borderRadius: 8,
              padding: '5px 12px',
              cursor: 'pointer',
              fontSize: 13,
              color: text,
              display: 'flex',
              alignItems: 'center',
              gap: 5,
              transition: 'all 0.15s',
            }}
          >
            {isDark ? '☀️ Light' : '🌙 Dark'}
          </button>

          {/* Open file */}
          <button
            onClick={handleOpenFile}
            aria-label="Open RDF file"
            style={{
              background: '#2563EB',
              border: 'none',
              borderRadius: 8,
              padding: '5px 14px',
              cursor: 'pointer',
              fontSize: 13,
              color: '#FFFFFF',
              fontWeight: 600,
              fontFamily: '"Inter", sans-serif',
              display: 'flex',
              alignItems: 'center',
              gap: 5,
            }}
          >
            📂 Open RDF
          </button>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* ── Sidebar icon tabs ── */}
        <div
          style={{
            width: 56,
            background: sidebar,
            borderRight: `1px solid ${border}`,
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            padding: '12px 0',
            gap: 4,
            flexShrink: 0,
          }}
        >
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              aria-label={tab.label}
              title={tab.label}
              style={{
                width: 40,
                height: 40,
                borderRadius: 10,
                background: activeTab === tab.id ? (isDark ? '#1E3A5F' : '#EFF6FF') : 'transparent',
                border: activeTab === tab.id ? '1px solid #3B82F6' : '1px solid transparent',
                cursor: 'pointer',
                fontSize: 18,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'all 0.15s',
                position: 'relative',
              }}
              onMouseEnter={(e) => activeTab !== tab.id && (e.currentTarget.style.background = isDark ? '#1E293B' : '#F1F5F9')}
              onMouseLeave={(e) => activeTab !== tab.id && (e.currentTarget.style.background = 'transparent')}
            >
              {tab.icon}
              {/* Indicator dot */}
              {activeTab === tab.id && (
                <div style={{
                  position: 'absolute',
                  right: -8,
                  top: '50%',
                  transform: 'translateY(-50%)',
                  width: 3,
                  height: 20,
                  background: '#3B82F6',
                  borderRadius: 100,
                }} />
              )}
            </button>
          ))}
        </div>

        {/* ── Side panel ── */}
        <div
          style={{
            width: 280,
            background: panel,
            borderRight: `1px solid ${border}`,
            flexShrink: 0,
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Panel header */}
          <div style={{
            padding: '12px 16px',
            borderBottom: `1px solid ${border}`,
            fontSize: 13,
            fontWeight: 700,
            color: text,
            display: 'flex',
            alignItems: 'center',
            gap: 8,
          }}>
            {TABS.find((t) => t.id === activeTab)?.icon}{' '}
            {TABS.find((t) => t.id === activeTab)?.label}
          </div>

          {/* Panel content */}
          <div style={{ flex: 1, overflow: 'hidden' }}>
            {activeTab === 'rdf' && (
              <RDFPanel stats={stats} onImport={handleImport} onExport={handleExport} isDark={isDark} />
            )}
            {activeTab === 'ontology' && (
              <OntologyPanel classes={demoClasses} properties={[]} isDark={isDark} />
            )}
            {activeTab === 'sparql' && (
              <SPARQLPanel onExecute={handleQuery} isDark={isDark} />
            )}
            {activeTab === 'reasoning' && (
              <ReasoningPanel
                enabled={reasoningEnabled}
                onToggle={handleReasoningToggle}
                mode={reasoningMode}
                onModeChange={setReasoningMode}
                inferredTriples={inferredTriples}
                isDark={isDark}
              />
            )}
          </div>
        </div>

        {/* ── Graph canvas ── */}
        <div style={{ flex: 1, position: 'relative', overflow: 'hidden' }}>
          <GraphView
            triples={triples}
            layout={layout}
            onLayoutChange={setLayout}
            isDark={isDark}
            inferredCount={inferredTriples.length}
          />
        </div>
      </div>

      {/* ── Global styles ── */}
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap');
        * { box-sizing: border-box; margin: 0; padding: 0; }
        ::-webkit-scrollbar { width: 6px; height: 6px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: ${isDark ? '#334155' : '#CBD5E1'}; border-radius: 100px; }
        ::-webkit-scrollbar-thumb:hover { background: ${isDark ? '#475569' : '#94A3B8'}; }
        body { overflow: hidden; }
      `}</style>
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light">
      <AppContent />
    </ThemeProvider>
  );
}