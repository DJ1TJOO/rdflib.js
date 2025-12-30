import { graph, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('namespaces and prefixes', () => {
  describe('with base', () => {
    describe('should use default namespace when base is set', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      // Prefixes are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'namespaces/with-base', ['n3', 'nt', 'rdf'], serializer => {
        serializer.setBase('http://example.com/')
      })
    })
  })

  describe('without base', () => {
    describe('should not use default namespace when base is not set', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      // Prefixes are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'namespaces/without-base', ['n3', 'nt', 'rdf'])
    })
  })

  describe('disable prefixes', () => {
    describe('should disable default namespace with d flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      // Prefixes are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'namespaces/disable-default', ['n3', 'nt', 'rdf'], serializer => {
        serializer.setBase('http://example.com/')
        serializer.setFlags('d')
      })
    })
  })

  describe('special cases', () => {
    describe('should handle trailing slash in URI', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/')
      )

      const store = graph()
      store.add(statement)

      // Prefixes are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'namespaces/trailing-slash', ['n3', 'nt', 'rdf'], serializer => {
        serializer.setPrefix('exa', 'http://example.com/')
      })
    })

    describe('should handle empty local name', () => {
      const statement = st(
        sym('http://example.com/#'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      // Prefixes are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'namespaces/empty-local', ['n3', 'nt', 'rdf'], serializer => {
        serializer.setPrefix('exa', 'http://example.com/#')
      })
    })

    describe('should handle IRIs needing escaping', () => {
      const statement = st(
        sym('http://example.com/subject%20with%20spaces'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      // Prefixes are N3-specific, but semantic content should serialize correctly in all formats
      serializeEqualMultiple(store, 'namespaces/iri-escaping', ['n3', 'nt', 'rdf'])
    })
  })

  describe('should use correct prefix for overlapping namespaces', () => {
    const store = graph()
    store.add(
      st(sym('http://example.com/subject'), sym('http://example.com/predicate'), sym('http://example.com/object'))
    )
    store.add(
      st(
        sym('http://example.com/more-specific/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )
    )

    // Prefixes are N3-specific, but semantic content should serialize correctly in all formats
    serializeEqualMultiple(store, 'namespaces/prefix-overlapping', ['n3', 'nt', 'rdf'])
  })
})
