import { expect } from 'chai'
import { AbstractSerializer, graph } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('constructor', () => {
  it('should initialize with default values', () => {
    const store = graph()
    const serializer = createEmptySerializer(store)

    expect(serializer.flags).to.equal('')
    expect(serializer.base).to.be.null
    expect(serializer.defaultNamespace).to.be.null
    expect(serializer.namespacesUsed).to.deep.equal(new Map())
    expect(serializer.formulas).to.deep.equal({})
    expect(serializer.store).to.equal(store)
  })

  it('should suggest rdf and xml prefixes', () => {
    const serializer = createEmptySerializer(graph())

    expect(serializer.prefixes['http://www.w3.org/1999/02/22-rdf-syntax-ns#']).to.equal('rdf')
    expect(serializer.namespaces['rdf']).to.equal('http://www.w3.org/1999/02/22-rdf-syntax-ns#')

    expect(serializer.prefixes['reserved:reservedForFutureUse']).to.equal('xml')
    expect(serializer.namespaces['xml']).to.equal('reserved:reservedForFutureUse')
  })

  it('should have prefixchars containing all a-zA-Z', () => {
    const expectedChars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    expect(AbstractSerializer.prefixchars).to.equal(expectedChars)

    for (let i = 0; i < expectedChars.length; i++) {
      expect(AbstractSerializer.prefixchars.indexOf(expectedChars[i])).to.be.at.least(0)
    }
  })
})
