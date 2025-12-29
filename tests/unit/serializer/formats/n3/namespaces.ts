import { expect } from 'chai'
import { graph, st, sym } from '../../../../../src'
import { createN3Serializer } from './n3-factory'

import namespaceDisableDefaultToN3 from './expected/namespaces/disable-default.n3'
import namespaceEmptyLocalToN3 from './expected/namespaces/empty-local.n3'
import namespaceIriEscapingToN3 from './expected/namespaces/iri-escaping.n3'
import namespacePrefixSelectionToN3 from './expected/namespaces/prefix-selection.n3'
import namespaceTrailingSlashToN3 from './expected/namespaces/trailing-slash.n3'
import namespaceWithBaseToN3 from './expected/namespaces/with-base.n3'
import namespaceWithoutBaseToN3 from './expected/namespaces/without-base.n3'

describe('namespaces and prefixes', () => {
  describe('with base', () => {
    it('should use default namespace when base is set', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setBase('http://example.com/')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(namespaceWithBaseToN3)
    })
  })

  describe('without base', () => {
    it('should not use default namespace when base is not set', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(namespaceWithoutBaseToN3)
    })
  })

  describe('disable prefixes', () => {
    it('should disable default namespace with d flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setBase('http://example.com/')
      serializer.setFlags('d')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(namespaceDisableDefaultToN3)
    })
  })

  describe('special cases', () => {
    it('should handle trailing slash in URI', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setPrefix('exa', 'http://example.com/')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(namespaceTrailingSlashToN3)
    })

    it('should handle empty local name', () => {
      const statement = st(
        sym('http://example.com/#'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setPrefix('exa', 'http://example.com/#')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(namespaceEmptyLocalToN3)
    })

    it('should handle IRIs needing escaping', () => {
      const statement = st(
        sym('http://example.com/subject%20with%20spaces'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(namespaceIriEscapingToN3)
    })
  })

  it('should use correct prefix for overlapping namespaces', () => {
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

    const serializer = createN3Serializer(store)
    const n3 = serializer.serialize(store.statements)
    expect(n3).to.equal(namespacePrefixSelectionToN3)
  })
})
