import { expect } from 'chai'
import { graph, st, sym } from '../../../../../src'
import { createN3Serializer } from './n3-factory'

import statementToN3 from './expected/statement.n3'

it('should serialize a statement to n3', () => {
  const statement = st(
    sym('http://example.com/subject'),
    sym('http://example.com/predicate'),
    sym('http://example.com/object')
  )

  const store = graph()
  store.add(statement)

  const n3 = createN3Serializer(store).serialize(store.statements)
  expect(n3).to.equal(statementToN3)
})
