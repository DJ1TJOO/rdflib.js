import { expect } from 'chai'
import { graph, st, sym, variable } from '../../../../../src'
import { createN3Serializer } from './n3-factory'

import variableObjectToN3 from './expected/variables/object.n3'
import variablePredicateToN3 from './expected/variables/predicate.n3'
import variableSubjectToN3 from './expected/variables/subject.n3'

describe('variables', () => {
  it('should serialize a variable', () => {
    const v = variable('object')
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), v)

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(variableObjectToN3)
  })

  it('should serialize a variable as predicate', () => {
    const v = variable('predicate')
    const statement = st(sym('http://example.com/subject'), v, sym('http://example.com/object'))

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(variablePredicateToN3)
  })

  it('should serialize a variable as subject', () => {
    const v = variable('subject')
    const statement = st(v, sym('http://example.com/predicate'), sym('http://example.com/object'))

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(variableSubjectToN3)
  })
})
