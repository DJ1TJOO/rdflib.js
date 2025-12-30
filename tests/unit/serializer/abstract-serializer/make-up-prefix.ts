import { expect } from 'chai'
import { graph } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('makeUpPrefix', () => {
  it('with a simple URI', () => {
    const serializer = createEmptySerializer(graph())
    const prefix = serializer.makeUpPrefix('http://example.org')
    expect(prefix).to.equal('exa')
  })

  it('with a URI with a trailing slash', () => {
    const serializer = createEmptySerializer(graph())
    const prefix = serializer.makeUpPrefix('http://example.org/')
    expect(prefix).to.equal('exa')
  })

  it('with a URI ending with a #', () => {
    const serializer = createEmptySerializer(graph())
    const prefix = serializer.makeUpPrefix('http://example.org#')
    expect(prefix).to.equal('exa')
  })

  it('with a URI with multiple slashes', () => {
    const serializer = createEmptySerializer(graph())
    const prefix = serializer.makeUpPrefix('http://www.w3.org/ns/shacl')
    expect(prefix).to.equal('shacl')
  })

  it('with a URI with multiple slashes and a #', () => {
    const serializer = createEmptySerializer(graph())
    const prefix = serializer.makeUpPrefix('http://www.w3.org/ns/shacl#')
    expect(prefix).to.equal('shacl')
  })

  it('with a URI with multiple slashes and a #/', () => {
    const serializer = createEmptySerializer(graph())
    const prefix = serializer.makeUpPrefix('http://www.w3.org/ns/shacl#/')
    expect(prefix).to.equal('shacl')
  })

  it("with a URI starting with 'a'", () => {
    const serializer = createEmptySerializer(graph())
    const prefix = serializer.makeUpPrefix('http://aschema.org')
    expect(prefix).to.equal('asc')
  })

  it('should create unique prefixes when same base is used multiple times', () => {
    const serializer = createEmptySerializer(graph())
    const prefix1 = serializer.makeUpPrefix('http://example.org/ns1')
    const prefix2 = serializer.makeUpPrefix('http://example.org/ns2')

    expect(prefix1).to.not.equal(prefix2)
    expect(serializer.namespaces[prefix1]).to.equal('http://example.org/ns1')
    expect(serializer.namespaces[prefix2]).to.equal('http://example.org/ns2')
  })

  it('should handle URIs with no valid prefix chars', () => {
    const serializer = createEmptySerializer(graph())
    const prefix = serializer.makeUpPrefix('http://123.org/')

    expect(prefix).to.match(/^n\d+$/)
  })
})
