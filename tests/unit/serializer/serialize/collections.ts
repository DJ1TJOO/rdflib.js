import { BlankNode, Collection, graph, lit, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('collections', () => {
  BlankNode.nextId = 0
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
})
