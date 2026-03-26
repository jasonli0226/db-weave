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

  it('returns hovered node in nodeIds even when it has no connections', () => {
    const result = computeConnectedSet({ type: 'node', id: 'categories' }, mockEdges)
    expect(result).not.toBeNull()
    expect(result!.edgeIds).toEqual(new Set())
    expect(result!.nodeIds).toEqual(new Set(['categories']))
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
