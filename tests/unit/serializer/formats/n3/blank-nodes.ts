import { expect } from 'chai'
import { blankNode, graph, st, sym } from '../../../../../src'
import { createN3Serializer } from './n3-factory'

import blankNodeAnonymousToN3 from './expected/blank-nodes/anonymous.n3'
import blankNodeNestedToN3 from './expected/blank-nodes/nested.n3'
import blankNodeObjectToN3 from './expected/blank-nodes/object.n3'
import blankNodeSubjectToN3 from './expected/blank-nodes/subject.n3'

describe('blank nodes', () => {
  it('should serialize a blank node as subject', () => {
    const bnode = blankNode('b1')
    const statement = st(bnode, sym('http://example.com/predicate'), sym('http://example.com/object'))

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(blankNodeSubjectToN3)
  })

  it('should serialize a blank node as object', () => {
    const bnode = blankNode('b2')
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), bnode)

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(blankNodeObjectToN3)
  })

  it('should serialize an anonymous blank node', () => {
    const bnode = blankNode()
    const statement = st(bnode, sym('http://example.com/predicate'), sym('http://example.com/object'))

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(blankNodeAnonymousToN3)
  })

  it('should serialize nested blank nodes', () => {
    const bnode1 = blankNode('b1')
    const bnode2 = blankNode('b2')
    const store = graph()
    store.add(st(bnode1, sym('http://example.com/predicate1'), sym('http://example.com/object1')))
    store.add(st(bnode1, sym('http://example.com/predicate2'), bnode2))
    store.add(st(bnode2, sym('http://example.com/predicate3'), sym('http://example.com/object2')))

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(blankNodeNestedToN3)
  })
})
