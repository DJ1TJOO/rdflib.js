import { expect } from 'chai'
import { graph } from '../../../src'
import { createEmptySerializer } from './utils/serializer-factories'

describe('can makeUpPrefix', () => {
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
})
