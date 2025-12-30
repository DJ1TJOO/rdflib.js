import { expect } from 'chai'
import { graph } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('setBase', () => {
  it('should set base URI', () => {
    const serializer = createEmptySerializer(graph())
    const base = 'http://example.org/'

    serializer.setBase(base)
    expect(serializer.base).to.equal(base)
  })

  it('should set base to null when called with null', () => {
    const serializer = createEmptySerializer(graph())
    serializer.setBase('http://example.org/')

    serializer.setBase(null)
    expect(serializer.base).to.be.null
  })

  it('should return serializer instance for chaining', () => {
    const serializer = createEmptySerializer(graph())
    const result = serializer.setBase('http://example.org/')

    expect(result).to.equal(serializer)
  })
})
