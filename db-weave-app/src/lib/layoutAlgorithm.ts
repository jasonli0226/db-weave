import dagre from 'dagre'
import type { Edge, Node } from '@xyflow/react'

export interface LayoutOptions {
  direction?: 'TB' | 'LR' | 'BT' | 'RL'
  defaultNodeWidth?: number
  defaultNodeHeight?: number
  nodeSep?: number
  rankSep?: number
}

export interface NodeDimensions {
  width: number
  height: number
}

const defaultOptions: Required<LayoutOptions> = {
  direction: 'TB',
  defaultNodeWidth: 380, // Updated to match new table width
  defaultNodeHeight: 200,
  nodeSep: 300, // Reduced default horizontal spacing for more compact layout
  rankSep: 300, // Reduced default vertical spacing for more compact layout
}

/**
 * Applies dagre layout algorithm to arrange nodes automatically
 * @param nodes - Array of React Flow nodes
 * @param edges - Array of React Flow edges
 * @param nodeDimensions - Map of node IDs to their actual dimensions
 * @param options - Layout options
 * @returns New array of nodes with updated positions
 */
export function getLayoutedElements(
  nodes: Node[],
  edges: Edge[],
  nodeDimensions: Map<string, NodeDimensions>,
  options: LayoutOptions = {},
): { nodes: Node[]; edges: Edge[] } {
  const opts = { ...defaultOptions, ...options }

  const dagreGraph = new dagre.graphlib.Graph()
  dagreGraph.setDefaultEdgeLabel(() => ({}))

  // Configure graph layout
  dagreGraph.setGraph({
    rankdir: opts.direction,
    nodesep: opts.nodeSep,
    ranksep: opts.rankSep,
  })

  // Add nodes to dagre graph with their actual dimensions
  nodes.forEach((node) => {
    const dimensions = nodeDimensions.get(node.id) || {
      width: opts.defaultNodeWidth,
      height: opts.defaultNodeHeight,
    }

    dagreGraph.setNode(node.id, {
      width: dimensions.width,
      height: dimensions.height,
    })
  })

  // Add edges to dagre graph
  edges.forEach((edge) => {
    dagreGraph.setEdge(edge.source, edge.target)
  })

  // Compute layout
  dagre.layout(dagreGraph)

  // Update node positions
  const layoutedNodes = nodes.map((node) => {
    const nodeWithPosition = dagreGraph.node(node.id)
    const dimensions = nodeDimensions.get(node.id) || {
      width: opts.defaultNodeWidth,
      height: opts.defaultNodeHeight,
    }

    return {
      ...node,
      position: {
        x: nodeWithPosition.x - dimensions.width / 2,
        y: nodeWithPosition.y - dimensions.height / 2,
      },
    }
  })

  return { nodes: layoutedNodes, edges }
}
