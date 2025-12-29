import { graph, st, sym, variable } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('variables', () => {
  describe('should serialize a variable', () => {
    const v = variable('object')
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), v)

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'variables/object', ['n3'])
  })

  describe('should serialize a variable as predicate', () => {
    const v = variable('predicate')
    const statement = st(sym('http://example.com/subject'), v, sym('http://example.com/object'))

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'variables/predicate', ['n3'])
  })

  describe('should serialize a variable as subject', () => {
    const v = variable('subject')
    const statement = st(v, sym('http://example.com/predicate'), sym('http://example.com/object'))

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'variables/subject', ['n3'])
  })
})
