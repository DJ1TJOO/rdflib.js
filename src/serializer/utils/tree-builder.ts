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

  /* This scan is to find out which nodes will have to be the roots of trees
   ** in the serialized form. This will be any symbols, and any bnodes
   ** which have more or less than one incoming arc, and any bnodes which have
   ** one incoming arc but it is an uninterrupted loop of such nodes back to itself.
   ** This should be kept linear time with repect to the number of statements.
   ** Note it does not use any indexing of the store.
   */
  rootSubjects(statements: Statement[]): TreeBuilderRootSubjects {
    const incoming: TreeBuilderIncoming = {}
    const subjects: TreeBuilderSubjects = {}

    for (const statement of statements) {
      this.checkMentions(statement, incoming)

      const subjectNT = this.serializer.toStr(statement.subject)
      if (!(subjectNT in subjects)) subjects[subjectNT] = []

      subjects[subjectNT].push(statement) // Make hash. @@ too slow for formula?
    }

    const roots: TreeBuilderRoots = []
    for (const subjectNT in subjects) {
      const subject = this.serializer.fromStr(subjectNT) as SubjectType // We know this is a SubjectType because we just hashed it
      if (subject.termType !== 'BlankNode' || !incoming[subjectNT] || incoming[subjectNT].length !== 1) {
        roots.push(subject)
      }
    }

    // Now do the scan using existing roots
    const rootsHash: TreeBuilderRootsHash = {}
    for (const root of roots) {
      rootsHash[this.serializer.toStr(root)] = true
    }

    return { roots, subjects, rootsHash, incoming }
  }

  private checkMentions(statement: Statement, incoming: TreeBuilderIncoming) {
    const allCollectionElements = [statement.subject, statement.predicate, statement.object]
      .filter(node => node.termType === 'Collection')
      .flatMap(node => node.elements)

    const checkMentions = allCollectionElements.concat(statement.object)
    for (const node of checkMentions) {
      const nodeNT = this.serializer.toStr(node)
      if (!(nodeNT in incoming)) incoming[nodeNT] = []

      incoming[nodeNT].push(statement.subject) // List of things which will cause this to be printed
    }
  }
}
