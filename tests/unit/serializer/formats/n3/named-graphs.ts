import { expect } from 'chai'
import { graph, st, sym } from '../../../../../src'
import { createN3Serializer } from './n3-factory'

import namedGraphMultipleToN3 from './expected/named-graphs/multiple.n3'
import namedGraphSingleToN3 from './expected/named-graphs/single.n3'

// @TODO(serializer-refactor): should this create different results?
describe('named graphs', () => {
  it('should serialize statements in a named graph', () => {
    const graphNode = sym('http://example.com/graph')
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      sym('http://example.com/object'),
      graphNode
    )

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(namedGraphSingleToN3)
  })

  it('should serialize multiple statements in different graphs', () => {
    const graph1 = sym('http://example.com/graph1')
    const graph2 = sym('http://example.com/graph2')
    const store = graph()
    store.add(
      st(
        sym('http://example.com/subject1'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object1'),
        graph1
      )
    )
    store.add(
      st(
        sym('http://example.com/subject2'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object2'),
        graph2
      )
    )

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(namedGraphMultipleToN3)
  })
})
