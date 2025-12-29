import { expect } from 'chai'
import { graph, st, sym } from '../../../../../src'
import { createN3Serializer } from './n3-factory'

import logImpliesNoAbbrevToN3 from './expected/special-predicates/log-implies-no-abbrev.n3'
import logImpliesToN3 from './expected/special-predicates/log-implies.n3'
import owlSameasNoAbbrevToN3 from './expected/special-predicates/owl-sameas-no-abbrev.n3'
import owlSameasToN3 from './expected/special-predicates/owl-sameas.n3'
import rdfTypeNoAbbrevToN3 from './expected/special-predicates/rdf-type-no-abbrev.n3'
import rdfTypeToN3 from './expected/special-predicates/rdf-type.n3'

describe('special predicates', () => {
  describe('rdf:type', () => {
    it('should abbreviate rdf:type to "a"', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        sym('http://example.com/Type')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(rdfTypeToN3)
    })

    it('should not abbreviate rdf:type with t flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        sym('http://example.com/Type')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('t')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(rdfTypeNoAbbrevToN3)
    })
  })

  describe('owl:sameAs', () => {
    it('should abbreviate owl:sameAs to "="', () => {
      const statement = st(
        sym('http://example.com/subject1'),
        sym('http://www.w3.org/2002/07/owl#sameAs'),
        sym('http://example.com/subject2')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(owlSameasToN3)
    })

    it('should not abbreviate owl:sameAs with s flag', () => {
      const statement = st(
        sym('http://example.com/subject1'),
        sym('http://www.w3.org/2002/07/owl#sameAs'),
        sym('http://example.com/subject2')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('s')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(owlSameasNoAbbrevToN3)
    })
  })

  describe('log:implies', () => {
    it('should abbreviate log:implies to "=>"', () => {
      const statement = st(
        sym('http://example.com/antecedent'),
        sym('http://www.w3.org/2000/10/swap/log#implies'),
        sym('http://example.com/consequent')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(logImpliesToN3)
    })

    it('should not abbreviate log:implies with i flag', () => {
      const statement = st(
        sym('http://example.com/antecedent'),
        sym('http://www.w3.org/2000/10/swap/log#implies'),
        sym('http://example.com/consequent')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('i')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(logImpliesNoAbbrevToN3)
    })
  })
})
