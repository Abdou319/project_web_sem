import { useRef, useState } from 'react';

export interface QueryResult {
  variables: string[];
  rows: Record<string, string>[];
}

interface SPARQLPanelProps {
  onExecute: (query: string) => Promise<QueryResult>;
  isDark: boolean;
}

const DEFAULT_QUERY = `PREFIX rdf: <http://www.w3.org/1999/02/22-rdf-syntax-ns#>
PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
PREFIX owl: <http://www.w3.org/2002/07/owl#>

SELECT ?subject ?predicate ?object
WHERE {
  ?subject ?predicate ?object .
}
LIMIT 25`;

export const SPARQLPanel: React.FC<SPARQLPanelProps> = ({ onExecute, isDark }) => {
  const [query, setQuery] = useState(DEFAULT_QUERY);
  const [results, setResults] = useState<QueryResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [executionTime, setExecutionTime] = useState<number | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const bg = isDark ? '#0F172A' : '#FFFFFF';
  const bg2 = isDark ? '#1E293B' : '#F8FAFC';
  const border = isDark ? '#334155' : '#E2E8F0';
  const text = isDark ? '#F1F5F9' : '#1E293B';
  const muted = isDark ? '#64748B' : '#94A3B8';

  const handleExecute = async () => {
    if (!query.trim()) return;
    setLoading(true);
    setError(null);
    const start = performance.now();
    try {
      const res = await onExecute(query);
      setResults(res);
      setExecutionTime(Math.round(performance.now() - start));
    } catch (e: any) {
      setError(e?.message || 'Query failed');
      setResults(null);
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleExecute();
    }
  };

  const SAMPLE_QUERIES = [
    {
      label: 'List classes',
      query: `SELECT DISTINCT ?class WHERE { ?s a ?class } LIMIT 20`,
    },
    {
      label: 'All triples',
      query: `SELECT ?s ?p ?o WHERE { ?s ?p ?o } LIMIT 50`,
    },
    {
      label: 'Subclasses',
      query: `PREFIX rdfs: <http://www.w3.org/2000/01/rdf-schema#>
SELECT ?sub ?super WHERE { ?sub rdfs:subClassOf ?super } LIMIT 20`,
    },
  ];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', fontFamily: '"Inter", sans-serif' }}>
      {/* Editor header */}
      <div style={{ padding: '12px 16px 8px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 700, color: text }}>SPARQL Query Editor</div>
          <div style={{ fontSize: 11, color: muted, marginTop: 2 }}>Ctrl+Enter to execute</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          {/* Sample query buttons */}
          {SAMPLE_QUERIES.map((s) => (
            <button
              key={s.label}
              onClick={() => setQuery(s.query)}
              style={{
                background: isDark ? '#1E293B' : '#F1F5F9',
                border: `1px solid ${border}`,
                color: isDark ? '#94A3B8' : '#475569',
                borderRadius: 6,
                padding: '4px 10px',
                fontSize: 11,
                cursor: 'pointer',
                fontFamily: '"Inter", sans-serif',
              }}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>

      {/* Textarea editor */}
      <div style={{ position: 'relative', flexShrink: 0 }}>
        <textarea
          ref={textareaRef}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyDown={handleKeyDown}
          spellCheck={false}
          style={{
            width: '100%',
            height: 180,
            background: isDark ? '#0D1117' : '#FAFAFA',
            color: isDark ? '#E2E8F0' : '#1E293B',
            border: 'none',
            borderBottom: `1px solid ${border}`,
            resize: 'vertical',
            padding: '12px 16px',
            fontFamily: '"JetBrains Mono", "Fira Code", "Cascadia Code", monospace',
            fontSize: 13,
            lineHeight: 1.7,
            outline: 'none',
            boxSizing: 'border-box',
          }}
          aria-label="SPARQL query editor"
          placeholder="Enter SPARQL query..."
        />
      </div>

      {/* Execute button */}
      <div style={{ padding: '10px 16px', borderBottom: `1px solid ${border}`, display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={handleExecute}
          disabled={loading}
          aria-label="Execute SPARQL query"
          style={{
            background: loading ? muted : '#2563EB',
            color: '#FFFFFF',
            border: 'none',
            borderRadius: 8,
            padding: '8px 20px',
            fontSize: 13,
            fontWeight: 700,
            cursor: loading ? 'not-allowed' : 'pointer',
            fontFamily: '"Inter", sans-serif',
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            transition: 'background 0.15s',
          }}
        >
          {loading ? '⏳ Executing...' : '▶ Execute'}
        </button>
        {executionTime !== null && !loading && (
          <span style={{ fontSize: 11, color: muted }}>
            Completed in {executionTime}ms
          </span>
        )}
        {results && (
          <span style={{ fontSize: 11, color: '#10B981', fontWeight: 600 }}>
            {results.rows.length} result{results.rows.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Error */}
      {error && (
        <div style={{
          margin: 12,
          padding: '10px 14px',
          background: isDark ? '#450A0A' : '#FEF2F2',
          border: `1px solid ${isDark ? '#991B1B' : '#FCA5A5'}`,
          borderRadius: 8,
          color: isDark ? '#FCA5A5' : '#991B1B',
          fontSize: 12,
          fontFamily: '"JetBrains Mono", monospace',
        }}>
          ❌ {error}
        </div>
      )}

      {/* Results table */}
      {results && results.rows.length > 0 && (
        <div style={{ flex: 1, overflow: 'auto', padding: 12 }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr style={{ background: isDark ? '#1E293B' : '#F1F5F9' }}>
                {results.variables.map((v) => (
                  <th
                    key={v}
                    style={{
                      padding: '8px 12px',
                      textAlign: 'left',
                      color: isDark ? '#F59E0B' : '#D97706',
                      fontFamily: '"Inter", sans-serif',
                      fontWeight: 700,
                      fontSize: 11,
                      textTransform: 'uppercase',
                      letterSpacing: 0.5,
                      borderBottom: `2px solid ${border}`,
                      position: 'sticky',
                      top: 0,
                      background: isDark ? '#1E293B' : '#F1F5F9',
                    }}
                  >
                    ?{v}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {results.rows.map((row, i) => (
                <tr
                  key={i}
                  style={{
                    background: i % 2 === 0 ? bg : bg2,
                    transition: 'background 0.1s',
                  }}
                  onMouseEnter={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = isDark ? '#1E3A5F' : '#EFF6FF')}
                  onMouseLeave={(e) => ((e.currentTarget as HTMLTableRowElement).style.background = i % 2 === 0 ? bg : bg2)}
                >
                  {results.variables.map((v) => (
                    <td
                      key={v}
                      style={{
                        padding: '6px 12px',
                        color: text,
                        borderBottom: `1px solid ${border}`,
                        fontFamily: '"JetBrains Mono", monospace',
                        fontSize: 11,
                        maxWidth: 200,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                      title={row[v] || ''}
                    >
                      {row[v] || <span style={{ color: muted, fontStyle: 'italic' }}>—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {results && results.rows.length === 0 && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: muted, fontSize: 13 }}>
          No results found for this query.
        </div>
      )}
    </div>
  );
};
