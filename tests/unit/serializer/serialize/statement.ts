import { graph, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('should serialize a statement to', () => {
  const statement = st(
    sym('http://example.com/subject'),
    sym('http://example.com/predicate'),
    sym('http://example.com/object')
  )

  const store = graph()
  store.add(statement)

  serializeEqualMultiple(store, 'statement', ['n3', 'nt', 'rdf'])
})
