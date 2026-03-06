import React from 'react';
import { LayoutType } from './GraphView';

interface GraphControlsProps {
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onFit: () => void;
  onCenter: () => void;
  zoom: number;
  isDark: boolean;
}

const LAYOUTS: { id: LayoutType; icon: string; label: string }[] = [
  { id: 'force', icon: '⚡', label: 'Force' },
  { id: 'hierarchical', icon: '🌳', label: 'Tree' },
  { id: 'grid', icon: '⊞', label: 'Grid' },
  { id: 'circle', icon: '⊙', label: 'Circle' },
];

export const GraphControls: React.FC<GraphControlsProps> = ({
  layout,
  onLayoutChange,
  onZoomIn,
  onZoomOut,
  onFit,
  onCenter,
  zoom,
  isDark,
}) => {
  const panel = {
    background: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.92)',
    border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
    borderRadius: 12,
    backdropFilter: 'blur(12px)',
    boxShadow: '0 8px 32px rgba(0,0,0,0.18)',
    padding: '8px',
    display: 'flex',
    flexDirection: 'column' as const,
    gap: 4,
  };

  const btn = (active = false): React.CSSProperties => ({
    background: active
      ? isDark ? '#3B82F6' : '#2563EB'
      : isDark ? '#1E293B' : '#F1F5F9',
    color: active ? '#FFFFFF' : isDark ? '#94A3B8' : '#475569',
    border: active
      ? '1px solid #3B82F6'
      : `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
    borderRadius: 8,
    padding: '6px 10px',
    cursor: 'pointer',
    fontSize: 12,
    fontFamily: '"Inter", sans-serif',
    fontWeight: active ? 700 : 500,
    transition: 'all 0.15s ease',
    display: 'flex',
    alignItems: 'center',
    gap: 4,
    whiteSpace: 'nowrap' as const,
  });

  return (
    <div style={{ position: 'absolute', top: 12, right: 12, zIndex: 20, display: 'flex', flexDirection: 'column', gap: 8 }}>
      {/* Layout panel */}
      <div style={panel}>
        <div style={{ fontSize: 9, fontFamily: '"Inter", sans-serif', fontWeight: 700, color: isDark ? '#475569' : '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, padding: '2px 4px' }}>
          Layout
        </div>
        {LAYOUTS.map((l) => (
          <button
            key={l.id}
            style={btn(layout === l.id)}
            onClick={() => onLayoutChange(l.id)}
            title={`Switch to ${l.label} layout`}
          >
            <span>{l.icon}</span>
            <span>{l.label}</span>
          </button>
        ))}
      </div>

      {/* Zoom panel */}
      <div style={panel}>
        <div style={{ fontSize: 9, fontFamily: '"Inter", sans-serif', fontWeight: 700, color: isDark ? '#475569' : '#94A3B8', textTransform: 'uppercase', letterSpacing: 1, padding: '2px 4px' }}>
          View
        </div>
        <button style={btn()} onClick={onZoomIn} title="Zoom in">🔍+</button>
        <div style={{ textAlign: 'center', fontSize: 11, color: isDark ? '#64748B' : '#94A3B8', fontFamily: '"Inter", sans-serif', fontVariantNumeric: 'tabular-nums' }}>
          {zoom}%
        </div>
        <button style={btn()} onClick={onZoomOut} title="Zoom out">🔍-</button>
        <button style={btn()} onClick={onFit} title="Fit all nodes">⤢ Fit</button>
        <button style={btn()} onClick={onCenter} title="Center graph">⊕ Center</button>
      </div>
    </div>
  );
};