/**
 * RDF Store Implementation (using rdflib.js)
 */

import {
    graph,
    parse,
    serialize,
    Store,
    NamedNode as RDFNamedNode,
    sym,
    lit,
    Statement,
} from 'rdflib';
import { IRDFStore } from '../interfaces';
import { Triple, RDFFormat, GraphStats, PrefixMap, NamedNode, BlankNode, Literal } from '../types/rdf';
import { STANDARD_PREFIXES } from '../utils/namespaces';

/**
 * Central RDF Store implementation
 */
export class RDFStore implements IRDFStore {
    private store: Store;
    private prefixes: PrefixMap;

    constructor() {
        this.store = graph();
        this.prefixes = { ...STANDARD_PREFIXES };
    }

    async load(data: string, format: RDFFormat, baseURI: string = 'https://example.org/'): Promise<void> {
        const mimeType = this.formatToMimeType(format);

        return new Promise((resolve, reject) => {
            parse(data, this.store, baseURI, mimeType, (err: Error | null | undefined) => {
                if (err) reject(new Error(`Failed to parse ${format}: ${err}`));
                else resolve();
            });
        });
    }

    async loadFromFile(filePath: string): Promise<void> {
        const fs = await import('fs/promises');
        const data = await fs.readFile(filePath, 'utf-8');

        // Auto-detect format from extension
        const format = this.detectFormat(filePath);
        return this.load(data, format);
    }

    async export(format: RDFFormat): Promise<string> {
        const mimeType = this.formatToMimeType(format);

        return new Promise((resolve, reject) => {
            try {
                const serialized = serialize(null, this.store, undefined, mimeType);
                if (serialized) {
                    resolve(serialized);
                } else {
                    reject(new Error(`Failed to serialize to ${format}`));
                }
            } catch (error) {
                reject(new Error(`Failed to serialize to ${format}: ${error}`));
            }
        });
    }

    async exportToFile(filePath: string, format: RDFFormat): Promise<void> {
        const fs = await import('fs/promises');
        const data = await this.export(format);
        await fs.writeFile(filePath, data, 'utf-8');
    }

    getStats(): GraphStats {
        const statements = this.store.statements;
        const subjects = new Set<string>();
        const predicates = new Set<string>();
        const objects = new Set<string>();
        const predicateCounts = new Map<string, number>();

        let literalCount = 0;
        let iriCount = 0;
        let blankNodeCount = 0;

        for (const stmt of statements) {
            subjects.add(stmt.subject.value);
            predicates.add(stmt.predicate.value);
            objects.add(stmt.object.value);

            // Count predicate usage
            const predValue = stmt.predicate.value;
            predicateCounts.set(predValue, (predicateCounts.get(predValue) || 0) + 1);

            // Count node types
            if (stmt.object.termType === 'Literal') {
                literalCount++;
            } else if (stmt.object.termType === 'NamedNode') {
                iriCount++;
            } else if (stmt.object.termType === 'BlankNode') {
                blankNodeCount++;
            }
        }

        // Sort predicates by count
        const topPredicates = Array.from(predicateCounts.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 10)
            .map(([predicate, count]) => ({ predicate, count }));

        return {
            totalTriples: statements.length,
            uniqueSubjects: subjects.size,
            uniquePredicates: predicates.size,
            uniqueObjects: objects.size,
            literalCount,
            iriCount,
            blankNodeCount,
            topPredicates,
        };
    }

    getTriples(): Triple[] {
        return this.store.statements.map((stmt) => this.statementToTriple(stmt));
    }

    addTriple(triple: Triple): void {
        const subject = this.termToRdflib(triple.subject);
        const predicate = this.termToRdflib(triple.predicate) as RDFNamedNode;
        const object = this.termToRdflib(triple.object);

        this.store.add(subject, predicate, object);
    }

    removeTriple(triple: Triple): boolean {
        const subject = this.termToRdflib(triple.subject);
        const predicate = this.termToRdflib(triple.predicate) as RDFNamedNode;
        const object = this.termToRdflib(triple.object);

        const stmt = this.store.statements.find(
            (s) =>
                s.subject.equals(subject) && s.predicate.equals(predicate) && s.object.equals(object)
        );

        if (stmt) {
            this.store.remove(stmt);
            return true;
        }
        return false;
    }

    clear(): void {
        this.store = graph();
    }

    getPrefixes(): PrefixMap {
        return { ...this.prefixes };
    }

    registerPrefix(prefix: string, uri: string): void {
        this.prefixes[prefix] = uri;
    }

    /**
     * Get the underlying rdflib store (for advanced usage)
     */
    getStore(): Store {
        return this.store;
    }

    // Helper methods

    private formatToMimeType(format: RDFFormat): string {
        const mimeTypes: Record<RDFFormat, string> = {
            turtle: 'text/turtle',
            'rdf-xml': 'application/rdf+xml',
            'n-triples': 'application/n-quads',
            'n-quads': 'application/n-quads',
            'json-ld': 'application/ld+json',
        };
        return mimeTypes[format];
    }

    private detectFormat(filePath: string): RDFFormat {
        const ext = filePath.split('.').pop()?.toLowerCase();
        const formatMap: Record<string, RDFFormat> = {
            ttl: 'turtle',
            rdf: 'rdf-xml',
            owl: 'rdf-xml',
            nt: 'n-triples',
            nq: 'n-quads',
            jsonld: 'json-ld',
        };
        return formatMap[ext || ''] || 'turtle';
    }

    private statementToTriple(stmt: Statement): Triple {
        return {
            subject: this.rdflibToTerm(stmt.subject) as NamedNode | BlankNode,
            predicate: this.rdflibToTerm(stmt.predicate) as NamedNode,
            object: this.rdflibToTerm(stmt.object),
        };
    }

    private rdflibToTerm(node: any): NamedNode | BlankNode | Literal {
        if (node.termType === 'NamedNode') {
            return { type: 'NamedNode', value: node.value };
        } else if (node.termType === 'BlankNode') {
            return { type: 'BlankNode', value: node.value };
        } else if (node.termType === 'Literal') {
            return {
                type: 'Literal',
                value: node.value,
                language: node.language || undefined,
                datatype: node.datatype?.value,
            };
        }
        throw new Error(`Unknown node type: ${node.termType}`);
    }

    private termToRdflib(term: NamedNode | BlankNode | Literal): any {
        if (term.type === 'NamedNode') {
            return sym(term.value);
        } else if (term.type === 'BlankNode') {
            return this.store.bnode(term.value);
        } else if (term.type === 'Literal') {
            return lit(term.value, term.language, term.datatype ? sym(term.datatype) : undefined);
        }
        throw new Error(`Unknown term type: ${(term as any).type}`);
    }
}
