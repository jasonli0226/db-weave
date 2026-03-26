# ERD Hover Highlight Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add hover highlighting to ERD edges and nodes so users can visually trace table relationships.

**Architecture:** Single-file change in `ERDRenderer.tsx`. A `hoveredElement` state drives a `connectedSet` memo that determines which nodes/edges are highlighted vs dimmed. Styled arrays are derived at render time — canonical state stays unstyled.

**Tech Stack:** React, @xyflow/react v12, Tailwind CSS, Vitest, React Testing Library

**Spec:** `db-weave-app/docs/superpowers/specs/2026-03-24-erd-hover-highlight-design.md`

---

## File Structure

All changes in a single file plus one new test file:

- **Modify:** `db-weave-app/src/components/ERDRenderer.tsx` — hover state, connected set computation, style mapping, event handlers, TableNodeComponent updates, cleanup
- **Create:** `db-weave-app/src/components/__tests__/ERDRenderer.test.tsx` — unit and integration tests

---

### Task 1: Cleanup — Remove debug console.logs and fix edgeStyle default

**Files:**
- Modify: `db-weave-app/src/components/ERDRenderer.tsx:249-253,282-283,210`

- [ ] **Step 1: Remove console.log on lines 249-253**

Delete this block inside the FK constraint branch:
```typescript
            console.log('Found FK constraint:', {
              table: table.name,
              column: column.name,
              constraint: fkConstraint,
            })
```

- [ ] **Step 2: Remove console.log on lines 282-283**

Delete:
```typescript
    console.log('Generated edges:', relationshipEdges)
    console.log('Generated nodes:', tableNodes)
```

- [ ] **Step 3: Fix edgeStyle default value**

In the component props destructuring (line 210), change:
```typescript
  edgeStyle = 'default',
```
to:
```typescript
  edgeStyle = 'smoothstep',
```

- [ ] **Step 4: Run the app to verify nothing broke**

Run: `cd /home/jason/Projects/db-weave/db-weave-app && pnpm dev`
Verify: ERD still renders, no console errors.

- [ ] **Step 5: Commit**

```bash
git add db-weave-app/src/components/ERDRenderer.tsx
git commit -m "fix: remove debug console.logs and fix edgeStyle default in ERDRenderer"
```

---

### Task 2: Update types, add hover state, and export computeConnectedSet with tests (TDD)

**Files:**
- Modify: `db-weave-app/src/components/ERDRenderer.tsx:68-70`
- Create: `db-weave-app/src/components/__tests__/ERDRenderer.test.tsx`

- [ ] **Step 1: Update TableNodeData interface and add exported types/function**

Change `TableNodeData` (lines 68-70) from:
```typescript
interface TableNodeData {
  table: TableNode
}
```
to:
```typescript
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
```

- [ ] **Step 2: Write failing tests for computeConnectedSet**

Create `db-weave-app/src/components/__tests__/ERDRenderer.test.tsx`:
```typescript
import { describe, expect, it } from 'vitest'
import type { Edge } from '@xyflow/react'
import { computeConnectedSet } from '../ERDRenderer'

const mockEdges: Edge[] = [
  { id: 'orders-user_id-users', source: 'orders', target: 'users', type: 'smoothstep' },
  { id: 'orders-product_id-products', source: 'orders', target: 'products', type: 'smoothstep' },
  { id: 'reviews-user_id-users', source: 'reviews', target: 'users', type: 'smoothstep' },
]

describe('computeConnectedSet', () => {
  it('returns null when no element is hovered', () => {
    expect(computeConnectedSet(null, mockEdges)).toBeNull()
  })

  it('returns source and target nodes when edge is hovered', () => {
    const result = computeConnectedSet({ type: 'edge', id: 'orders-user_id-users' }, mockEdges)
    expect(result).not.toBeNull()
    expect(result!.edgeIds).toEqual(new Set(['orders-user_id-users']))
    expect(result!.nodeIds).toEqual(new Set(['orders', 'users']))
  })

  it('returns all connected edges and nodes when node is hovered', () => {
    const result = computeConnectedSet({ type: 'node', id: 'users' }, mockEdges)
    expect(result).not.toBeNull()
    expect(result!.edgeIds).toEqual(new Set(['orders-user_id-users', 'reviews-user_id-users']))
    expect(result!.nodeIds).toEqual(new Set(['orders', 'users', 'reviews']))
  })

  it('returns empty sets when hovered node has no connections', () => {
    const result = computeConnectedSet({ type: 'node', id: 'categories' }, mockEdges)
    expect(result).not.toBeNull()
    expect(result!.edgeIds).toEqual(new Set())
    expect(result!.nodeIds).toEqual(new Set())
  })

  it('returns empty sets when hovered edge does not exist', () => {
    const result = computeConnectedSet({ type: 'edge', id: 'nonexistent' }, mockEdges)
    expect(result).not.toBeNull()
    expect(result!.edgeIds).toEqual(new Set())
    expect(result!.nodeIds).toEqual(new Set())
  })

  it('includes the hovered node itself when it is a source', () => {
    const result = computeConnectedSet({ type: 'node', id: 'orders' }, mockEdges)
    expect(result!.nodeIds.has('orders')).toBe(true)
    expect(result!.edgeIds).toEqual(new Set(['orders-user_id-users', 'orders-product_id-products']))
    expect(result!.nodeIds).toEqual(new Set(['orders', 'users', 'products']))
  })
})
```

