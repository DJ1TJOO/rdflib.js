import { expect } from 'chai'
import { graph, sym, TextTermConverter } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('symbolToN3', () => {
  let serializer: ReturnType<typeof createEmptySerializer>
  let converter: TextTermConverter

  beforeEach(() => {
    serializer = createEmptySerializer(graph())
    converter = new TextTermConverter(serializer)
  })

  it('should convert NamedNode with prefix', () => {
    serializer.setPrefix('ex', 'http://example.org/')
    const namedNode = sym('http://example.org/test')

    const result = converter.symbolToN3(namedNode)

    expect(result).to.equal('ex:test')
  })

  // @TODO(serializer-refactor): This test is not possible until disabling of makeUpPrefix via flag is implemented
  // it('should convert NamedNode without prefix to explicit URI', () => {
  //   const namedNode = sym('http://example.org/test')

  //   const result = converter.symbolToN3(namedNode)

  //   expect(result).to.equal('<http://example.org/test>')
  // })

  it('should use default namespace when set', () => {
    serializer.defaultNamespace = 'http://example.org/'
    const namedNode = sym('http://example.org/test')

    const result = converter.symbolToN3(namedNode)

    expect(result).to.equal(':test')
  })

  it('should use default namespace without colon when k flag is set', () => {
    serializer.defaultNamespace = 'http://example.org/'
    serializer.setFlags('k')
    const namedNode = sym('http://example.org/test')

    const result = converter.symbolToN3(namedNode)

    expect(result).to.equal('test')
  })

  it('should not abbreviate when p flag is set', () => {
    serializer.setPrefix('ex', 'http://example.org/')
    serializer.setFlags('p')
    const namedNode = sym('http://example.org/test')

    const result = converter.symbolToN3(namedNode)

    expect(result).to.equal('<http://example.org/test>')
  })

  it('should not abbreviate when local part contains dot and o flag is set', () => {
    serializer.setPrefix('ex', 'http://example.org/')
    serializer.setFlags('o')
    const namedNode = sym('http://example.org/test.file')

    const result = converter.symbolToN3(namedNode)

    expect(result).to.equal('<http://example.org/test.file>')
  })

  it('should make up prefix when not set', () => {
    const namedNode = sym('http://example.org/test')

    const result = converter.symbolToN3(namedNode)

    expect(result).to.match(/^[a-z]+:test$/)
  })

  it('should handle URIs with hash separator', () => {
    serializer.setPrefix('ex', 'http://example.org#')
    const namedNode = sym('http://example.org#test')

    const result = converter.symbolToN3(namedNode)

    expect(result).to.equal('ex:test')
  })

  it('should handle file: URIs', () => {
    const namedNode = sym('file:///path/to/file')

    const result = converter.symbolToN3(namedNode)

    expect(result).to.match(/^(<file:\/\/\/path\/to\/file>|[a-z]+:file)$/)
  })

  it('should handle ws: URIs', () => {
    const namedNode = sym('ws://example.org/test')

    const result = converter.symbolToN3(namedNode)

    expect(result).to.match(/^(<ws:\/\/example\.org\/test>|[a-z]+:test)$/)
  })
})
