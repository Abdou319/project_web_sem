import React, { useState } from 'react';

export interface RDFStats {
  totalTriples: number;
  subjects: number;
  predicates: number;
  objects: number;
  classes: number;
  literals: number;
}

interface RDFPanelProps {
  stats: RDFStats;
  onImport: (file: File) => Promise<void>;
  onExport: (format: 'turtle' | 'json-ld' | 'n-triples') => void;
  isDark: boolean;
}

export const RDFPanel: React.FC<RDFPanelProps> = ({ stats, onImport, onExport, isDark }) => {
  const [importing, setImporting] = useState(false);
  const [importError, setImportError] = useState<string | null>(null);
  const [dragOver, setDragOver] = useState(false);

  const text = isDark ? '#F1F5F9' : '#1E293B';
  const muted = isDark ? '#64748B' : '#94A3B8';
  const border = isDark ? '#334155' : '#E2E8F0';
  const bg2 = isDark ? '#1E293B' : '#F8FAFC';

  const handleFile = async (file: File) => {
    const allowed = ['.ttl', '.rdf', '.owl', '.n3', '.nt', '.jsonld', '.json'];
    const ext = '.' + file.name.split('.').pop()?.toLowerCase();
    if (!allowed.includes(ext)) {
      setImportError(`Unsupported format: ${ext}. Supported: ${allowed.join(', ')}`);
      return;
    }
    setImporting(true);
    setImportError(null);
    try {
      await onImport(file);
    } catch (e: unknown) {
      const err = e as Error | undefined;
      setImportError(err?.message || 'Import failed');
    } finally {
      setImporting(false);
    }
  };

  const STAT_ITEMS = [
    { label: 'Total Triples', value: stats.totalTriples, color: '#3B82F6', icon: '🔗' },
    { label: 'Subjects', value: stats.subjects, color: '#8B5CF6', icon: '📌' },
    { label: 'Predicates', value: stats.predicates, color: '#F59E0B', icon: '➡️' },
    { label: 'Objects', value: stats.objects, color: '#10B981', icon: '🎯' },
    { label: 'Classes', value: stats.classes, color: '#EF4444', icon: '🏷️' },
    { label: 'Literals', value: stats.literals, color: '#06B6D4', icon: '📝' },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: '"Inter", sans-serif', padding: 16, gap: 20, overflowY: 'auto' }}>
      {/* Import area */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Import RDF
        </div>
        <label
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            const file = e.dataTransfer.files[0];
            if (file) handleFile(file);
          }}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 8,
            border: `2px dashed ${dragOver ? '#3B82F6' : border}`,
            borderRadius: 12,
            padding: '24px 16px',
            cursor: 'pointer',
            background: dragOver ? (isDark ? '#1E3A5F' : '#EFF6FF') : bg2,
            transition: 'all 0.2s',
          }}
        >
          <input
            type="file"
            accept=".ttl,.rdf,.owl,.n3,.nt,.jsonld,.json"
            style={{ display: 'none' }}
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) handleFile(file);
            }}
            aria-label="Import RDF file"
          />
          <div style={{ fontSize: 28 }}>{importing ? '⏳' : '📂'}</div>
          <div style={{ fontSize: 13, fontWeight: 600, color: text }}>
            {importing ? 'Importing...' : 'Drop RDF file here'}
          </div>
          <div style={{ fontSize: 11, color: muted, textAlign: 'center' }}>
            or click to browse — .ttl .rdf .owl .n3 .nt .jsonld
          </div>
        </label>
        {importError && (
          <div style={{ marginTop: 8, fontSize: 12, color: '#EF4444', background: isDark ? '#450A0A' : '#FEF2F2', padding: '6px 10px', borderRadius: 6 }}>
            ❌ {importError}
          </div>
        )}
      </div>

      {/* Stats */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Graph Statistics
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
          {STAT_ITEMS.map(({ label, value, color, icon }) => (
            <div
              key={label}
              style={{
                background: bg2,
                border: `1px solid ${border}`,
                borderRadius: 10,
                padding: '10px 12px',
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
              }}
            >
              <div style={{ fontSize: 18, fontWeight: 800, color, fontVariantNumeric: 'tabular-nums', lineHeight: 1 }}>
                {value.toLocaleString()}
              </div>
              <div style={{ fontSize: 10, color: muted, fontWeight: 500, display: 'flex', alignItems: 'center', gap: 4 }}>
                <span>{icon}</span>{label}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Export */}
      <div>
        <div style={{ fontSize: 12, fontWeight: 700, color: muted, textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 10 }}>
          Export
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
          {(['turtle', 'json-ld', 'n-triples'] as const).map((fmt) => (
            <button
              key={fmt}
              onClick={() => onExport(fmt)}
              aria-label={`Export as ${fmt}`}
              style={{
                background: bg2,
                border: `1px solid ${border}`,
                color: text,
                borderRadius: 8,
                padding: '8px 12px',
                cursor: 'pointer',
                textAlign: 'left',
                fontSize: 12,
                fontFamily: '"Inter", sans-serif',
                fontWeight: 500,
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                transition: 'all 0.15s',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.borderColor = '#3B82F6')}
              onMouseLeave={(e) => (e.currentTarget.style.borderColor = border)}
            >
              <span style={{ fontSize: 14 }}>
                {fmt === 'turtle' ? '🐢' : fmt === 'json-ld' ? '📄' : '📋'}
              </span>
              {fmt === 'turtle' ? 'Turtle (.ttl)' : fmt === 'json-ld' ? 'JSON-LD (.jsonld)' : 'N-Triples (.nt)'}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};
