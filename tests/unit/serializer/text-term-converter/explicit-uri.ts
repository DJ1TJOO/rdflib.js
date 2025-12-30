import { expect } from 'chai'
import { graph, TextTermConverter } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('explicitURI', () => {
  let serializer: ReturnType<typeof createEmptySerializer>
  let converter: TextTermConverter

  beforeEach(() => {
    serializer = createEmptySerializer(graph())
    converter = new TextTermConverter(serializer)
  })

  it('should wrap URI in angle brackets', () => {
    const result = converter.explicitURI('http://example.org/test')

    expect(result).to.equal('<http://example.org/test>')
  })

  it('should make URI relative to base when r flag is not set', () => {
    serializer.setBase('http://example.org/')
    const result = converter.explicitURI('http://example.org/test')

    // @TODO(serializer-refactor): Should this not be <test>?
    expect(result).to.equal('</test>')
  })

  it('should not make URI relative when r flag is set', () => {
    serializer.setBase('http://example.org/')
    serializer.setFlags('r')
    const result = converter.explicitURI('http://example.org/test')

    expect(result).to.equal('<http://example.org/test>')
  })

  it('should encode unicode when u flag is set', () => {
    serializer.setFlags('u')
    const result = converter.explicitURI('http://example.org/test\u00A0')

    expect(result).to.include('\\u00a0')
  })

  it('should hex encode URI by default', () => {
    const result = converter.explicitURI('http://example.org/test space')

    expect(result).to.include('test%20space')
  })
})
