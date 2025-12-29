import { expect } from 'chai'
import { Collection, graph, lit, st, sym } from '../../../../../src'
import { createN3Serializer } from './n3-factory'

import collectionEmptyToN3 from './expected/collections/empty.n3'
import collectionLiteralsToN3 from './expected/collections/literals.n3'
import collectionMixedToN3 from './expected/collections/mixed.n3'

describe('collections', () => {
  it('should serialize a collection with literals', () => {
    const collection = new Collection([lit('item1'), lit('item2'), lit('item3')])
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), collection)

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(collectionLiteralsToN3)
  })

  it('should serialize a collection with mixed types', () => {
    const collection = new Collection([
      lit('item1'),
      sym('http://example.com/item2'),
      lit('42', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
    ])
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), collection)

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(collectionMixedToN3)
  })

  it('should serialize an empty collection', () => {
    const collection = new Collection([])
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), collection)

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(collectionEmptyToN3)
  })
})
