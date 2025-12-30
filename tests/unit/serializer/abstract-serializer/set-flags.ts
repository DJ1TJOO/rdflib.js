import { expect } from 'chai'
import { graph } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('setFlags', () => {
  it('should set flags', () => {
    const serializer = createEmptySerializer(graph())

    serializer.setFlags('si')
    expect(serializer.flags).to.equal('si')
  })

  it('should set flags with spaces', () => {
    const serializer = createEmptySerializer(graph())

    serializer.setFlags('si dr')
    expect(serializer.flags).to.equal('si dr')
  })

  it('should set flags to empty string when called with empty string', () => {
    const serializer = createEmptySerializer(graph())
    serializer.setFlags('si')

    serializer.setFlags('')
    expect(serializer.flags).to.equal('')
  })

  it('should return serializer instance for chaining', () => {
    const serializer = createEmptySerializer(graph())
    const result = serializer.setFlags('si')

    expect(result).to.equal(serializer)
  })
})
