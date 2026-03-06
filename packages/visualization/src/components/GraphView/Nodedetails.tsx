import React from 'react';
import { NodeData } from './GraphView';

interface NodeDetailsProps {
  node: NodeData;
  isDark: boolean;
  onClose: () => void;
}

export const NodeDetails: React.FC<NodeDetailsProps> = ({ node, isDark, onClose }) => {
  const bg = isDark ? '#0F172A' : '#FFFFFF';
  const border = isDark ? '#334155' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#1E293B';
  const muted = isDark ? '#64748B' : '#94A3B8';
  const badge: Record<string, string> = {
    resource: '#3B82F6',
    literal: '#10B981',
    class: '#F59E0B',
  };

  // Shorten URI
  const localName = (uri: string) => {
    const hash = uri.lastIndexOf('#');
    const slash = uri.lastIndexOf('/');
    const idx = Math.max(hash, slash);
    return idx >= 0 ? uri.slice(idx + 1) : uri;
  };

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 60,
        left: 12,
        width: 280,
        background: bg,
        border: `1px solid ${border}`,
        borderRadius: 16,
        padding: 16,
        boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
        fontFamily: '"Inter", sans-serif',
        zIndex: 30,
        animation: 'slideUp 0.2s ease',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 12 }}>
        <div>
          <div
            style={{
              display: 'inline-block',
              background: badge[node.type] || '#3B82F6',
              color: '#fff',
              fontSize: 10,
              fontWeight: 700,
              padding: '2px 8px',
              borderRadius: 100,
              textTransform: 'uppercase',
              letterSpacing: 0.5,
              marginBottom: 6,
            }}
          >
            {node.type}
          </div>
          <div style={{ fontSize: 16, fontWeight: 700, color: text, wordBreak: 'break-word' }}>
            {node.label}
          </div>
        </div>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: muted,
            fontSize: 18,
            padding: 0,
            lineHeight: 1,
          }}
          aria-label="Close node details"
        >
          ×
        </button>
      </div>

      {/* URI */}
      <div style={{ marginBottom: 12 }}>
        <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4 }}>
          URI
        </div>
        <div
          style={{
            fontSize: 11,
            color: isDark ? '#60A5FA' : '#2563EB',
            wordBreak: 'break-all',
            background: isDark ? '#1E293B' : '#F8FAFC',
            padding: '6px 8px',
            borderRadius: 8,
            fontFamily: '"JetBrains Mono", "Fira Code", monospace',
          }}
          title={node.uri}
        >
          {node.uri.length > 50 ? `...${node.uri.slice(-40)}` : node.uri}
        </div>
      </div>

      {/* Properties */}
      {node.properties && Object.keys(node.properties).length > 0 && (
        <div>
          <div style={{ fontSize: 10, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 6 }}>
            Properties
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {Object.entries(node.properties).map(([key, val]) => (
              <div
                key={key}
                style={{
                  display: 'flex',
                  gap: 6,
                  alignItems: 'flex-start',
                  fontSize: 11,
                  background: isDark ? '#1E293B' : '#F8FAFC',
                  borderRadius: 6,
                  padding: '4px 8px',
                }}
              >
                <span style={{ color: isDark ? '#F59E0B' : '#D97706', fontWeight: 600, minWidth: 60, flexShrink: 0 }}>
                  {localName(key)}
                </span>
                <span style={{ color: text, wordBreak: 'break-word' }}>{val}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};