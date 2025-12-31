import Node from '../../node'
import Statement from '../../statement'
import { SubjectType } from '../../types'
import { AbstractSerializer } from '../abstract-serializer'

export type TreeBuilderTree = TreeBuilderNestedTree[]
export type TreeBuilderNestedTree = string | TreeBuilderNestedTree[]

export interface TreeBuilderIncoming extends Record<string, SubjectType[]> {}
export interface TreeBuilderSubjects extends Record<string, Statement[]> {}
export interface TreeBuilderRootsHash extends Record<string, boolean> {}
export type TreeBuilderRoots = SubjectType[]

export interface TreeBuilderRootSubjects {
  roots: TreeBuilderRoots
  subjects: TreeBuilderSubjects
  rootsHash: TreeBuilderRootsHash
  incoming: TreeBuilderIncoming
}

export class TreeBuilder {
  private readonly serializer: AbstractSerializer

  constructor(serializer: AbstractSerializer) {
    this.serializer = serializer
  }

  rootSubjects(sts: Statement[]): TreeBuilderRootSubjects {
    var incoming: TreeBuilderRootSubjects['incoming'] = {}
    var subjects: TreeBuilderRootSubjects['subjects'] = {}
    var allBnodes: Record<string, boolean> = {}

    /* This scan is to find out which nodes will have to be the roots of trees
     ** in the serialized form. This will be any symbols, and any bnodes
     ** which hve more or less than one incoming arc, and any bnodes which have
     ** one incoming arc but it is an uninterrupted loop of such nodes back to itself.
     ** This should be kept linear time with repect to the number of statements.
     ** Note it does not use any indexing of the store.
     */
    for (var i = 0; i < sts.length; i++) {
      var st = sts[i]
      var checkMentionsMethod = function (this: TreeBuilder, x: Node) {
        if (!incoming.hasOwnProperty(this.serializer.toStr(x))) incoming[this.serializer.toStr(x)] = []
        incoming[this.serializer.toStr(x)].push(st.subject) // List of things which will cause this to be printed
      }
      var checkMentions = checkMentionsMethod.bind(this)
      var st2 = [st.subject, st.predicate, st.object]
      st2.map(function (y) {
        if (y.termType === 'BlankNode') {
          allBnodes[y.toNT()] = true
        } else if (y.termType === 'Collection') {
          y.elements.forEach(function (z) {
            checkMentions(z) // bnodes in collections important
          })
        }
      })
      checkMentions(sts[i].object)
      var ss = subjects[this.serializer.toStr(st.subject)] // Statements with this as subject
      if (!ss) ss = []
      ss.push(st)
      subjects[this.serializer.toStr(st.subject)] = ss // Make hash. @@ too slow for formula?
    }

    var roots: TreeBuilderRootSubjects['roots'] = []
    for (var xNT in subjects) {
      if (!subjects.hasOwnProperty(xNT)) continue
      var y = this.serializer.fromStr(xNT) as SubjectType // @TODO(serializer-refactor): We know this is a SubjectType because we just created it
      if (y.termType !== 'BlankNode' || !incoming[xNT] || incoming[xNT].length !== 1) {
        roots.push(y)
        continue
      }
    }
    this.serializer.incoming = incoming // Keep for serializing @@ Bug for nested formulas

    // Now do the scan using existing roots
    var rootsHash: TreeBuilderRootSubjects['rootsHash'] = {}
    for (var k = 0; k < roots.length; k++) {
      rootsHash[roots[k].toNT()] = true
    }
    return { roots: roots, subjects: subjects, rootsHash: rootsHash, incoming: incoming }
  }
}
