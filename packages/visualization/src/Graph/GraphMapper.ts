/**
 * Graph Mapper - Convert RDF triples to Cytoscape graph format
 */

import type { Triple } from '../components/GraphView/GraphView';

export interface CytoscapeNode {
  data: {
    id: string;
    label: string;
    type: 'resource' | 'literal' | 'class';
    properties?: Record<string, string>;
  };
}

export interface CytoscapeEdge {
  data: {
    id: string;
    source: string;
    target: string;
    label: string;
    inferred: string; // 'true' | 'false' (Cytoscape data attrs are strings)
  };
}

export interface CytoscapeElements {
  nodes: CytoscapeNode[];
  edges: CytoscapeEdge[];
}

// RDF well-known types/namespaces
const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
const OWL_CLASS = 'http://www.w3.org/2002/07/owl#Class';
const RDFS_CLASS = 'http://www.w3.org/2000/01/rdf-schema#Class';
const OWL_THING = 'http://www.w3.org/2002/07/owl#Thing';

// Limit for performance
const MAX_NODES = 1000;

function getLocalName(uri: string): string {
  if (!uri.startsWith('http')) return uri; // already a literal
  const hash = uri.lastIndexOf('#');
  const slash = uri.lastIndexOf('/');
  const idx = Math.max(hash, slash);
  const local = idx >= 0 ? uri.slice(idx + 1) : uri;
  return local.length > 25 ? local.slice(0, 22) + '…' : local;
}

function isLiteral(value: string): boolean {
  return !value.startsWith('http') && !value.startsWith('_:');
}

function isClass(uri: string, classSet: Set<string>): boolean {
  return classSet.has(uri) || uri === OWL_CLASS || uri === RDFS_CLASS || uri === OWL_THING;
}

export class GraphMapper {
  static triplesToElements(triples: Triple[]): CytoscapeElements {
    // 1. Collect class URIs (subjects of rdf:type)
    const classUris = new Set<string>();
    triples.forEach((t) => {
      if (t.predicate === RDF_TYPE) {
        classUris.add(t.object);
      }
    });

    // 2. Collect unique node IDs
    const nodeIds = new Map<string, 'resource' | 'literal' | 'class'>();

    for (const t of triples) {
      if (!nodeIds.has(t.subject)) {
        nodeIds.set(t.subject, isClass(t.subject, classUris) ? 'class' : 'resource');
      }
      if (!nodeIds.has(t.object)) {
        if (isLiteral(t.object)) {
          nodeIds.set(t.object, 'literal');
        } else {
          nodeIds.set(t.object, isClass(t.object, classUris) ? 'class' : 'resource');
        }
      }

      if (nodeIds.size >= MAX_NODES) break;
    }

    // 3. Build Cytoscape nodes
    const nodes: CytoscapeNode[] = Array.from(nodeIds.entries()).map(([id, type]) => ({
      data: {
        id,
        label: getLocalName(id),
        type,
      },
    }));

    // 4. Build Cytoscape edges (only between existing nodes)
    const edgeCounter = new Map<string, number>();
    const edges: CytoscapeEdge[] = [];

    for (const t of triples) {
      if (!nodeIds.has(t.subject) || !nodeIds.has(t.object)) continue;

      const baseId = `${t.subject}__${t.predicate}__${t.object}`;
      const count = (edgeCounter.get(baseId) || 0) + 1;
      edgeCounter.set(baseId, count);

      edges.push({
        data: {
          id: `${baseId}__${count}`,
          source: t.subject,
          target: t.object,
          label: getLocalName(t.predicate),
          inferred: t.inferred ? 'true' : 'false',
        },
      });
    }

    return { nodes, edges };
  }
}