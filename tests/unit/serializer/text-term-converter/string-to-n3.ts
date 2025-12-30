import { expect } from 'chai'
import { graph, TextTermConverter } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('stringToN3', () => {
  let serializer: ReturnType<typeof createEmptySerializer>
  let converter: TextTermConverter

  beforeEach(() => {
    serializer = createEmptySerializer(graph())
    converter = new TextTermConverter(serializer)
  })

  it('should escape simple string', () => {
    const result = converter.stringToN3('test')

    expect(result).to.equal('"test"')
  })

  it('should escape double quotes', () => {
    const result = converter.stringToN3('test"value')

    expect(result).to.equal('"test\\"value"')
  })

  it('should escape backslashes', () => {
    const result = converter.stringToN3('test\\value')

    expect(result).to.equal('"test\\\\value"')
  })

  it('should escape newlines', () => {
    const result = converter.stringToN3('test\nvalue')

    expect(result).to.equal('"test\\nvalue"')
  })

  it('should escape tabs', () => {
    const result = converter.stringToN3('test\tvalue')

    expect(result).to.equal('"test\\tvalue"')
  })

  it('should use triple quotes for long strings with newlines', () => {
    const longString = 'a'.repeat(21) + '\n' + 'b'.repeat(10)
    const result = converter.stringToN3(longString)

    expect(result).to.match(/^"""(?s:.)*"""$/)
  })

  it('should use triple quotes for strings with quotes', () => {
    const stringWithQuotes = 'a'.repeat(21) + '"' + 'b'.repeat(10)
    const result = converter.stringToN3(stringWithQuotes)

    expect(result).to.match(/^"""(?s:.)*"""$/)
  })

  it('should not use triple quotes when n flag is set', () => {
    serializer.setFlags('n')
    const longString = 'a'.repeat(21) + '\n' + 'b'.repeat(10)
    const result = converter.stringToN3(longString)

    expect(result).to.match(/^".*\\n.*"$/)
  })

  it('should escape unicode characters when e flag is set', () => {
    serializer.setFlags('e')
    const result = converter.stringToN3('test\u00A0value')

    expect(result).to.include('\\u00a0')
  })

  it('should not escape unicode when e flag is not set', () => {
    serializer.setFlags('z') // @TODO(serializer-refactor): When flags is empty '', e is default, this should be fixed, inversing the flag
    const result = converter.stringToN3('test\u00A0value')

    expect(result).to.include('\u00A0')
  })

  it('should handle empty string', () => {
    const result = converter.stringToN3('')

    expect(result).to.equal('""')
  })

  it('should escape carriage return', () => {
    const result = converter.stringToN3('test\rvalue')

    expect(result).to.equal('"test\\rvalue"')
  })

  it('should escape form feed', () => {
    const result = converter.stringToN3('test\fvalue')

    expect(result).to.equal('"test\\fvalue"')
  })
})
