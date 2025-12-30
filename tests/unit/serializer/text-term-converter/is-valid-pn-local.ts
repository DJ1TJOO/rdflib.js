import { expect } from 'chai'
import { graph, TextTermConverter } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('isValidPNLocal', () => {
  let serializer: ReturnType<typeof createEmptySerializer>
  let converter: TextTermConverter

  beforeEach(() => {
    serializer = createEmptySerializer(graph())
    converter = new TextTermConverter(serializer)
  })

  it('should accept empty local name', () => {
    expect(converter.isValidPNLocal('')).to.be.true
  })

  it('should accept simple local name', () => {
    expect(converter.isValidPNLocal('test')).to.be.true
  })

  it('should accept local name with dots in middle', () => {
    expect(converter.isValidPNLocal('test.value')).to.be.true
  })

  it('should reject local name ending with dot', () => {
    expect(converter.isValidPNLocal('test.')).to.be.false
  })

  it('should reject local name with space', () => {
    expect(converter.isValidPNLocal('test value')).to.be.false
  })

  it('should reject local name with colon', () => {
    expect(converter.isValidPNLocal('test:value')).to.be.false
  })

  it('should reject local name with special characters', () => {
    expect(converter.isValidPNLocal('test#value')).to.be.false
    expect(converter.isValidPNLocal('test/value')).to.be.false
    expect(converter.isValidPNLocal('test?value')).to.be.false
  })

  it('should accept local name with numbers', () => {
    expect(converter.isValidPNLocal('test123')).to.be.true
  })

  it('should accept local name starting with number', () => {
    // Note: This is valid for PN_LOCAL, but not for prefix
    expect(converter.isValidPNLocal('123test')).to.be.true
  })
})
