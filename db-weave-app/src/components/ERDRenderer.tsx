import React, { useEffect, useMemo, useState } from 'react'
import {
  Background,
  Controls,
  Handle,
  MiniMap,
  Position,
  ReactFlow,
  useEdgesState,
  useNodesState,
} from '@xyflow/react'
import type { Edge, Node } from '@xyflow/react'
import '@xyflow/react/dist/style.css'
import type { SchemaNode, TableNode } from '../lib/dsl/types'
import {
  getLayoutedElements,
  type NodeDimensions,
} from '../lib/layoutAlgorithm'
import { getELKLayoutedElements } from '../lib/elkLayoutAlgorithm'

/**
 * Calculate the approximate dimensions of a table node
 * based on its column count and content
 */
function calculateTableDimensions(table: TableNode): NodeDimensions {
  // Base width - tables have min-w-[250px] and max-w-[350px], use conservative estimate
  const baseWidth = 380 // Increased to account for max width + padding

  // Calculate height based on table structure:
  let headerHeight = 60 // Increased base header height

  // Estimate multi-line description height
  if (table.description) {
    // Assume ~35 characters per line at text-sm (14px) with max-w-[350px]
    // Each line is approximately 24px with leading-relaxed and padding
    const charsPerLine = 35
    const lineHeight = 24
    const estimatedLines = Math.ceil(table.description.length / charsPerLine)
    const descriptionHeight = estimatedLines * lineHeight

    // Add margin-top (4px) and description height
    headerHeight += 4 + descriptionHeight
  }

  const columnHeight = 36 // Height per column row (increased for padding)
  const padding = 20 // Top and bottom padding for columns container

  const totalHeight =
    headerHeight + table.columns.length * columnHeight + padding

  return {
    width: baseWidth,
    height: totalHeight,
  }
}

type EdgeStyle = 'step' | 'smoothstep' | 'straight' | 'simplebezier'

interface ERDRendererProps {
  schema: SchemaNode
  useAutoLayout?: boolean // Enable automatic layout
  layoutEngine?: 'dagre' | 'elk' // Choose layout engine
  edgeStyle?: EdgeStyle // Visual style for edges
  horizontalSpacing?: number // Configurable horizontal spacing between nodes
  verticalSpacing?: number // Configurable vertical spacing between nodes
}

interface TableNodeData {
  table: TableNode
  isHighlighted?: boolean
  isDimmed?: boolean
}

export type HoveredElement = { type: 'node' | 'edge'; id: string } | null

export function computeConnectedSet(
  hoveredElement: HoveredElement,
  edges: Edge[],
): { nodeIds: Set<string>; edgeIds: Set<string> } | null {
  if (!hoveredElement) return null

  const connected = { nodeIds: new Set<string>(), edgeIds: new Set<string>() }

  if (hoveredElement.type === 'edge') {
    const edge = edges.find((e) => e.id === hoveredElement.id)
    if (edge) {
      connected.edgeIds.add(edge.id)
      connected.nodeIds.add(edge.source)
      connected.nodeIds.add(edge.target)
    }
  } else {
    connected.nodeIds.add(hoveredElement.id)
    for (const edge of edges) {
      if (edge.source === hoveredElement.id || edge.target === hoveredElement.id) {
        connected.edgeIds.add(edge.id)
        connected.nodeIds.add(edge.source)
        connected.nodeIds.add(edge.target)
      }
    }
  }

  return connected
}

