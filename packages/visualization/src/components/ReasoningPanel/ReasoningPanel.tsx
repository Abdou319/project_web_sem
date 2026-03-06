import React, { useState } from 'react';
import { Triple } from '../GraphView/GraphView';

export type ReasoningMode = 'RDFS' | 'OWL_HORST' | 'OWL_MICRO' | 'OWL_MINI';

interface ReasoningPanelProps {
  enabled: boolean;
  onToggle: (enabled: boolean) => void;
  mode: ReasoningMode;
  onModeChange: (mode: ReasoningMode) => void;
  inferredTriples: Triple[];
  isDark: boolean;
}

const MODES: { id: ReasoningMode; label: string; desc: string }[] = [
  { id: 'RDFS', label: 'RDFS', desc: 'Class hierarchy & property inference' },
  { id: 'OWL_HORST', label: 'OWL Horst', desc: 'pD* semantics, scalable OWL reasoning' },
  { id: 'OWL_MICRO', label: 'OWL Micro', desc: 'Lightweight OWL reasoning' },
  { id: 'OWL_MINI', label: 'OWL Mini', desc: 'Minimal OWL subset' },
];

export const ReasoningPanel: React.FC<ReasoningPanelProps> = ({
  enabled,
  onToggle,
  mode,
  onModeChange,
  inferredTriples,
  isDark,
}) => {
  const [search, setSearch] = useState('');

  const text = isDark ? '#F1F5F9' : '#1E293B';
  const muted = isDark ? '#64748B' : '#94A3B8';
  const border = isDark ? '#334155' : '#E2E8F0';
  const bg2 = isDark ? '#1E293B' : '#F8FAFC';
  const green = isDark ? '#10B981' : '#059669';

  const local = (uri: string) => {
    const hash = uri.lastIndexOf('#');
    const slash = uri.lastIndexOf('/');
    const idx = Math.max(hash, slash);
    return idx >= 0 ? uri.slice(idx + 1) : uri;
  };

  const filtered = search
    ? inferredTriples.filter(
        (t) =>
          t.subject.toLowerCase().includes(search.toLowerCase()) ||
          t.predicate.toLowerCase().includes(search.toLowerCase()) ||
          t.object.toLowerCase().includes(search.toLowerCase())
      )
    : inferredTriples;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: '"Inter", sans-serif', overflowY: 'auto' }}>
      {/* Toggle */}
      <div style={{ padding: 16, borderBottom: `1px solid ${border}` }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
          <div>
            <div style={{ fontSize: 14, fontWeight: 700, color: text }}>Reasoning Engine</div>
            <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>
              {enabled ? `Active · ${inferredTriples.length} inferred triples` : 'Inactive'}
            </div>
          </div>
          {/* Toggle switch */}
          <div
            onClick={() => onToggle(!enabled)}
            role="switch"
            aria-checked={enabled}
            aria-label="Toggle reasoning"
            tabIndex={0}
            onKeyDown={(e) => e.key === 'Enter' && onToggle(!enabled)}
            style={{
              width: 52,
              height: 28,
              borderRadius: 100,
              background: enabled ? green : (isDark ? '#334155' : '#CBD5E1'),
              position: 'relative',
              cursor: 'pointer',
              transition: 'background 0.25s',
              flexShrink: 0,
            }}
          >
            <div
              style={{
                position: 'absolute',
                top: 3,
                left: enabled ? 27 : 3,
                width: 22,
                height: 22,
                borderRadius: '50%',
                background: '#FFFFFF',
                boxShadow: '0 2px 6px rgba(0,0,0,0.3)',
                transition: 'left 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)',
              }}
            />
          </div>
        </div>

        {/* Mode selector */}
        <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 8 }}>
          Reasoning Mode
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
          {MODES.map((m) => (
            <div
              key={m.id}
              onClick={() => enabled && onModeChange(m.id)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 10,
                padding: '8px 10px',
                borderRadius: 8,
                border: `1px solid ${mode === m.id ? green : border}`,
                background: mode === m.id ? (isDark ? 'rgba(16,185,129,0.1)' : '#F0FDF4') : bg2,
                cursor: enabled ? 'pointer' : 'not-allowed',
                opacity: enabled ? 1 : 0.5,
                transition: 'all 0.15s',
              }}
              role="radio"
              aria-checked={mode === m.id}
              tabIndex={enabled ? 0 : -1}
            >
              <div
                style={{
                  width: 14,
                  height: 14,
                  borderRadius: '50%',
                  border: `2px solid ${mode === m.id ? green : border}`,
                  background: mode === m.id ? green : 'transparent',
                  flexShrink: 0,
                  transition: 'all 0.15s',
                }}
              />
              <div>
                <div style={{ fontSize: 12, fontWeight: 700, color: mode === m.id ? green : text }}>
                  {m.label}
                </div>
                <div style={{ fontSize: 10, color: muted }}>{m.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Inferred triples */}
      {enabled && inferredTriples.length > 0 && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: 12 }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
            <div style={{ fontSize: 11, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Inferred Triples
            </div>
            <span style={{ fontSize: 11, fontWeight: 700, color: green }}>+{inferredTriples.length}</span>
          </div>

          <input
            type="text"
            placeholder="Search inferred triples..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            aria-label="Search inferred triples"
            style={{
              background: bg2,
              border: `1px solid ${border}`,
              borderRadius: 8,
              padding: '6px 10px',
              fontSize: 12,
              color: text,
              outline: 'none',
              fontFamily: '"Inter", sans-serif',
              marginBottom: 8,
              boxSizing: 'border-box',
              width: '100%',
            }}
          />

          <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {filtered.map((t, i) => (
              <div
                key={i}
                style={{
                  background: bg2,
                  border: `1px solid ${isDark ? '#14532D' : '#BBF7D0'}`,
                  borderLeft: `3px solid ${green}`,
                  borderRadius: 6,
                  padding: '6px 8px',
                  fontSize: 11,
                  fontFamily: '"JetBrains Mono", monospace',
                }}
              >
                <div style={{ color: isDark ? '#60A5FA' : '#2563EB', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.subject}>
                  {local(t.subject)}
                </div>
                <div style={{ color: isDark ? '#F59E0B' : '#D97706', paddingLeft: 8, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.predicate}>
                  ↳ {local(t.predicate)}
                </div>
                <div style={{ color: isDark ? '#34D399' : '#059669', paddingLeft: 16, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }} title={t.object}>
                  → {local(t.object)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {enabled && inferredTriples.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 8, color: muted, fontSize: 13, padding: 20, textAlign: 'center' }}>
          <span style={{ fontSize: 32 }}>🧠</span>
          <span>Reasoning is active but no new triples were inferred.</span>
        </div>
      )}
    </div>
  );
};
