import React, { useState } from 'react';

export interface OntologyClass {
  uri: string;
  label: string;
  children?: OntologyClass[];
  instanceCount?: number;
}

interface ClassTreeNodeProps {
  node: OntologyClass;
  depth: number;
  onSelect: (uri: string) => void;
  selected: string | null;
  isDark: boolean;
}

const ClassTreeNode: React.FC<ClassTreeNodeProps> = ({ node, depth, onSelect, selected, isDark }) => {
  const [expanded, setExpanded] = useState(depth < 2);
  const hasChildren = node.children && node.children.length > 0;
  const isSelected = selected === node.uri;

  const text = isDark ? '#F1F5F9' : '#1E293B';
  const muted = isDark ? '#64748B' : '#94A3B8';
  const selBg = isDark ? '#1E3A5F' : '#EFF6FF';
  const selBorder = '#3B82F6';

  // Shorten URI
  const local = (() => {
    const uri = node.uri;
    const hash = uri.lastIndexOf('#');
    const slash = uri.lastIndexOf('/');
    const idx = Math.max(hash, slash);
    return idx >= 0 ? uri.slice(idx + 1) : uri;
  })();

  return (
    <div style={{ userSelect: 'none' }}>
      <div
        onClick={() => {
          onSelect(node.uri);
          if (hasChildren) setExpanded(!expanded);
        }}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '5px 8px',
          paddingLeft: 8 + depth * 16,
          borderRadius: 6,
          cursor: 'pointer',
          background: isSelected ? selBg : 'transparent',
          border: isSelected ? `1px solid ${selBorder}` : '1px solid transparent',
          marginBottom: 2,
          transition: 'all 0.15s',
        }}
        onMouseEnter={(e) => !isSelected && (e.currentTarget.style.background = isDark ? '#1E293B' : '#F1F5F9')}
        onMouseLeave={(e) => !isSelected && (e.currentTarget.style.background = 'transparent')}
        role="treeitem"
        aria-expanded={hasChildren ? expanded : undefined}
        aria-selected={isSelected}
      >
        {/* Expand toggle */}
        <span
          style={{
            width: 14,
            height: 14,
            flexShrink: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            fontSize: 10,
            color: muted,
            transform: hasChildren && expanded ? 'rotate(90deg)' : 'rotate(0deg)',
            transition: 'transform 0.15s',
          }}
        >
          {hasChildren ? '▶' : '•'}
        </span>

        {/* Icon */}
        <span style={{ fontSize: 13 }}>
          {hasChildren ? '🏷️' : '◇'}
        </span>

        {/* Label */}
        <span
          style={{
            fontSize: 13,
            fontFamily: '"Inter", sans-serif',
            fontWeight: isSelected ? 700 : 500,
            color: isSelected ? (isDark ? '#60A5FA' : '#2563EB') : text,
            flex: 1,
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            whiteSpace: 'nowrap',
          }}
          title={node.uri}
        >
          {node.label || local}
        </span>

        {/* Instance count badge */}
        {node.instanceCount !== undefined && (
          <span
            style={{
              fontSize: 10,
              fontWeight: 700,
              background: isDark ? '#1E3A5F' : '#DBEAFE',
              color: isDark ? '#60A5FA' : '#2563EB',
              borderRadius: 100,
              padding: '1px 6px',
              flexShrink: 0,
            }}
          >
            {node.instanceCount}
          </span>
        )}
      </div>

      {/* Children */}
      {hasChildren && expanded && (
        <div>
          {node.children!.map((child) => (
            <ClassTreeNode
              key={child.uri}
              node={child}
              depth={depth + 1}
              onSelect={onSelect}
              selected={selected}
              isDark={isDark}
            />
          ))}
        </div>
      )}
    </div>
  );
};

interface OntologyPanelProps {
  classes: OntologyClass[];
  properties: { uri: string; label: string; domain?: string; range?: string }[];
  isDark: boolean;
  onClassSelect?: (uri: string) => void;
}

export const OntologyPanel: React.FC<OntologyPanelProps> = ({
  classes,
  properties,
  isDark,
  onClassSelect,
}) => {
  const [tab, setTab] = useState<'classes' | 'properties'>('classes');
  const [selected, setSelected] = useState<string | null>(null);
  const [search, setSearch] = useState('');

  const text = isDark ? '#F1F5F9' : '#1E293B';
  const muted = isDark ? '#64748B' : '#94A3B8';
  const border = isDark ? '#334155' : '#E2E8F0';
  const bg2 = isDark ? '#1E293B' : '#F8FAFC';

  const handleSelect = (uri: string) => {
    setSelected(uri);
    onClassSelect?.(uri);
  };

  const filteredProperties = search
    ? properties.filter((p) =>
        p.label.toLowerCase().includes(search.toLowerCase()) ||
        p.uri.toLowerCase().includes(search.toLowerCase())
      )
    : properties;

  const local = (uri: string) => {
    const hash = uri.lastIndexOf('#');
    const slash = uri.lastIndexOf('/');
    const idx = Math.max(hash, slash);
    return idx >= 0 ? uri.slice(idx + 1) : uri;
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: '"Inter", sans-serif' }}>
      {/* Tabs */}
      <div style={{ display: 'flex', borderBottom: `1px solid ${border}` }}>
        {(['classes', 'properties'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              flex: 1,
              padding: '10px 8px',
              background: 'none',
              border: 'none',
              borderBottom: tab === t ? '2px solid #3B82F6' : '2px solid transparent',
              color: tab === t ? '#3B82F6' : muted,
              fontSize: 12,
              fontWeight: tab === t ? 700 : 500,
              cursor: 'pointer',
              fontFamily: '"Inter", sans-serif',
              textTransform: 'capitalize',
              transition: 'all 0.15s',
            }}
          >
            {t === 'classes' ? `🏷️ Classes (${classes.length})` : `↔️ Properties (${properties.length})`}
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ padding: '10px 12px', borderBottom: `1px solid ${border}` }}>
        <input
          type="text"
          placeholder={`Search ${tab}...`}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label={`Search ${tab}`}
          style={{
            width: '100%',
            background: bg2,
            border: `1px solid ${border}`,
            borderRadius: 8,
            padding: '6px 10px',
            fontSize: 12,
            color: text,
            outline: 'none',
            fontFamily: '"Inter", sans-serif',
            boxSizing: 'border-box',
          }}
        />
      </div>

      {/* Content */}
      <div style={{ flex: 1, overflowY: 'auto', padding: 10 }} role="tree">
        {tab === 'classes' ? (
          classes.length === 0 ? (
            <div style={{ textAlign: 'center', color: muted, fontSize: 13, marginTop: 40 }}>
              No classes found
            </div>
          ) : (
            classes.map((cls) => (
              <ClassTreeNode
                key={cls.uri}
                node={cls}
                depth={0}
                onSelect={handleSelect}
                selected={selected}
                isDark={isDark}
              />
            ))
          )
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {filteredProperties.map((p) => (
              <div
                key={p.uri}
                style={{
                  background: bg2,
                  border: `1px solid ${border}`,
                  borderRadius: 8,
                  padding: '8px 10px',
                }}
              >
                <div style={{ fontSize: 12, fontWeight: 700, color: text }}>{p.label || local(p.uri)}</div>
                {(p.domain || p.range) && (
                  <div style={{ fontSize: 10, color: muted, marginTop: 3, display: 'flex', gap: 8 }}>
                    {p.domain && <span>domain: <span style={{ color: '#F59E0B' }}>{local(p.domain)}</span></span>}
                    {p.range && <span>range: <span style={{ color: '#10B981' }}>{local(p.range)}</span></span>}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
