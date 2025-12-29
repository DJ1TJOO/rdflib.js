import { expect } from 'chai'
import { graph, lit, st, sym } from '../../../../../src'
import { createN3Serializer } from './n3-factory'

import flagCombinedToN3 from './expected/flags/combined-flags.n3'
import flagDToN3 from './expected/flags/d-flag.n3'
import flagEToN3 from './expected/flags/e-flag.n3'
import flagIToN3 from './expected/flags/i-flag.n3'
import flagKToN3 from './expected/flags/k-flag.n3'
import flagNToN3 from './expected/flags/n-flag.n3'
import flagOToN3 from './expected/flags/o-flag.n3'
import flagPToN3 from './expected/flags/p-flag.n3'
import flagRToN3 from './expected/flags/r-flag.n3'
import flagSToN3 from './expected/flags/s-flag.n3'
import flagSlashToN3 from './expected/flags/slash-flag.n3'
import flagTToN3 from './expected/flags/t-flag.n3'
import flagXBooleanToN3 from './expected/flags/x-flag-boolean.n3'
import flagXDecimalToN3 from './expected/flags/x-flag-decimal.n3'
import flagXDoubleToN3 from './expected/flags/x-flag-double.n3'
import flagXToN3 from './expected/flags/x-flag.n3'

describe('flags', () => {
  describe('x flag - suppress native numbers', () => {
    it('should serialize integers as strings with x flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('42', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('x')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagXToN3)
    })

    it('should serialize doubles as strings with x flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('1.23', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('x')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagXDoubleToN3)
    })

    it('should serialize decimals as strings with x flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('3.14', undefined, sym('http://www.w3.org/2001/XMLSchema#decimal'))
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('x')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagXDecimalToN3)
    })

    it('should serialize booleans as strings with x flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('1', undefined, sym('http://www.w3.org/2001/XMLSchema#boolean'))
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('x')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagXBooleanToN3)
    })
  })

  describe('n flag - force single line', () => {
    it('should force single line strings with n flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('multiline\ntext\nwith\nnewlines')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('n')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagNToN3)
    })
  })

  describe('e flag - unicode escaping', () => {
    it('should escape unicode characters with e flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('text with émoji 🎉')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('e')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagEToN3)
    })
  })

  describe('r flag - relative URIs', () => {
    it('should not use relative URIs with r flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setBase('http://example.com/')
      serializer.setFlags('r')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagRToN3)
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
    it('should not abbreviate URIs with dots in local name with o flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object.with.dots')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setPrefix('exa', 'http://example.com/')
      serializer.setFlags('o')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagOToN3)
    })
  })

  describe('s flag - suppress sameAs abbreviation', () => {
    it('should not abbreviate owl:sameAs to = with s flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://www.w3.org/2002/07/owl#sameAs'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setPrefix('exa', 'http://example.com/')
      serializer.setFlags('s')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagSToN3)
    })
  })

  describe('t flag - suppress type abbreviation', () => {
    it('should not abbreviate rdf:type to a with t flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setPrefix('exa', 'http://example.com/')
      serializer.setFlags('t')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagTToN3)
    })
  })

  describe('i flag - suppress implies abbreviation', () => {
    it('should not abbreviate log:implies to => with i flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://www.w3.org/2000/10/swap/log#implies'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setPrefix('exa', 'http://example.com/')
      serializer.setFlags('i')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagIToN3)
    })
  })

  describe('d flag - suppress default namespace prefix', () => {
    it('should not use default namespace prefix with d flag', () => {
      const statement = st(
        sym('http://example.com/#subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setBase('http://example.com/#')
      serializer.setPrefix('exa', 'http://example.com/')
      serializer.setFlags('d')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagDToN3)
    })
  })

  describe('p flag - no URI splitting', () => {
    it('should not split URIs into namespace and local part with p flag', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('p')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagPToN3)
    })
  })

  describe('/ flag - no splitting on slash', () => {
    it('should only split on # not on / with / flag', () => {
      const statement = st(
        sym('http://example.com#subject'),
        sym('http://example.com/predicate'),
        sym('http://example.com/path/to/resource')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('/')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagSlashToN3)
    })
  })

  describe('k flag - allow keywords without colon', () => {
    it('should allow keywords without colon prefix with k flag', () => {
      const statement = st(
        sym('http://example.com/#subject'),
        sym('http://example.com/#predicate'),
        sym('http://example.com/#object')
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setBase('http://example.com/')
      serializer.setFlags('k')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagKToN3)
    })
  })

  describe('combined flags', () => {
    it('should apply multiple flags simultaneously', () => {
      const statement = st(
        sym('http://example.com/subject'),
        sym('http://example.com/predicate'),
        lit('42', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )

      const store = graph()
      store.add(statement)

      const serializer = createN3Serializer(store)
      serializer.setFlags('xt s')
      const n3 = serializer.serialize(store.statements)
      expect(n3).to.equal(flagCombinedToN3)
    })
  })
})
