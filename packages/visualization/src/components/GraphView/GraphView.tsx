/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { useEffect, useRef, useState, useCallback } from 'react';
import cytoscape from 'cytoscape';
import { GraphMapper } from '../../Graph/GraphMapper';
import { LayoutManager } from '../../Graph/Layoutmanager';
import { GraphControls } from './GraphControls';
import { NodeDetails } from './Nodedetails';

export type LayoutType = 'force' | 'hierarchical' | 'grid' | 'circle';

export interface Triple {
  subject: string;
  predicate: string;
  object: string;
  inferred?: boolean;
}

export interface NodeData {
  id: string;
  label: string;
  type: 'resource' | 'literal' | 'class';
  uri: string;
  properties?: Record<string, string>;
}

interface GraphViewProps {
  triples: Triple[];
  layout: LayoutType;
  onLayoutChange: (layout: LayoutType) => void;
  isDark: boolean;
  inferredCount?: number;
}

export const GraphView: React.FC<GraphViewProps> = ({
  triples,
  layout,
  onLayoutChange,
  isDark,
  inferredCount = 0,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const cyRef = useRef<cytoscape.Core | null>(null);
  const [selectedNode, setSelectedNode] = useState<NodeData | null>(null);
  const [nodeCount, setNodeCount] = useState(0);
  const [edgeCount, setEdgeCount] = useState(0);
  const [zoom, setZoom] = useState(100);
  const [loading, setLoading] = useState(false);
  const [warning, setWarning] = useState<string | null>(null);

  const getStyles = useCallback(
    (): unknown => {
      const styles = [
      {
        selector: 'node[type="resource"]',
        css: {
          'background-color': isDark ? '#3B82F6' : '#2563EB',
          'border-color': isDark ? '#60A5FA' : '#1D4ED8',
          'border-width': 2,
          label: 'data(label)',
          color: isDark ? '#F1F5F9' : '#1E293B',
          'font-size': '11px',
          'font-family': '"Inter", sans-serif',
          'font-weight': 600,
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 6,
          width: 40,
          height: 40,
          'text-outline-color': isDark ? '#0F172A' : '#FFFFFF',
          'text-outline-width': 2,
          'overlay-padding': '6px',
          'z-index': 10,
        },
      },
      {
        selector: 'node[type="literal"]',
        css: {
          'background-color': isDark ? '#10B981' : '#059669',
          'border-color': isDark ? '#34D399' : '#047857',
          'border-width': 2,
          label: 'data(label)',
          color: isDark ? '#F1F5F9' : '#1E293B',
          'font-size': '10px',
          'font-family': '"Inter", sans-serif',
          shape: 'rectangle',
          width: 50,
          height: 25,
          'text-valign': 'center',
          'text-halign': 'center',
          'text-outline-color': isDark ? '#0F172A' : '#FFFFFF',
          'text-outline-width': 2,
        },
      },
      {
        selector: 'node[type="class"]',
        css: {
          'background-color': isDark ? '#F59E0B' : '#D97706',
          'border-color': isDark ? '#FCD34D' : '#B45309',
          'border-width': 3,
          label: 'data(label)',
          color: isDark ? '#F1F5F9' : '#1E293B',
          'font-size': '12px',
          'font-family': '"Inter", sans-serif',
          'font-weight': 700,
          shape: 'hexagon',
          width: 50,
          height: 50,
          'text-valign': 'bottom',
          'text-halign': 'center',
          'text-margin-y': 8,
          'text-outline-color': isDark ? '#0F172A' : '#FFFFFF',
          'text-outline-width': 2,
        },
      },
      {
        selector: 'node:selected',
        css: {
          'border-width': 4,
          'border-color': '#A855F7',
          'background-color': isDark ? '#7C3AED' : '#6D28D9',
          'overlay-color': '#A855F7',
          'overlay-opacity': 0.2,
        },
      },
      {
        selector: 'edge',
        css: {
          'line-color': isDark ? '#475569' : '#CBD5E1',
          'target-arrow-color': isDark ? '#475569' : '#CBD5E1',
          'target-arrow-shape': 'triangle',
          'curve-style': 'bezier',
          label: 'data(label)',
          'font-size': '9px',
          'font-family': '"Inter", sans-serif',
          color: isDark ? '#94A3B8' : '#64748B',
          'text-background-color': isDark ? '#1E293B' : '#F8FAFC',
          'text-background-opacity': 0.8,
          'text-background-padding': '2px',
          width: 1.5,
          'edge-text-rotation': 'autorotate',
        },
      },
      {
        selector: 'edge[inferred="true"]',
        css: {
          'line-color': isDark ? '#34D399' : '#10B981',
          'target-arrow-color': isDark ? '#34D399' : '#10B981',
          'line-style': 'dashed',
          width: 1.5,
          color: isDark ? '#6EE7B7' : '#065F46',
        },
      },
      {
        selector: 'edge:selected',
        css: {
          'line-color': '#A855F7',
          'target-arrow-color': '#A855F7',
          width: 3,
        },
      },
      {
        selector: '.highlighted',
        css: {
          'background-color': '#A855F7',
          'line-color': '#A855F7',
          'target-arrow-color': '#A855F7',
          'transition-property': 'background-color, line-color, target-arrow-color',
          'transition-duration': 0.3,
        },
      },
      {
        selector: '.faded',
        css: { opacity: 0.2 },
      },
      ];
      return styles as unknown;
    },
    [isDark]
  );

  useEffect(() => {
    if (!containerRef.current) return;

    setLoading(true);
    setWarning(null);

    // Warn if too many nodes
    const uniqueNodes = new Set<string>();
    triples.forEach((t) => {
      uniqueNodes.add(t.subject);
      uniqueNodes.add(t.object);
    });

    if (uniqueNodes.size > 1000) {
      setWarning(
        `⚠️ Large graph detected (${uniqueNodes.size} nodes). Showing first 1000 nodes for performance.`
      );
    }

    const { nodes, edges } = GraphMapper.triplesToElements(triples);

    if (cyRef.current) {
      cyRef.current.destroy();
    }

    cyRef.current = cytoscape({
      container: containerRef.current,
      elements: { nodes, edges },
      style: getStyles() as any,
      layout: LayoutManager.getConfig(layout),
      zoom: 1,
      pan: { x: 0, y: 0 },
      minZoom: 0.1,
      maxZoom: 5,
      wheelSensitivity: 0.2,
    });

    const cy = cyRef.current;

    setNodeCount(cy.nodes().length);
    setEdgeCount(cy.edges().length);

    // Node click → show details
    cy.on('tap', 'node', (evt) => {
      const node = evt.target;
      const data = node.data();

      // Highlight connected edges
      cy.elements().removeClass('highlighted faded');
      node.addClass('highlighted');
      node.connectedEdges().addClass('highlighted');
      node.connectedEdges().connectedNodes().addClass('highlighted');
      cy.elements().not('.highlighted').addClass('faded');

      setSelectedNode({
        id: data.id,
        label: data.label,
        type: data.type,
        uri: data.id,
        properties: data.properties || {},
      });
    });

    // Click on background → deselect
    cy.on('tap', (evt) => {
      if (evt.target === cy) {
        cy.elements().removeClass('highlighted faded');
        setSelectedNode(null);
      }
    });

    cy.on('zoom', () => {
      setZoom(Math.round((cy.zoom() || 1) * 100));
    });

    setLoading(false);

    return () => {
      if (cyRef.current) {
        cyRef.current.destroy();
        cyRef.current = null;
      }
    };
  }, [triples, layout, isDark]);

  // Re-apply styles on theme change without rebuilding graph
  useEffect(() => {
    if (cyRef.current) {
      // apply stylesheet: cast to any to satisfy cytoscape runtime API
      cyRef.current.style(getStyles() as any);
    }
  }, [isDark, getStyles]);

  const handleZoomIn = () => {
    if (cyRef.current) cyRef.current.zoom((cyRef.current.zoom() || 1) * 1.2);
  };

  const handleZoomOut = () => {
    if (cyRef.current) cyRef.current.zoom((cyRef.current.zoom() || 1) * 0.8);
  };

  const handleFit = () => {
    cyRef.current?.fit(undefined, 40);
  };

  const handleCenter = () => {
    cyRef.current?.center();
  };

  return (
    <div className="graph-view-wrapper" style={{ position: 'relative', width: '100%', height: '100%' }}>
      {warning && (
        <div
          style={{
            position: 'absolute',
            top: 12,
            left: '50%',
            transform: 'translateX(-50%)',
            zIndex: 100,
            background: '#F59E0B',
            color: '#1E293B',
            padding: '8px 16px',
            borderRadius: 8,
            fontSize: 13,
            fontWeight: 600,
            boxShadow: '0 4px 20px rgba(0,0,0,0.2)',
          }}
        >
          {warning}
        </div>
      )}

      {loading && (
        <div
          style={{
            position: 'absolute',
            inset: 0,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: isDark ? 'rgba(15,23,42,0.7)' : 'rgba(248,250,252,0.7)',
            zIndex: 50,
            fontSize: 16,
            color: isDark ? '#94A3B8' : '#64748B',
          }}
        >
          ⚡ Building graph...
        </div>
      )}

      <div ref={containerRef} style={{ width: '100%', height: '100%' }} />

      <GraphControls
        layout={layout}
        onLayoutChange={onLayoutChange}
        onZoomIn={handleZoomIn}
        onZoomOut={handleZoomOut}
        onFit={handleFit}
        onCenter={handleCenter}
        zoom={zoom}
        isDark={isDark}
      />

      {/* Stats bar */}
      <div
        style={{
          position: 'absolute',
          bottom: 12,
          left: 12,
          display: 'flex',
          gap: 8,
          zIndex: 20,
        }}
      >
        {[
          { label: 'Nodes', value: nodeCount, color: '#3B82F6' },
          { label: 'Edges', value: edgeCount, color: '#64748B' },
          { label: 'Inferred', value: inferredCount, color: '#10B981' },
        ].map(({ label, value, color }) => (
          <div
            key={label}
            style={{
              background: isDark ? 'rgba(30,41,59,0.9)' : 'rgba(255,255,255,0.9)',
              border: `1px solid ${isDark ? '#334155' : '#E2E8F0'}`,
              borderRadius: 8,
              padding: '4px 12px',
              fontSize: 12,
              fontFamily: '"Inter", sans-serif',
              color: isDark ? '#94A3B8' : '#64748B',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
            }}
          >
            <span style={{ color, fontWeight: 700 }}>{value}</span>
            {label}
          </div>
        ))}
      </div>

      {selectedNode && (
        <NodeDetails
          node={selectedNode}
          isDark={isDark}
          onClose={() => {
            setSelectedNode(null);
            cyRef.current?.elements().removeClass('highlighted faded');
          }}
        />
      )}
    </div>
  );
};
