import { expect } from 'chai'
import { graph, lit, st, sym } from '../../../../../src'
import { createN3Serializer } from './n3-factory'

import multipleObjectsToN3 from './expected/multiple-statements/multiple-objects.n3'
import multiplePredicatesToN3 from './expected/multiple-statements/multiple-predicates.n3'
import multipleStatementsToN3 from './expected/multiple-statements/multiple-statements.n3'

describe('multiple predicates', () => {
  it('should serialize multiple predicates for same subject', () => {
    const subject = sym('http://example.com/subject')
    const store = graph()
    store.add(st(subject, sym('http://example.com/predicate1'), sym('http://example.com/object1')))
    store.add(st(subject, sym('http://example.com/predicate2'), sym('http://example.com/object2')))
    store.add(st(subject, sym('http://example.com/predicate3'), lit('value')))

    const serializer = createN3Serializer(store)
    const n3 = serializer.serialize(store.statements)
    expect(n3).to.equal(multiplePredicatesToN3)
  })
})

describe('multiple objects', () => {
  it('should serialize multiple objects for same predicate', () => {
    const subject = sym('http://example.com/subject')
    const predicate = sym('http://example.com/predicate')
    const store = graph()
    store.add(st(subject, predicate, sym('http://example.com/object1')))
    store.add(st(subject, predicate, sym('http://example.com/object2')))
    store.add(st(subject, predicate, lit('value')))

    const serializer = createN3Serializer(store)
    const n3 = serializer.serialize(store.statements)
    expect(n3).to.equal(multipleObjectsToN3)
  })
})

describe('multiple statements', () => {
  it('should serialize multiple independent statements', () => {
    const store = graph()
    store.add(
      st(sym('http://example.com/subject1'), sym('http://example.com/predicate1'), sym('http://example.com/object1'))
    )
    store.add(
      st(sym('http://example.com/subject2'), sym('http://example.com/predicate2'), sym('http://example.com/object2'))
    )
    store.add(st(sym('http://example.com/subject3'), sym('http://example.com/predicate3'), lit('value')))

    const serializer = createN3Serializer(store)
    const n3 = serializer.serialize(store.statements)
    expect(n3).to.equal(multipleStatementsToN3)
  })
})
