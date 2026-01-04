import { BlankNode, blankNode, graph, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('blank nodes', () => {
  BlankNode.nextId = 0
  afterEach(() => {
    BlankNode.nextId = 0
  })

  describe('should serialize a blank node as subject', () => {
    const bnode = blankNode('b1')
    const statement = st(bnode, sym('http://example.com/predicate'), sym('http://example.com/object'))

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'blank-nodes/subject', ['n3', 'nt', 'rdf'])
  })

  describe('should serialize a blank node as object', () => {
    const bnode = blankNode('b2')
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), bnode)

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'blank-nodes/object', ['n3', 'nt', 'rdf'])
  })

  describe('should serialize an anonymous blank node', () => {
    const bnode = blankNode()
    const statement = st(bnode, sym('http://example.com/predicate'), sym('http://example.com/object'))

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'blank-nodes/anonymous', ['n3', 'nt', 'rdf'])
  })

  describe('should serialize nested blank nodes', () => {
    const bnode1 = blankNode('b1')
    const bnode2 = blankNode('b2')
    const store = graph()
    store.add(st(bnode1, sym('http://example.com/predicate1'), sym('http://example.com/object1')))
    store.add(st(bnode1, sym('http://example.com/predicate2'), bnode2))
    store.add(st(bnode2, sym('http://example.com/predicate3'), sym('http://example.com/object2')))

    serializeEqualMultiple(store, 'blank-nodes/nested', ['n3', 'nt', 'rdf'])
  })

  describe('should serialize bnodes with multiple incoming arcs', () => {
    const bnode1 = blankNode('b1')
    const bnode2 = blankNode('b2')
    const store = graph()
    store.add(st(sym('http://example.com/subject1'), sym('http://example.com/predicate'), bnode1))
    store.add(st(sym('http://example.com/subject2'), sym('http://example.com/predicate'), bnode1))
    store.add(st(bnode1, sym('http://example.com/predicate2'), bnode2))

    serializeEqualMultiple(store, 'blank-nodes/multiple-incoming-arcs', ['n3', 'nt', 'rdf'])
  })
})
