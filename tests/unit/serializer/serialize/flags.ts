import { graph, lit, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('flags', () => {
  describe('x flag - suppress native numbers', () => {
    describe('should serialize integers as strings with x flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('42', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/x-flag', ['n3'], serializer => {
        serializer.setFlags('x')
      })
    })

    describe('should serialize doubles as strings with x flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('1.23', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/x-flag-double', ['n3'], serializer => {
        serializer.setFlags('x')
      })
    })

    describe('should serialize decimals as strings with x flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('3.14', undefined, sym('http://www.w3.org/2001/XMLSchema#decimal'))
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/x-flag-decimal', ['n3'], serializer => {
        serializer.setFlags('x')
      })
    })

    describe('should serialize booleans as strings with x flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('1', undefined, sym('http://www.w3.org/2001/XMLSchema#boolean'))
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/x-flag-boolean', ['n3'], serializer => {
        serializer.setFlags('x')
      })
    })
  })

  describe('n flag - force single line', () => {
    describe('should force single line strings with n flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('multiline\ntext\nwith\nnewlines')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/n-flag', ['n3'], serializer => {
        serializer.setFlags('n')
      })
    })
  })

  describe('e flag - unicode escaping', () => {
    describe('should escape unicode characters with e flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('text with émoji 🎉')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/e-flag', ['n3'], serializer => {
        serializer.setFlags('e')
      })
    })
  })

  describe('r flag - relative URIs', () => {
    describe('should not use relative URIs with r flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/r-flag', ['n3'], serializer => {
        serializer.setBase('http://example.com/')
        serializer.setFlags('r')
      })
    })
  })

  // @TODO(serializer-refactor): This test is not possible until disabling of makeUpPrefix via flag is implemented
  // describe('u flag - unicode encoding NTriples style', () => {
  //   it('should use unicode encoding with u flag', () => {
  //     const statement = st(
  //       sym('http://example.com/café'),
  //       sym('http://example.com/niño'),
  //       sym('http://example.com/résumé')
  //     )

  //     const store = graph()
  //     store.add(statement)

  //     const serializer = new N3Serializer(store)
  //     serializer.setFlags('u')
  //     const n3 = serializer.serialize(store.statements)
  //     expect(n3).to.equal(flagUToN3)
  //   })
  // })

  describe('o flag - no abbreviation with dots', () => {
    describe('should not abbreviate URIs with dots in local name with o flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object.with.dots')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/o-flag', ['n3'], serializer => {
        serializer.setPrefix('exa', 'http://example.com/')
        serializer.setFlags('o')
      })
    })
  })

  describe('s flag - suppress sameAs abbreviation', () => {
    describe('should not abbreviate owl:sameAs to = with s flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://www.w3.org/2002/07/owl#sameAs'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/s-flag', ['n3'], serializer => {
        serializer.setPrefix('exa', 'http://example.com/')
        serializer.setFlags('s')
      })
    })
  })

  describe('t flag - suppress type abbreviation', () => {
    describe('should not abbreviate rdf:type to a with t flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/t-flag', ['n3'], serializer => {
        serializer.setPrefix('exa', 'http://example.com/')
        serializer.setFlags('t')
      })
    })
  })

  describe('i flag - suppress implies abbreviation', () => {
    describe('should not abbreviate log:implies to => with i flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://www.w3.org/2000/10/swap/log#implies'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/i-flag', ['n3'], serializer => {
        serializer.setPrefix('exa', 'http://example.com/')
        serializer.setFlags('i')
      })
    })
  })

  describe('d flag - suppress default namespace prefix', () => {
    describe('should not use default namespace prefix with d flag', () => {
      const statement = st(
        sym('http://example.com/#subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/d-flag', ['n3'], serializer => {
        serializer.setBase('http://example.com/#')
        serializer.setPrefix('exa', 'http://example.com/')
        serializer.setFlags('d')
      })
    })
  })

  describe('p flag - no URI splitting', () => {
    describe('should not split URIs into namespace and local part with p flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/p-flag', ['n3'], serializer => {
        serializer.setFlags('p')
      })
    })
  })

  describe('/ flag - no splitting on slash', () => {
    describe('should only split on # not on / with / flag', () => {
      const statement = st(
        sym('http://example.com#subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/path/to/resource')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/slash-flag', ['n3'], serializer => {
        serializer.setFlags('/')
      })
    })
  })

  describe('k flag - allow keywords without colon', () => {
    describe('should allow keywords without colon prefix with k flag', () => {
      const statement = st(
        sym('http://example.com/#subject'),
        sym('http://example.com/#predicate'),
        sym('http://example.com/#object')
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/k-flag', ['n3'], serializer => {
        serializer.setBase('http://example.com/')
        serializer.setFlags('k')
      })
    })
  })

  describe('combined flags', () => {
    describe('should apply multiple flags simultaneously', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('42', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )

      const store = graph()
      store.add(statement)

      serializeEqualMultiple(store, 'flags/combined-flags', ['n3'], serializer => {
        serializer.setFlags('xt s')
      })
    })
  })
})
