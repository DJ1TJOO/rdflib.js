import { graph, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('special predicates', () => {
  describe('rdf:type', () => {
    describe('should abbreviate rdf:type to "a"', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        sym('http://example.com/Type')
      )

      const store = graph()
      store.add(statement)

      // Abbreviations (a, =, =>) are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'special-predicates/rdf-type', ['n3', 'nt', 'rdf'])
    })

    describe('should not abbreviate rdf:type with t flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        sym('http://example.com/Type')
      )

      const store = graph()
      store.add(statement)

      // Abbreviations are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'special-predicates/rdf-type-no-abbrev', ['n3', 'nt', 'rdf'], serializer => {
        serializer.setFlags('t')
      })
    })
  })

  describe('owl:sameAs', () => {
    describe('should abbreviate owl:sameAs to "="', () => {
      const statement = st(
        sym('http://example.com/subject1'),
        sym('http://www.w3.org/2002/07/owl#sameAs'),
        sym('http://example.com/subject2')
      )

      const store = graph()
      store.add(statement)

      // Abbreviations (a, =, =>) are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'special-predicates/owl-sameas', ['n3', 'nt', 'rdf'])
    })

    describe('should not abbreviate owl:sameAs with s flag', () => {
      const statement = st(
        sym('http://example.com/subject1'),
        sym('http://www.w3.org/2002/07/owl#sameAs'),
        sym('http://example.com/subject2')
      )

      const store = graph()
      store.add(statement)

      // Abbreviations are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'special-predicates/owl-sameas-no-abbrev', ['n3', 'nt', 'rdf'], serializer => {
        serializer.setFlags('s')
      })
    })
  })

  describe('log:implies', () => {
    describe('should abbreviate log:implies to "=>"', () => {
      const statement = st(
        sym('http://example.com/antecedent'),
        sym('http://www.w3.org/2000/10/swap/log#implies'),
        sym('http://example.com/consequent')
      )

      const store = graph()
      store.add(statement)

      // Abbreviations (a, =, =>) are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'special-predicates/log-implies', ['n3', 'nt', 'rdf'])
    })

    describe('should not abbreviate log:implies with i flag', () => {
      const statement = st(
        sym('http://example.com/antecedent'),
        sym('http://www.w3.org/2000/10/swap/log#implies'),
        sym('http://example.com/consequent')
      )

      const store = graph()
      store.add(statement)

      // Abbreviations are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'special-predicates/log-implies-no-abbrev', ['n3', 'nt', 'rdf'], serializer => {
        serializer.setFlags('i')
      })
    })
  })
})