const TableNodeComponent: React.FC<{ data: TableNodeData }> = ({ data }) => {
  const { table } = data

  return (
    <div className={`bg-white border-2 rounded-lg shadow-lg min-w-[250px] max-w-[350px] relative z-20 overflow-hidden ${data.isHighlighted ? 'border-blue-500' : 'border-gray-300'}`}>
      {/* Connection handles on all four sides for smart edge routing */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: '#555', width: 8, height: 8, top: -4, zIndex: 30 }}
      />
      <Handle
        type="target"
        position={Position.Right}
        id="right"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          right: -4,
          zIndex: 30,
        }}
      />
      <Handle
        type="target"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          bottom: -4,
          zIndex: 30,
        }}
      />
      <Handle
        type="target"
        position={Position.Left}
        id="left"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          left: -4,
          zIndex: 30,
        }}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="top"
        style={{ background: '#555', width: 8, height: 8, top: -4, zIndex: 30 }}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="right"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          right: -4,
          zIndex: 30,
        }}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          bottom: -4,
          zIndex: 30,
        }}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="left"
        style={{
          background: '#555',
          width: 8,
          height: 8,
          left: -4,
          zIndex: 30,
        }}
      />

      <div className="bg-blue-600 text-white p-3 rounded-t-lg">
        <h3 className="font-bold text-lg break-words">{table.name}</h3>
        {table.description && (
          <p className="text-blue-100 text-sm mt-1 break-words whitespace-normal leading-relaxed">
            {table.description}
          </p>
        )}
      </div>

      <div className="p-2">
        {table.columns.map((column, idx) => (
          <div
            key={idx}
            className="flex justify-between items-center py-1 px-2 hover:bg-gray-50 rounded"
          >
            <div className="flex items-center gap-2">
              {column.constraints.some((c) => c.kind === 'primary_key') && (
                <span className="text-yellow-600 text-xs">🔑</span>
              )}
              {column.constraints.some((c) => c.kind === 'foreign_key') && (
                <span className="text-blue-600 text-xs">🔗</span>
              )}
              <span className="font-medium text-sm">{column.name}</span>
            </div>
            <div className="text-gray-600 text-xs">
              {column.dataType.name}
              {column.dataType.length && `(${column.dataType.length})`}
              {column.dataType.precision &&
                column.dataType.scale &&
                `(${column.dataType.precision},${column.dataType.scale})`}
              {!column.constraints.some((c) => c.kind === 'not_null') && '?'}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

const nodeTypes = {
  table: TableNodeComponent,
}

export const ERDRenderer: React.FC<ERDRendererProps> = ({
  schema,
  useAutoLayout = true,
  layoutEngine = 'elk',
  edgeStyle = 'simplebezier',
  horizontalSpacing = 500,
  verticalSpacing = 400,
}) => {
  const [isLayouting, setIsLayouting] = useState(false)
  const [hoveredElement, setHoveredElement] = useState<HoveredElement>(null)

  const initialGraph = useMemo(() => {
    const tableNodes: Array<Node> = []
    const relationshipEdges: Array<Edge> = []
    const nodeDimensions = new Map<string, NodeDimensions>()

    // Create nodes for each table with better spacing
    schema.tables.forEach((table, index) => {
      // Calculate actual dimensions for this table
      const dimensions = calculateTableDimensions(table)
      nodeDimensions.set(table.name, dimensions)

      // Increase spacing for better readability with many tables
      const horizontalSpacingValue = horizontalSpacing
      const verticalSpacingValue = verticalSpacing
      const columnsPerRow = 2 // Reduced to prevent horizontal crowding

      const x = (index % columnsPerRow) * horizontalSpacingValue + 50
      const y = Math.floor(index / columnsPerRow) * verticalSpacingValue + 50

      tableNodes.push({
        id: table.name,
        type: 'table',
        position: { x, y },
        data: { table },
      })
    })

    // Create edges for foreign key relationships
    schema.tables.forEach((table) => {
      table.columns.forEach((column) => {
        column.constraints.forEach((constraint) => {
          if (constraint.kind === 'foreign_key') {
            const fkConstraint = constraint as any
            relationshipEdges.push({
              id: `${table.name}-${column.name}-${fkConstraint.references.table}`,
              source: table.name,
              target: fkConstraint.references.table,
              sourceHandle: 'right', // Use right handle for outgoing connections
              targetHandle: 'left', // Use left handle for incoming connections
              type: edgeStyle,
              label: `${column.name} → ${fkConstraint.references.column}`,
              labelStyle: { fontSize: 11, fill: '#555', fontWeight: 500 },
              labelBgStyle: { fill: '#ffffff', fillOpacity: 0.95 },
              labelBgPadding: [6, 4] as [number, number],
              labelBgBorderRadius: 4,
              style: {
                stroke: '#3b82f6',
                strokeWidth: 2,
              },
              markerEnd: {
                type: 'arrowclosed',
                color: '#3b82f6',
                width: 20,
                height: 20,
              },
            })
          }
        })
      })
    })

    return { nodes: tableNodes, edges: relationshipEdges, nodeDimensions }
  }, [schema, edgeStyle, horizontalSpacing, verticalSpacing])

  const [flowNodes, setNodes, onNodesChange] = useNodesState(initialGraph.nodes)
  const [flowEdges, setEdges, onEdgesChange] = useEdgesState(initialGraph.edges)

  const connectedSet = useMemo(
    () => computeConnectedSet(hoveredElement, flowEdges),
    [hoveredElement, flowEdges],
  )

  const styledNodes = useMemo(() => {
    if (!connectedSet) return flowNodes

    return flowNodes.map((node) => {
      const isHighlighted = connectedSet.nodeIds.has(node.id)
      return {
        ...node,
        data: { ...node.data, isHighlighted, isDimmed: !isHighlighted },
        style: {
          ...node.style,
          opacity: isHighlighted ? 1 : 0.25,
          transition: 'none',
        },
      }
    })
  }, [flowNodes, connectedSet])

  const styledEdges = useMemo(() => {
    if (!connectedSet) return flowEdges

    return flowEdges.map((edge) => {
      const isHighlighted = connectedSet.edgeIds.has(edge.id)

      if (isHighlighted) {
        return {
          ...edge,
          style: { ...edge.style, stroke: '#2563eb', strokeWidth: 3, transition: 'none' },
          labelStyle: { fontSize: 13, fill: '#333', fontWeight: 700 },
          markerEnd:
            typeof edge.markerEnd === 'object'
              ? { ...edge.markerEnd, color: '#2563eb' }
              : edge.markerEnd,
        }
      }

      return {
        ...edge,
        style: { ...edge.style, opacity: 0.15, transition: 'none' },
        labelStyle: { ...edge.labelStyle, opacity: 0.15 },
        markerEnd:
          typeof edge.markerEnd === 'object'
            ? { ...edge.markerEnd, color: '#3b82f6' }
            : edge.markerEnd,
      }
    })
  }, [flowEdges, connectedSet])

  // Apply layout asynchronously when needed
  useEffect(() => {
    const applyLayout = async () => {
      if (!useAutoLayout) {
        setNodes(initialGraph.nodes)
        setEdges(initialGraph.edges)
        return
      }

      setIsLayouting(true)

      try {
        let layouted: { nodes: Node[]; edges: Edge[] }

        if (layoutEngine === 'elk') {
          // Use ELK for better node positioning with more spacing
          layouted = await getELKLayoutedElements(
            initialGraph.nodes,
            initialGraph.edges,
            initialGraph.nodeDimensions,
            {
              direction: 'DOWN',
              nodeSep: horizontalSpacing,
              rankSep: verticalSpacing,
              edgeRouting: 'SPLINES', // Using SPLINES for smoother curves around nodes
            },
          )
        } else {
          // Use dagre for faster synchronous layout
          layouted = getLayoutedElements(
            initialGraph.nodes,
            initialGraph.edges,
            initialGraph.nodeDimensions,
            {
              direction: 'TB',
              defaultNodeWidth: 380, // Updated to match new table width
              defaultNodeHeight: 200,
              nodeSep: horizontalSpacing,
              rankSep: verticalSpacing,
            },
          )
        }

        setNodes(layouted.nodes)
        setEdges(layouted.edges)
      } catch (error) {
        console.error('Layout failed:', error)
        // Fallback to initial positions
        setNodes(initialGraph.nodes)
        setEdges(initialGraph.edges)
      } finally {
        setIsLayouting(false)
      }
    }

    applyLayout()
  }, [initialGraph, useAutoLayout, layoutEngine, setNodes, setEdges])

  return (
    <div className="w-full h-full relative erd-container">
      {isLayouting && (
        <div className="absolute inset-0 bg-gray-50/80 flex items-center justify-center z-50">
          <div className="bg-white px-4 py-2 rounded-lg shadow-lg">
            <p className="text-sm text-gray-700">
              Calculating optimal layout...
            </p>
          </div>
        </div>
      )}
      <ReactFlow
        nodes={styledNodes}
        edges={styledEdges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        nodeTypes={nodeTypes}
        fitView
        proOptions={{ hideAttribution: true }}
        attributionPosition="bottom-left"
        elevateEdgesOnSelect={false}
        nodesDraggable={true}
        nodesConnectable={false}
        elementsSelectable={true}
        onNodeMouseEnter={(_, node) => setHoveredElement({ type: 'node', id: node.id })}
        onNodeMouseLeave={() => setHoveredElement(null)}
      >
        <Background color="#f1f5f9" gap={20} />
        <Controls />
        <MiniMap nodeColor="#3b82f6" nodeStrokeWidth={3} zoomable pannable />
      </ReactFlow>
    </div>
  )
}
