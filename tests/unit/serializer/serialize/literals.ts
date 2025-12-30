import { graph, lit, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('should serialize a literal', () => {
  describe('as a string', () => {
    const statement = st(sym('http://example.com/subject'), sym('http://example.com/predicate'), lit('some text'))

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'literal/literal', ['n3', 'nt', 'rdf'])
  })

  describe('as a multiline string', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('This is a\nmultiline string\nwith multiple lines')
    )

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'literal/multiline', ['n3', 'nt', 'rdf'])
  })

  describe('with a language tag', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('Hello World', 'en')
    )

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'literal/lang', ['n3', 'nt', 'rdf'])
  })

  describe('as an integer', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('42', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
    )

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'literal/integer', ['n3', 'nt', 'rdf'])
  })

  describe('as a decimal', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('3.14', undefined, sym('http://www.w3.org/2001/XMLSchema#decimal'))
    )

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'literal/decimal', ['n3', 'nt', 'rdf'])
  })

  describe('as a double', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('1.23', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
    )

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'literal/double', ['n3', 'nt', 'rdf'])
  })

  describe('as a boolean (true)', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('1', undefined, sym('http://www.w3.org/2001/XMLSchema#boolean'))
    )

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'literal/boolean-true', ['n3', 'nt', 'rdf'])
  })

  describe('as a boolean (false)', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('0', undefined, sym('http://www.w3.org/2001/XMLSchema#boolean'))
    )

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'literal/boolean-false', ['n3', 'nt', 'rdf'])
  })

  describe('as a dateTime', () => {
    const statement = st(
      sym('http://example.com/subject'),
      sym('http://example.com/predicate'),
      lit('2023-06-15T10:30:00Z', undefined, sym('http://www.w3.org/2001/XMLSchema#dateTime'))
    )

    const store = graph()
    store.add(statement)

    serializeEqualMultiple(store, 'literal/datetime', ['n3', 'nt', 'rdf'])
  })

  describe('double edge cases', () => {
    describe('should serialize various double formats', () => {
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

      serializeEqualMultiple(store, 'literal/double-edge-cases', ['n3', 'nt', 'rdf'])
    })
  })

  describe('special characters', () => {
    describe('should serialize literals with newlines, quotes, and multiline text', () => {
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

      serializeEqualMultiple(store, 'literal/special-chars', ['n3', 'nt', 'rdf'])
    })
  })
})
