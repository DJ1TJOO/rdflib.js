import { expect } from 'chai'
import { blankNode, graph, lit, sym } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('toStr', () => {
  it('should convert a simple NamedNode to string', () => {
    const store = graph()
    const serializer = createEmptySerializer(store)
    const namedNode = sym('http://example.org/test')

    const result = serializer.toStr(namedNode)
    expect(result).to.equal('<http://example.org/test>')
  })

  it('should convert a BlankNode to string', () => {
    const store = graph()
    const serializer = createEmptySerializer(store)
    const blankNodeInstance = blankNode('b1')

    const result = serializer.toStr(blankNodeInstance)
    expect(result).to.match(/^_:b1$/)
  })

  it('should convert a Literal to string', () => {
    const store = graph()
    const serializer = createEmptySerializer(store)
    const literalNode = lit('test')

    const result = serializer.toStr(literalNode)
    expect(result).to.match(/^"test"(@|(\^\^)|$)/)
  })

  it('should convert a Graph/Formula to string and remember it', () => {
    const store = graph()
    const serializer = createEmptySerializer(store)
    const formula = graph()

    const result = serializer.toStr(formula)
    expect(result).to.match(/^\{.*\}$/)
    expect(serializer.formulas[result]).to.equal(formula)
  })
})
