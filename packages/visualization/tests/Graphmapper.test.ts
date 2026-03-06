import { GraphMapper } from '../src/Graph/GraphMapper';
import { Triple } from '../src/components/GraphView/GraphView';

describe('GraphMapper', () => {
  describe('triplesToElements', () => {
    it('should convert basic triples to Cytoscape elements', () => {
      const triples: Triple[] = [
        {
          subject: 'http://example.org/Alice',
          predicate: 'http://xmlns.com/foaf/0.1/knows',
          object: 'http://example.org/Bob',
        },
      ];

      const elements = GraphMapper.triplesToElements(triples);

      expect(elements.nodes).toHaveLength(2); // Alice, Bob
      expect(elements.edges).toHaveLength(1); // knows
      expect(elements.nodes.find((n) => n.data.id === 'http://example.org/Alice')).toBeDefined();
      expect(elements.nodes.find((n) => n.data.id === 'http://example.org/Bob')).toBeDefined();
      expect(elements.edges[0].data.label).toBe('knows');
    });

    it('should classify literal objects correctly', () => {
      const triples: Triple[] = [
        {
          subject: 'http://example.org/Alice',
          predicate: 'http://xmlns.com/foaf/0.1/name',
          object: 'Alice Wonderland',
        },
      ];

      const { nodes } = GraphMapper.triplesToElements(triples);
      const literal = nodes.find((n) => n.data.id === 'Alice Wonderland');
      expect(literal).toBeDefined();
      expect(literal!.data.type).toBe('literal');
    });

    it('should classify rdf:type objects as classes', () => {
      const RDF_TYPE = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type';
      const triples: Triple[] = [
        {
          subject: 'http://example.org/Alice',
          predicate: RDF_TYPE,
          object: 'http://xmlns.com/foaf/0.1/Person',
        },
      ];

      const { nodes } = GraphMapper.triplesToElements(triples);
      const personClass = nodes.find((n) => n.data.id === 'http://xmlns.com/foaf/0.1/Person');
      expect(personClass).toBeDefined();
      expect(personClass!.data.type).toBe('class');
    });

    it('should mark inferred edges correctly', () => {
      const triples: Triple[] = [
        {
          subject: 'http://example.org/Alice',
          predicate: 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type',
          object: 'http://example.org/Person',
          inferred: true,
        },
      ];

      const { edges } = GraphMapper.triplesToElements(triples);
      expect(edges[0].data.inferred).toBe('true');
    });

    it('should truncate labels for long URIs', () => {
      const longUri =
        'http://very.long.namespace.example.org/with/deep/path/MyResource';
      const triples: Triple[] = [
        {
          subject: longUri,
          predicate: 'http://example.org/rel',
          object: 'http://example.org/Target',
        },
      ];

      const { nodes } = GraphMapper.triplesToElements(triples);
      const node = nodes.find((n) => n.data.id === longUri);
      expect(node).toBeDefined();
      expect(node!.data.label.length).toBeLessThanOrEqual(25);
    });

    it('should not exceed MAX_NODES (1000) for large datasets', () => {
      const triples: Triple[] = Array.from({ length: 600 }, (_, i) => ({
        subject: `http://example.org/S${i}`,
        predicate: 'http://example.org/rel',
        object: `http://example.org/O${i}`,
      }));

      const { nodes } = GraphMapper.triplesToElements(triples);
      expect(nodes.length).toBeLessThanOrEqual(1000);
    });

    it('should deduplicate nodes from multiple triples', () => {
      const triples: Triple[] = [
        {
          subject: 'http://example.org/Alice',
          predicate: 'http://example.org/likes',
          object: 'http://example.org/Bob',
        },
        {
          subject: 'http://example.org/Bob',
          predicate: 'http://example.org/likes',
          object: 'http://example.org/Alice',
        },
      ];

      const { nodes } = GraphMapper.triplesToElements(triples);
      // Should only have Alice and Bob, not duplicates
      expect(nodes).toHaveLength(2);
    });
  });
});