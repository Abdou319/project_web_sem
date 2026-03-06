import { LayoutType } from '../components/GraphView/GraphView';

export class LayoutManager {
  static getConfig(layout: LayoutType): cytoscape.LayoutOptions {
    switch (layout) {
      case 'force':
        return {
          name: 'cose',
          animate: true,
          animationDuration: 600,
          animationEasing: 'ease-out',
          idealEdgeLength: () => 120,
          nodeRepulsion: () => 8000,
          nodeOverlap: 20,
          refresh: 20,
          fit: true,
          padding: 40,
          randomize: false,
          componentSpacing: 100,
          edgeElasticity: () => 100,
          nestingFactor: 5,
          gravity: 80,
          numIter: 1000,
          initialTemp: 200,
          coolingFactor: 0.95,
          minTemp: 1.0,
        } as any;

      case 'hierarchical':
        return {
          name: 'breadthfirst',
          directed: true,
          fit: true,
          padding: 40,
          spacingFactor: 1.5,
          animate: true,
          animationDuration: 500,
          animationEasing: 'ease-out',
          circle: false,
          grid: false,
          avoidOverlap: true,
        } as any;

      case 'grid':
        return {
          name: 'grid',
          fit: true,
          padding: 40,
          avoidOverlap: true,
          avoidOverlapPadding: 20,
          condense: false,
          animate: true,
          animationDuration: 500,
        } as any;

      case 'circle':
        return {
          name: 'circle',
          fit: true,
          padding: 40,
          avoidOverlap: true,
          animate: true,
          animationDuration: 500,
          animationEasing: 'ease-out',
          spacingFactor: 1.5,
        } as any;

      default:
        return { name: 'cose' };
    }
  }
}