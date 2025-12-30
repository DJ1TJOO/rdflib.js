import { graph, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

// @TODO(serializer-refactor): should this create different results?
describe('named graphs', () => {
  describe('should serialize statements in a named graph', () => {
    const graphNode = sym('http://example.com/graph')
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      sym('http://example.com/object'),
      graphNode
    )

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'named-graphs/single', ['n3', 'nt', 'rdf'])
  })

  describe('should serialize multiple statements in different graphs', () => {
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

    serializeEqualMultiple(store, 'named-graphs/multiple', ['n3', 'nt', 'rdf'])
  })
})
