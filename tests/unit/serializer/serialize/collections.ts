import { blankNode, BlankNode, Collection, graph, lit, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('collections', () => {
  before(() => {
    BlankNode.nextId = 0
  })
  afterEach(() => {
    BlankNode.nextId = 0
  })

  describe('should serialize a collection with literals', () => {
    const collection = new Collection([lit('item1'), lit('item2'), lit('item3')])
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), collection)

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'collections/literals', ['n3', 'nt', 'rdf'])
  })

  describe('should serialize a collection with mixed types', () => {
    const collection = new Collection([
      lit('item1'),
      sym('http://example.com/item2'),
      lit('42', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
    ])
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), collection)

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'collections/mixed', ['n3', 'nt', 'rdf'])
  })

  describe('should serialize an empty collection', () => {
    const collection = new Collection([])
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), collection)

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'collections/empty', ['n3', 'nt', 'rdf'])
  })

  describe('should serialize a collection with nested collections', () => {
    const nestedCollection = new Collection([lit('nested1'), lit('nested2')])
    const collection = new Collection([lit('item1'), nestedCollection, lit('item3')])
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), collection)

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'collections/nested', ['n3', 'nt', 'rdf'])
  })

  describe('should serialize a collection with bnodes', () => {
    const bnode1 = blankNode('b1')
    const bnode2 = blankNode('b2')
    const collection = new Collection([bnode1, bnode2])
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), collection)
    const statement2 = st(sym('http://example.com/subject2'), sym('http://example.com/predicate2'), bnode2)
    const statement3 = st(bnode1, sym('http://example.com/predicate3'), sym('http://example.com/object'))
    const statement4 = st(bnode2, sym('http://example.com/predicate4'), sym('http://example.com/object2'))

    const store = graph()
    store.add(statement)
    store.add(statement2)
    store.add(statement3)
    store.add(statement4)

    serializeEqualMultiple(store, 'collections/bnodes', ['n3', 'nt', 'rdf'])
  })
})
