import { expect } from 'chai'
import { blankNode, graph, lit, st, sym, TreeBuilder } from '../../../src'
import { createEmptySerializer } from './utils/serializer-factories'

describe('TreeBuilder', () => {
  let serializer: ReturnType<typeof createEmptySerializer>
  let treeBuilder: TreeBuilder

  beforeEach(() => {
    serializer = createEmptySerializer(graph())
    treeBuilder = new TreeBuilder(serializer)
  })

  describe('rootSubjects', () => {
    it('should return empty roots for empty statements', () => {
      const result = treeBuilder.rootSubjects([])

      expect(result.roots).to.deep.equal([])
      expect(result.subjects).to.deep.equal({})
      expect(result.rootsHash).to.deep.equal({})
      expect(result.incoming).to.deep.equal({})
    })

    it('should identify NamedNode as root', () => {
      const subject = sym('http://example.org/s')
      const statement = st(subject, sym('http://example.org/p'), lit('value'))

      const result = treeBuilder.rootSubjects([statement])

      expect(result.roots).to.have.length(1)
      expect(result.roots[0].toNT()).to.equal(subject.toNT())
      expect(result.rootsHash[subject.toNT()]).to.be.true
    })

    it('should identify BlankNode with no incoming arcs as root', () => {
      const subject = blankNode('b1')
      const statement = st(subject, sym('http://example.org/p'), lit('value'))

      const result = treeBuilder.rootSubjects([statement])

      expect(result.roots).to.have.length(1)
      expect(result.roots[0].toNT()).to.equal(subject.toNT())
    })

    it('should not identify BlankNode with multiple incoming arcs as root', () => {
      const subject1 = sym('http://example.org/s1')
      const subject2 = sym('http://example.org/s2')
      const predicate = sym('http://example.org/p')
      const object = blankNode('b1')

      const statement1 = st(subject1, predicate, object)
      const statement2 = st(subject2, predicate, object)

      const result = treeBuilder.rootSubjects([statement1, statement2])

      expect(result.roots).to.have.length(2) // subject1 and subject2
      expect(result.rootsHash[object.toNT()]).to.be.undefined
    })

    it('should not identify BlankNode with single incoming arc as root', () => {
      const subject = sym('http://example.org/s')
      const object = blankNode('b1')
      const statement = st(subject, sym('http://example.org/p'), object)

      const result = treeBuilder.rootSubjects([statement])

      expect(result.roots).to.have.length(1)
      expect(result.roots[0].toNT()).to.equal(subject.toNT())
      expect(result.rootsHash[object.toNT()]).to.be.undefined
    })

    it('should track subjects correctly', () => {
      const subject = sym('http://example.org/s')
      const statement1 = st(subject, sym('http://example.org/p1'), lit('value1'))
      const statement2 = st(subject, sym('http://example.org/p2'), lit('value2'))

      const result = treeBuilder.rootSubjects([statement1, statement2])

      const subjectKey = serializer.toStr(subject)
      expect(result.subjects[subjectKey]).to.have.length(2)
      expect(result.subjects[subjectKey]).to.include(statement1)
      expect(result.subjects[subjectKey]).to.include(statement2)
    })

    it('should track incoming arcs for BlankNodes', () => {
      const subject = sym('http://example.org/s')
      const object = blankNode('b1')
      const statement = st(subject, sym('http://example.org/p'), object)

      const result = treeBuilder.rootSubjects([statement])

      const objectKey = serializer.toStr(object)
      expect(result.incoming[objectKey]).to.have.length(1)
      expect(result.incoming[objectKey][0].toNT()).to.equal(subject.toNT())
    })

    it('should track incoming arcs for multiple references', () => {
      const subject1 = sym('http://example.org/s1')
      const subject2 = sym('http://example.org/s2')
      const predicate = sym('http://example.org/p')
      const object = blankNode('b1')

      const statement1 = st(subject1, predicate, object)
      const statement2 = st(subject2, predicate, object)

      const result = treeBuilder.rootSubjects([statement1, statement2])

      const objectKey = serializer.toStr(object)
      expect(result.incoming[objectKey]).to.have.length(2)
      expect(result.incoming[objectKey]).to.include(subject1)
      expect(result.incoming[objectKey]).to.include(subject2)
    })

    it('should handle BlankNodes in subject position', () => {
      const subject = blankNode('b1')
      const statement = st(subject, sym('http://example.org/p'), lit('value'))

      const result = treeBuilder.rootSubjects([statement])

      expect(result.roots).to.have.length(1)
      expect(result.roots[0].toNT()).to.equal(subject.toNT())
    })

    it('should handle complex graph with multiple roots', () => {
      const subject1 = sym('http://example.org/s1')
      const subject2 = sym('http://example.org/s2')
      const blankNode1 = blankNode('b1')
      const predicate = sym('http://example.org/p')
      const object = lit('value')

      const statement1 = st(subject1, predicate, object)
      const statement2 = st(subject2, predicate, blankNode1)
      const statement3 = st(blankNode1, predicate, object)

      const result = treeBuilder.rootSubjects([statement1, statement2, statement3])

      expect(result.roots).to.have.length(2) // subject1 and subject2 (blankNode1 has one incoming)
      expect(result.rootsHash[subject1.toNT()]).to.be.true
      expect(result.rootsHash[subject2.toNT()]).to.be.true
    })

    it('should set incoming on serializer', () => {
      const subject = sym('http://example.org/s')
      const object = blankNode('b1')
      const statement = st(subject, sym('http://example.org/p'), object)

      treeBuilder.rootSubjects([statement])

      expect(serializer.incoming).to.not.be.null
      const objectKey = serializer.toStr(object)
      expect(serializer.incoming![objectKey]).to.have.length(1)
    })

    it('should handle statements with same subject and object', () => {
      const subject = sym('http://example.org/s')
      const statement = st(subject, sym('http://example.org/p'), subject) // Self-reference

      const result = treeBuilder.rootSubjects([statement])

      // Self-reference means 2 incoming arcs (as subject and as object)
      const subjectKey = serializer.toStr(subject)
      expect(result.incoming[subjectKey]).to.have.length(1)
      expect(result.roots).to.have.length(1)
      expect(result.roots[0].toNT()).to.equal(subject.toNT())
    })

    it('should handle multiple statements with same BlankNode object', () => {
      const subject1 = sym('http://example.org/s1')
      const subject2 = blankNode('b2')
      const predicate = sym('http://example.org/p')
      const object = blankNode('b1')

      const statement1 = st(subject1, predicate, object)
      const statement2 = st(subject2, predicate, object)

      const result = treeBuilder.rootSubjects([statement1, statement2])

      expect(result.roots).to.have.length(2) // subject1, subject2
      expect(result.rootsHash[object.toNT()]).to.be.undefined
    })

    it('should handle chain of BlankNodes', () => {
      const subject = sym('http://example.org/s')
      const blankNode1 = blankNode('b1')
      const blankNode2 = blankNode('b2')
      const blankNode3 = blankNode('b3')
      const predicate = sym('http://example.org/p')

      const statement1 = st(subject, predicate, blankNode1)
      const statement2 = st(blankNode1, predicate, blankNode2)
      const statement3 = st(blankNode2, predicate, blankNode3)

      const result = treeBuilder.rootSubjects([statement1, statement2, statement3])

      // Only subject is a root, blankNode1, blankNode2, blankNode3 each have one incoming arc
      expect(result.roots).to.have.length(1)
      expect(result.roots[0].toNT()).to.equal(subject.toNT())
    })
  })
})
