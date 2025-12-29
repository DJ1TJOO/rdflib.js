import { expect } from 'chai'
import { graph, lit, st, sym } from '../../../../../src'
import { createN3Serializer } from './n3-factory'

import literalBooleanFalseToN3 from './expected/literal/boolean-false.n3'
import literalBooleanTrueToN3 from './expected/literal/boolean-true.n3'
import literalDateTimeToN3 from './expected/literal/datetime.n3'
import literalDecimalToN3 from './expected/literal/decimal.n3'
import literalDoubleEdgeCasesToN3 from './expected/literal/double-edge-cases.n3'
import literalDoubleToN3 from './expected/literal/double.n3'
import literalIntegerToN3 from './expected/literal/integer.n3'
import literalLangToN3 from './expected/literal/lang.n3'
import literalToN3 from './expected/literal/literal.n3'
import literalMultilineToN3 from './expected/literal/multiline.n3'
import literalSpecialCharsToN3 from './expected/literal/special-chars.n3'

describe('should serialize a literal', () => {
  it('as a string', () => {
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), lit('some text'))

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(literalToN3)
  })

  it('as a multiline string', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('This is a\nmultiline string\nwith multiple lines')
    )

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(literalMultilineToN3)
  })

  it('with a language tag', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('Hello World', 'en')
    )

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(literalLangToN3)
  })

  it('as an integer', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('42', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
    )

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(literalIntegerToN3)
  })

  it('as a decimal', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('3.14', undefined, sym('http://www.w3.org/2001/XMLSchema#decimal'))
    )

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(literalDecimalToN3)
  })

  it('as a double', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('1.23', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
    )

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(literalDoubleToN3)
  })

  it('as a boolean (true)', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('1', undefined, sym('http://www.w3.org/2001/XMLSchema#boolean'))
    )

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(literalBooleanTrueToN3)
  })

  it('as a boolean (false)', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('0', undefined, sym('http://www.w3.org/2001/XMLSchema#boolean'))
    )

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(literalBooleanFalseToN3)
  })

  it('as a dateTime', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('2023-06-15T10:30:00Z', undefined, sym('http://www.w3.org/2001/XMLSchema#dateTime'))
    )

    const store = graph()
    store.add(statement)

    const n3 = createN3Serializer(store).serialize(store.statements)
    expect(n3).to.equal(literalDateTimeToN3)
  })

  describe('double edge cases', () => {
    it('should serialize various double formats', () => {
      const store = graph()
      store.add(
        st(
          sym('http://example.com/subject'),
          sym('http://example.com/predicate'),
          lit('0.123', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
        )
      )
      store.add(
        st(
          sym('http://example.com/subject2'),
          sym('http://example.com/predicate'),
          lit('123', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
        )
      )
      store.add(
        st(
          sym('http://example.com/subject3'),
          sym('http://example.com/predicate'),
          lit('0.123e2', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
        )
      )
      store.add(
        st(
          sym('http://example.com/subject4'),
          sym('http://example.com/predicate'),
          lit('0.123e-2', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
        )
      )
      store.add(
        st(
          sym('http://example.com/subject5'),
          sym('http://example.com/predicate'),
          lit('0.123E2', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
        )
      )
      store.add(
        st(
          sym('http://example.com/subject6'),
          sym('http://example.com/predicate'),
          lit('123e2', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
        )
      )
      store.add(
        st(
          sym('http://example.com/subject7'),
          sym('http://example.com/predicate'),
          lit('123e-2', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
        )
      )

      const n3 = createN3Serializer(store).serialize(store.statements)
      expect(n3).to.equal(literalDoubleEdgeCasesToN3)
    })
  })

  describe('special characters', () => {
    it('should serialize literals with newlines, quotes, and multiline text', () => {
      const store = graph()
      store.add(st(sym('http://example.com/subject'), sym('http://example.com/predicate'), lit('text with\nnewline')))
      store.add(st(sym('http://example.com/subject2'), sym('http://example.com/predicate'), lit('text with "quotes"')))
      store.add(
        st(
          sym('http://example.com/subject3'),
          sym('http://example.com/predicate'),
          lit('multiline\ntext\nwith\nnewlines')
        )
      )

      const n3 = createN3Serializer(store).serialize(store.statements)
      expect(n3).to.equal(literalSpecialCharsToN3)
    })
  })
})
