import ELK, { type ElkNode } from 'elkjs/lib/elk.bundled'
import type { Edge, Node } from '@xyflow/react'
import type { NodeDimensions } from './layoutAlgorithm'

export interface ELKLayoutOptions {
  direction?: 'RIGHT' | 'DOWN' | 'LEFT' | 'UP'
  nodeSep?: number
  rankSep?: number
  edgeRouting?: 'ORTHOGONAL' | 'POLYLINE' | 'SPLINES'
}

const defaultOptions: Required<ELKLayoutOptions> = {
  direction: 'DOWN',
  nodeSep: 300, // Reduced default horizontal spacing for more compact layout
  rankSep: 300, // Reduced default vertical spacing for more compact layout
  edgeRouting: 'ORTHOGONAL', // Routes edges around nodes
}

/**
 * Applies ELK layout algorithm with smart edge routing that avoids nodes
 * @param nodes - Array of React Flow nodes
 * @param edges - Array of React Flow edges
 * @param nodeDimensions - Map of node IDs to their actual dimensions
 * @param options - Layout options
 * @returns New array of nodes with updated positions
 */
export async function getELKLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  nodeDimensions: Map<string, NodeDimensions>,
  options: ELKLayoutOptions = {},
): Promise<{ nodes: Node[]; edges: Edge[] }> {
  const opts = { ...defaultOptions, ...options }
  const elk = new ELK()

  // Build ELK graph structure
  const elkNodes: ElkNode['children'] = nodes.map((node) => {
    const dimensions = nodeDimensions.get(node.id) || {
      width: 300,
      height: 200,
    }

    return {
      id: node.id,
      width: dimensions.width,
      height: dimensions.height,
    }
  })

  const elkEdges = edges.map((edge) => ({
    id: edge.id,
    sources: [edge.source],
    targets: [edge.target],
  }))

  const elkGraph: ElkNode = {
    id: 'root',
    layoutOptions: {
      'elk.algorithm': 'layered',
      'elk.direction': opts.direction,
      'elk.spacing.nodeNode': String(opts.nodeSep),
      'elk.layered.spacing.nodeNodeBetweenLayers': String(opts.rankSep),
      'elk.edgeRouting': opts.edgeRouting,
      // Additional options for better edge routing
      'elk.layered.unnecessaryBendpoints': 'true',
      'elk.layered.nodePlacement.strategy': 'NETWORK_SIMPLEX',
      'elk.layered.crossingMinimization.strategy': 'LAYER_SWEEP',
      'elk.spacing.edgeNode': '200', // Increased space between edges and nodes
      'elk.spacing.edgeEdge': '60', // Increased space between parallel edges
    },
    children: elkNodes,
    edges: elkEdges,
  }

  try {
    const layoutedGraph = await elk.layout(elkGraph)

    // Update node positions from ELK layout
    const layoutedNodes = nodes.map((node) => {
      const elkNode = layoutedGraph.children?.find((n) => n.id === node.id)
      if (!elkNode) return node

      return {
        ...node,
        position: {
          x: elkNode.x ?? 0,
          y: elkNode.y ?? 0,
        },
      }
    })

    return { nodes: layoutedNodes, edges }
  } catch (error) {
    console.error('ELK layout failed:', error)
    // Fallback to original positions on error
    return { nodes, edges }
  }
}
