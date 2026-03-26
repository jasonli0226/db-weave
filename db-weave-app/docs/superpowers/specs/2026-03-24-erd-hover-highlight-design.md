# ERD Edge/Node Hover Highlight

## Summary

Add interactive hover highlighting to the ERD renderer so users can visually trace relationships between tables. Hovering over an edge or table node highlights the connected elements and dims everything else.

## Requirements

- **Edge hover:** Hovering an edge highlights its two connected table nodes and dims all unrelated nodes/edges
- **Node hover:** Hovering a table node highlights all edges connected to it and all tables on the other end of those edges
- **Dim style:** Non-related elements get reduced opacity (nodes: 0.25, edges: 0.15)
- **Highlight style:** Connected edges get thicker stroke (2px to 3px), brighter blue (#2563eb), and bolder/larger FK labels (fontSize: 13, fontWeight: 700). Connected nodes get a blue border (border-blue-500)
- **No transition:** All style changes are instant (no CSS transitions or animations)
- **Default state:** When nothing is hovered, all elements display with their normal styling

## Approach

**React State + Inline Styles** — Track a `hoveredElement` in React state and compute connected sets via `useMemo`. Apply highlight/dim styles by mapping over nodes and edges before passing them to `<ReactFlow>`.

Chosen over CSS-based approaches for simplicity and maintainability. Re-render cost is negligible for typical schema sizes (<50 tables).

## Architecture

All changes live in `ERDRenderer.tsx`. No new files needed.

### Updated Types

```typescript
interface TableNodeData {
  table: TableNode
  isHighlighted?: boolean
  isDimmed?: boolean
}
```

Note: `onHover`/`onHoverEnd` callbacks are NOT needed in the data — we use React Flow's native `onNodeMouseEnter`/`onNodeMouseLeave` props instead.

### State

```typescript
type HoveredElement = { type: 'node' | 'edge'; id: string } | null

const [hoveredElement, setHoveredElement] = useState<HoveredElement>(null)
```

### Connected Set Computation

```typescript
const connectedSet = useMemo(() => {
  if (!hoveredElement) return null

  const connected = { nodeIds: new Set<string>(), edgeIds: new Set<string>() }

  if (hoveredElement.type === 'edge') {
    const edge = flowEdges.find(e => e.id === hoveredElement.id)
    if (edge) {
      connected.edgeIds.add(edge.id)
      connected.nodeIds.add(edge.source)
      connected.nodeIds.add(edge.target)
    }
  } else {
    // Node hovered — find all connected edges and their other endpoints
    for (const edge of flowEdges) {
      if (edge.source === hoveredElement.id || edge.target === hoveredElement.id) {
        connected.edgeIds.add(edge.id)
        connected.nodeIds.add(edge.source)
        connected.nodeIds.add(edge.target)
      }
    }
  }

  return connected
}, [hoveredElement, flowEdges])
```

### Style Application

Nodes and edges are mapped before being passed to `<ReactFlow>`:

**Nodes:**
- No hover active: default style
- In `connectedSet.nodeIds`: `{ className: 'border-blue-500' }` on the TableNodeComponent wrapper
- Not in set: `{ opacity: 0.25 }`

**Edges:**
- No hover active: default style (stroke: #3b82f6, strokeWidth: 2, fontSize: 11, fontWeight: 500, markerEnd.color: #3b82f6)
- In `connectedSet.edgeIds`: stroke: #2563eb, strokeWidth: 3, fontSize: 13, fontWeight: 700, markerEnd.color: #2563eb
- Not in set: `{ opacity: 0.15 }` (including markerEnd)

### Event Handlers

All hover events use React Flow's native props on `<ReactFlow>` for symmetry:
- `onEdgeMouseEnter={(_, edge) => setHoveredElement({ type: 'edge', id: edge.id })}`
- `onEdgeMouseLeave={() => setHoveredElement(null)}`
- `onNodeMouseEnter={(_, node) => setHoveredElement({ type: 'node', id: node.id })}`
- `onNodeMouseLeave={() => setHoveredElement(null)}`

No callbacks are passed through node `data` props. This avoids re-render issues from unstable function references.

### Style Application Strategy

**Important:** The `flowNodes`/`flowEdges` from `useNodesState`/`useEdgesState` hold the canonical unstyled state. Styling is applied as a **derived render-time mapping** — the styled arrays are passed to `<ReactFlow>` for rendering, but `setNodes`/`setEdges` are never called with styled values. The `onNodesChange`/`onEdgesChange` handlers continue to operate on the unstyled state.

To suppress any inherited CSS transitions (from React Flow defaults or Tailwind), explicitly set `transition: 'none'` in inline styles for both highlighted and dimmed states.

### TableNodeComponent Changes

The component's root div conditionally applies:
- `border-blue-500` class when `data.isHighlighted` is true
- `opacity: 0.25` style when `data.isDimmed` is true
- Default styling when neither flag is set

These flags (`isHighlighted`, `isDimmed`) are computed during the node mapping step and passed through `data`.

## Data Flow

```
User hovers element
       |
setHoveredElement({ type, id })
       |
useMemo computes connectedSet from hoveredElement + flowEdges
       |
styledNodes = flowNodes.map(node => add isHighlighted/isDimmed to data)
       |
styledEdges = flowEdges.map(edge => apply highlight or dim styles)
       |
<ReactFlow nodes={styledNodes} edges={styledEdges} />
```

## Performance

For schemas approaching 50+ tables, the hover re-render remains fast since the `connectedSet` computation is O(edges) and the style mapping is O(nodes + edges). No debouncing needed. If performance becomes an issue at much larger scales, consider memoizing the styled arrays or switching to a CSS-class approach.

## Testing

Tests in `src/components/__tests__/ERDRenderer.test.tsx` using Jest and React Testing Library:

- Unit test: `connectedSet` computation given mock edges and a hovered element
- Unit test: style mapping produces correct opacity/stroke values for highlighted vs dimmed elements
- Integration test: render ERDRenderer with a schema containing FK relationships, simulate hover, verify DOM opacity changes
- Edge cases: hover on a table with no relationships (only that table highlights, all others dim), hover on edge where target table doesn't exist (graceful no-op)

## Cleanup

- Remove debug `console.log` calls on lines 249-253 and 282-283 of current `ERDRenderer.tsx`
- Fix `edgeStyle` default value (`'default'` is not in the `EdgeStyle` union type)

## Files Modified

- `db-weave-app/src/components/ERDRenderer.tsx` — all changes contained here