- [ ] **Step 3: Run tests to verify they pass**

Run: `cd /home/jason/Projects/db-weave/db-weave-app && pnpm exec vitest run src/components/__tests__/ERDRenderer.test.tsx`
Expected: All 6 tests PASS.

- [ ] **Step 4: Commit**

```bash
git add db-weave-app/src/components/ERDRenderer.tsx db-weave-app/src/components/__tests__/ERDRenderer.test.tsx
git commit -m "feat: add computeConnectedSet with tests and updated TableNodeData types"
```

---

### Task 3: Wire connectedSet into ERDRenderer component

**Files:**
- Modify: `db-weave-app/src/components/ERDRenderer.tsx`

- [ ] **Step 1: Add hoveredElement state**

Inside the `ERDRenderer` component, after `const [isLayouting, setIsLayouting] = useState(false)`, add:
```typescript
  const [hoveredElement, setHoveredElement] = useState<HoveredElement>(null)
```

- [ ] **Step 2: Add connectedSet useMemo**

After the `useEdgesState` call (line 289), add:
```typescript
  const connectedSet = useMemo(
    () => computeConnectedSet(hoveredElement, flowEdges),
    [hoveredElement, flowEdges],
  )
```

**Placement:** This MUST go after `const [flowEdges, setEdges, onEdgesChange] = useEdgesState(...)` because it depends on `flowEdges`.

- [ ] **Step 3: Verify TypeScript compiles**

Run: `cd /home/jason/Projects/db-weave/db-weave-app && pnpm exec tsc --noEmit`
Expected: No new errors.

- [ ] **Step 4: Commit**

```bash
git add db-weave-app/src/components/ERDRenderer.tsx
git commit -m "feat: wire connectedSet computation into ERDRenderer"
```

---

### Task 4: Add styled node/edge mapping and event handlers

**Files:**
- Modify: `db-weave-app/src/components/ERDRenderer.tsx`

- [ ] **Step 1: Add styled nodes computation**

After the `connectedSet` memo, add:
```typescript
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
```

- [ ] **Step 2: Add styled edges computation**

After `styledNodes`, add:
```typescript
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
```

- [ ] **Step 3: Update ReactFlow to use styled arrays and add event handlers**

In the `<ReactFlow>` JSX, change:
```typescript
        nodes={flowNodes}
        edges={flowEdges}
```
to:
```typescript
        nodes={styledNodes}
        edges={styledEdges}
```

Add these props to `<ReactFlow>`:
```typescript
        onEdgeMouseEnter={(_, edge) => setHoveredElement({ type: 'edge', id: edge.id })}
        onEdgeMouseLeave={() => setHoveredElement(null)}
        onNodeMouseEnter={(_, node) => setHoveredElement({ type: 'node', id: node.id })}
        onNodeMouseLeave={() => setHoveredElement(null)}
```

- [ ] **Step 4: Verify TypeScript compiles**

Run: `cd /home/jason/Projects/db-weave/db-weave-app && pnpm exec tsc --noEmit`
Expected: No new errors.

- [ ] **Step 5: Commit**

```bash
git add db-weave-app/src/components/ERDRenderer.tsx
git commit -m "feat: add styled node/edge mapping and hover event handlers"
```

---

### Task 5: Update TableNodeComponent to reflect highlight/dim state

**Files:**
- Modify: `db-weave-app/src/components/ERDRenderer.tsx:72-200`

- [ ] **Step 1: Update the root div className to be conditional**

Change the root div of `TableNodeComponent` (line 76) from:
```typescript
    <div className="bg-white border-2 border-gray-300 rounded-lg shadow-lg min-w-[250px] max-w-[350px] relative z-20 overflow-hidden">
```
to:
```typescript
    <div className={`bg-white border-2 rounded-lg shadow-lg min-w-[250px] max-w-[350px] relative z-20 overflow-hidden ${data.isHighlighted ? 'border-blue-500' : 'border-gray-300'}`}>
```

- [ ] **Step 2: Manually test in browser**

Run: `cd /home/jason/Projects/db-weave/db-weave-app && pnpm dev`
Test these interactions:
1. Hover over an edge — the two connected tables should get blue borders, all other tables dim to 0.25 opacity, all other edges dim to 0.15 opacity. The hovered edge should be thicker with bolder labels.
2. Hover over a table node — all connected edges and their endpoint tables highlight. Everything else dims.
3. Move mouse away — all elements return to normal instantly (no animation).
4. Hover over a table with no foreign keys — only that table stays visible, everything else dims.

- [ ] **Step 3: Commit**

```bash
git add db-weave-app/src/components/ERDRenderer.tsx
git commit -m "feat: update TableNodeComponent to show highlight/dim border state"
```

---

### Task 6: Run full test suite and verify

**Files:** None (verification only)

- [ ] **Step 1: Run all tests**

Run: `cd /home/jason/Projects/db-weave/db-weave-app && pnpm test`
Expected: All tests pass, including the new ERDRenderer tests.

- [ ] **Step 2: Run TypeScript check**

Run: `cd /home/jason/Projects/db-weave/db-weave-app && pnpm exec tsc --noEmit`
Expected: No errors.

- [ ] **Step 3: Final manual verification**

Run: `cd /home/jason/Projects/db-weave/db-weave-app && pnpm dev`
Verify all hover interactions work as specified in the design spec.
