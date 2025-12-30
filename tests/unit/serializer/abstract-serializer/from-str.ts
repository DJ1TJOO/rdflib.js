import { expect } from 'chai'
import { blankNode, graph, lit, NamedNode, sym } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('fromStr', () => {
  it('should convert a simple NamedNode string to node', () => {
    const store = graph()
    const serializer = createEmptySerializer(store)
    const subject = sym('http://example.org/test')
    store.add(subject, sym('http://example.org/pred'), lit('value'))

    const nodeString = serializer.toStr(subject)
    const result = serializer.fromStr(nodeString)

    expect(result.termType).to.equal('NamedNode')
    expect((result as NamedNode).uri).to.equal('http://example.org/test')
  })

  it('should convert a BlankNode string to node', () => {
    const store = graph()
    const serializer = createEmptySerializer(store)
    const subject = blankNode('b1')
    store.add(subject, sym('http://example.org/pred'), lit('value'))

    const nodeString = serializer.toStr(subject)
    const result = serializer.fromStr(nodeString)

    expect(result.termType).to.equal('BlankNode')
  })

  it('should convert a Graph/Formula string to formula', () => {
    const store = graph()
    const serializer = createEmptySerializer(store)
    const formula = graph()
    formula.add(sym('http://example.org/s'), sym('http://example.org/p'), lit('o'))

    const formulaString = serializer.toStr(formula)
    const result = serializer.fromStr(formulaString)

    expect(result.termType).to.equal('Graph')
    expect(result).to.equal(formula)
  })

  it('should throw error for unknown formula string', () => {
    const store = graph()
    const serializer = createEmptySerializer(store)

    expect(() => {
      serializer.fromStr('{unknown}')
    }).to.throw('No formula object for {unknown}')
  })
})
