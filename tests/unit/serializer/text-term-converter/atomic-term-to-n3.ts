import { expect } from 'chai'
import { blankNode, defaultGraph, graph, lit, sym, TextTermConverter, variable } from '../../../../src'
import { createEmptySerializer } from '../utils/serializer-factories'

describe('atomicTermToN3', () => {
  let serializer: ReturnType<typeof createEmptySerializer>
  let converter: TextTermConverter

  beforeEach(() => {
    serializer = createEmptySerializer(graph())
    converter = new TextTermConverter(serializer)
  })

  it('should convert BlankNode to N3', () => {
    const blankNodeInstance = blankNode('b1')
    const result = converter.atomicTermToN3(blankNodeInstance)

    expect(result).to.match(/^_:b1$/)
  })

  it('should convert Variable to N3', () => {
    const variableNode = variable('x')
    const result = converter.atomicTermToN3(variableNode)

    expect(result).to.match(/^\?x$/)
  })

  it('should convert simple Literal to N3', () => {
    const literalNode = lit('test')
    const result = converter.atomicTermToN3(literalNode)

    expect(result).to.equal('"test"')
  })

  it('should convert Literal with language tag', () => {
    const literalNode = lit('test', 'en')
    const result = converter.atomicTermToN3(literalNode)

    expect(result).to.equal('"test"@en')
  })

  it('should convert Literal with datatype', () => {
    const datatype = sym('http://www.w3.org/2001/XMLSchema#integer')
    const literalNode = lit('42', undefined, datatype)
    const result = converter.atomicTermToN3(literalNode)

    expect(result).to.equal('42')
  })

  it('should convert Literal with decimal datatype', () => {
    const datatype = sym('http://www.w3.org/2001/XMLSchema#decimal')
    const literalNode = lit('42', undefined, datatype)
    const result = converter.atomicTermToN3(literalNode)

    expect(result).to.equal('42.0')
  })

  it('should convert Literal with double datatype', () => {
    const datatype = sym('http://www.w3.org/2001/XMLSchema#double')
    const literalNode = lit('42', undefined, datatype)
    const result = converter.atomicTermToN3(literalNode)

    expect(result).to.equal('42.0e0')
  })

  it('should convert Literal with boolean datatype (true)', () => {
    const datatype = sym('http://www.w3.org/2001/XMLSchema#boolean')
    const literalNode = lit('1', undefined, datatype)
    const result = converter.atomicTermToN3(literalNode)

    expect(result).to.equal('true')
  })

  it('should convert Literal with boolean datatype (false)', () => {
    const datatype = sym('http://www.w3.org/2001/XMLSchema#boolean')
    const literalNode = lit('0', undefined, datatype)
    const result = converter.atomicTermToN3(literalNode)

    expect(result).to.equal('false')
  })

  it('should convert Literal with custom datatype', () => {
    const datatype = sym('http://example.org/custom')
    const literalNode = lit('test', undefined, datatype)
    const result = converter.atomicTermToN3(literalNode)

    expect(result).to.include('"test"')
    expect(result).to.include('^^')
  })

  it('should convert NamedNode to N3', () => {
    const namedNode = sym('http://example.org/test')
    serializer.setPrefix('ex', 'http://example.org/')

    const result = converter.atomicTermToN3(namedNode)

    expect(result).to.match(/^(ex:test|<http:\/\/example\.org\/test>)$/)
  })

  it('should convert DefaultGraph to empty string', () => {
    const defaultGraphInstance = defaultGraph()
    const result = converter.atomicTermToN3(defaultGraphInstance)

    expect(result).to.equal('')
  })

  it('should throw error for unknown term type', () => {
    const fakeNode = { termType: 'Unknown' } as any

    expect(() => {
      converter.atomicTermToN3(fakeNode)
    }).to.throw('Internal: atomicTermToN3 cannot handle')
  })

  it('should throw error for non-string literal value', () => {
    const fakeNode = {
      termType: 'Literal',
      value: 123,
      datatype: null,
      language: null
    } as any

    expect(() => {
      converter.atomicTermToN3(fakeNode)
    }).to.throw('Value of RDF literal node must be a string')
  })
})
