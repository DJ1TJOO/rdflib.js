import { expect } from 'chai'
import { graph } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('prefixes', () => {
  describe('setNamespaces', () => {
    it('should set multiple namespaces', () => {
      const serializer = createEmptySerializer(graph())
      const namespaces = {
        ex: 'http://example.org/',
        foaf: 'http://xmlns.com/foaf/0.1/'
      }

      serializer.setNamespaces(namespaces)

      expect(serializer.namespaces['ex']).to.equal('http://example.org/')
      expect(serializer.namespaces['foaf']).to.equal('http://xmlns.com/foaf/0.1/')
      expect(serializer.prefixes['http://example.org/']).to.equal('ex')
      expect(serializer.prefixes['http://xmlns.com/foaf/0.1/']).to.equal('foaf')
    })

    it('should return serializer instance for chaining', () => {
      const serializer = createEmptySerializer(graph())
      const result = serializer.setNamespaces({ ex: 'http://example.org/' })

      expect(result).to.equal(serializer)
    })
  })

  describe('setPrefix', () => {
    it('should set a prefix for a namespace', () => {
      const serializer = createEmptySerializer(graph())

      serializer.setPrefix('ex', 'http://example.org/')

      expect(serializer.namespaces['ex']).to.equal('http://example.org/')
      expect(serializer.prefixes['http://example.org/']).to.equal('ex')
    })

    it('should override existing prefix for same namespace', () => {
      const serializer = createEmptySerializer(graph())
      serializer.setPrefix('ex', 'http://example.org/')

      serializer.setPrefix('example', 'http://example.org/')

      expect(serializer.namespaces['example']).to.equal('http://example.org/')
      expect(serializer.prefixes['http://example.org/']).to.equal('example')

      // @TODO(serializer-refactor): This test is broken until changes made in the abstract-serializer.ts file, see L127
      // expect(serializer.namespaces['ex']).to.be.undefined
    })

    it('should remove existing mapping when setting new prefix', () => {
      const serializer = createEmptySerializer(graph())
      serializer.setPrefix('ex', 'http://example.org/')
      serializer.setPrefix('ex', 'http://other.org/')

      expect(serializer.namespaces['ex']).to.equal('http://other.org/')
      expect(serializer.prefixes['http://example.org/']).to.be.undefined
      expect(serializer.prefixes['http://other.org/']).to.equal('ex')
    })

    it('should ignore prefixes starting with "default"', () => {
      const serializer = createEmptySerializer(graph())

      serializer.setPrefix('default1', 'http://example.org/')

      expect(serializer.namespaces['default1']).to.be.undefined
    })

    it('should ignore prefixes starting with "ns"', () => {
      const serializer = createEmptySerializer(graph())

      serializer.setPrefix('ns1', 'http://example.org/')

      expect(serializer.namespaces['ns1']).to.be.undefined
    })

    it('should ignore empty prefix or URI', () => {
      const serializer = createEmptySerializer(graph())

      serializer.setPrefix('', 'http://example.org/')
      serializer.setPrefix('ex', '')

      expect(serializer.namespaces['']).to.be.undefined
      expect(serializer.prefixes['']).to.be.undefined
    })
  })

  describe('suggestPrefix', () => {
    it('should suggest a prefix for a namespace', () => {
      const serializer = createEmptySerializer(graph())

      serializer.suggestPrefix('ex', 'http://example.org/')

      expect(serializer.namespaces['ex']).to.equal('http://example.org/')
      expect(serializer.prefixes['http://example.org/']).to.equal('ex')
    })

    it('should not override existing prefix', () => {
      const serializer = createEmptySerializer(graph())
      serializer.setPrefix('ex', 'http://example.org/')

      serializer.suggestPrefix('example', 'http://example.org/')

      expect(serializer.namespaces['ex']).to.equal('http://example.org/')
      expect(serializer.namespaces['example']).to.be.undefined
    })

    it('should not override existing namespace', () => {
      const serializer = createEmptySerializer(graph())
      serializer.setPrefix('ex', 'http://example.org/')

      serializer.suggestPrefix('ex', 'http://other.org/')

      expect(serializer.namespaces['ex']).to.equal('http://example.org/')
      expect(serializer.prefixes['http://other.org/']).to.be.undefined
    })

    it('should ignore prefixes starting with "default"', () => {
      const serializer = createEmptySerializer(graph())

      serializer.suggestPrefix('default1', 'http://example.org/')

      expect(serializer.namespaces['default1']).to.be.undefined
    })

    it('should ignore prefixes starting with "ns"', () => {
      const serializer = createEmptySerializer(graph())

      serializer.suggestPrefix('ns1', 'http://example.org/')

      expect(serializer.namespaces['ns1']).to.be.undefined
    })
  })

  describe('suggestNamespaces', () => {
    it('should suggest multiple namespaces', () => {
      const serializer = createEmptySerializer(graph())
      const namespaces = {
        ex: 'http://example.org/',
        foaf: 'http://xmlns.com/foaf/0.1/'
      }

      serializer.suggestNamespaces(namespaces)

      expect(serializer.namespaces['ex']).to.equal('http://example.org/')
      expect(serializer.namespaces['foaf']).to.equal('http://xmlns.com/foaf/0.1/')
    })

    it('should return serializer instance for chaining', () => {
      const serializer = createEmptySerializer(graph())
      const result = serializer.suggestNamespaces({ ex: 'http://example.org/' })

      expect(result).to.equal(serializer)
    })
  })
})
