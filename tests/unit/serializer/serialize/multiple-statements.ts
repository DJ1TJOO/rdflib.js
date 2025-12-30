import { graph, lit, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('multiple predicates', () => {
  describe('should serialize multiple predicates for same subject', () => {
    const subject = sym('http://example.com/subject')
    const store = graph()
    store.add(st(subject, sym('http://example.com/predicate1'), sym('http://example.com/object1')))
    store.add(st(subject, sym('http://example.com/predicate2'), sym('http://example.com/object2')))
    store.add(st(subject, sym('http://example.com/predicate3'), lit('value')))

    serializeEqualMultiple(store, 'multiple-statements/multiple-predicates', ['n3', 'nt', 'rdf'])
  })
})

describe('multiple objects', () => {
  describe('should serialize multiple objects for same predicate', () => {
    const subject = sym('http://example.com/subject')
    const predicate = sym('http://example.com/predicate')
    const store = graph()
    store.add(st(subject, predicate, sym('http://example.com/object1')))
    store.add(st(subject, predicate, sym('http://example.com/object2')))
    store.add(st(subject, predicate, lit('value')))

    serializeEqualMultiple(store, 'multiple-statements/multiple-objects', ['n3', 'nt', 'rdf'])
  })
})

describe('multiple statements', () => {
  describe('should serialize multiple independent statements', () => {
    const store = graph()
    store.add(
      st(sym('http://example.com/subject1'), sym('http://example.com/predicate1'), sym('http://example.com/object1'))
    )
    store.add(
      st(sym('http://example.com/subject2'), sym('http://example.com/predicate2'), sym('http://example.com/object2'))
    )
    store.add(st(sym('http://example.com/subject3'), sym('http://example.com/predicate3'), lit('value')))

    serializeEqualMultiple(store, 'multiple-statements/multiple-statements', ['n3', 'nt', 'rdf'])
  })
})
