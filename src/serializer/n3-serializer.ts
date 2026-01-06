import { BlankNode, Collection } from '..'
import Formula from '../formula'
import Node from '../node'
import Statement from '../statement'
import { SubjectType } from '../types'
import * as Util from '../utils-js'
import { AbstractSerializer } from './abstract-serializer'
import { TextTermConverter } from './utils/text-term-converter'
import { TreeBuilder, TreeBuilderNestedTree, TreeBuilderRootSubjects, TreeBuilderTree } from './utils/tree-builder'

export class N3Serializer extends AbstractSerializer {
  protected textConverter: TextTermConverter
  protected treeBuilder: TreeBuilder

  private indent: number
  private width: number
  private keywords: Record<string, string>

  constructor(store: Formula, options?: { indent?: number; width?: number }) {
    super(store)
    this.textConverter = new TextTermConverter(this)
    this.treeBuilder = new TreeBuilder(this)

    this.indent = options?.indent ?? 4
    this.width = options?.width ?? 80

    this.keywords = {}
  }

  serialize(statements: Statement[]): string {
    // A URI Map alows us to put the type statemnts at the top.
    const uriMap = { 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'aaa:00' }
    // Do limited canonicalization of bnodes
    const sortedStatements = [...statements].sort((x, y) => Util.heavyCompareSPO(x, y, this.store, uriMap) as number) // @TODO(serializer-refactor): Utils-js.heavyCompareSPO should be typed, in different pr

    if (!this.flags.includes('s')) {
      this.keywords['http://www.w3.org/2002/07/owl#sameAs'] = '='
    }
    if (!this.flags.includes('t')) {
      this.keywords['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] = 'a'
    }
    if (!this.flags.includes('i')) {
      this.keywords['http://www.w3.org/2000/10/swap/log#implies'] = '=>'
    }

    const tree = this.statementListToTree(sortedStatements)
    return this.prefixDirectives() + this.treeToString(tree)
  }

  prefixDirectives() {
    let directives = ''

    if (!this.flags.includes('r') && this.base) {
      directives += '@base ' + this.textConverter.explicitURI(this.base, true) + '.\n'
    }

    if (!this.flags.includes('d') && this.defaultNamespace) {
      directives += '@prefix : ' + this.textConverter.explicitURI(this.defaultNamespace) + '.\n'
    }

    const namespacesUsed = Array.from(this.namespacesUsed).sort((a, b) => b[1] - a[1])
    for (const [ns] of namespacesUsed) {
      directives += '@prefix ' + this.prefixes[ns] + ': ' + this.textConverter.explicitURI(ns) + '.\n'
    }
    return directives + (directives.length > 0 ? '\n' : '')
  }

  // //////////////////////////////////////////// Structure for N3
  // Convert a set of statements into a nested tree of lists and strings
  statementListToTree(statements: Statement[]): TreeBuilderTree {
    const stats = this.treeBuilder.rootSubjects(statements)

    const results: TreeBuilderTree = []
    for (const root of stats.roots) {
      results.push(this.subjectTree(root, stats))
    }

    return results
  }

  // The tree for a subject
  subjectTree(subject: SubjectType, stats: TreeBuilderRootSubjects): TreeBuilderTree {
    if (subject.termType === 'BlankNode' && !stats.incoming[this.toStr(subject)]) {
      return this.objectTree(subject, stats, true).concat(['.']) // Anonymous bnode subject
    }

    return this.termToN3(subject, stats)
      .concat([this.propertyTree(subject, stats)])
      .concat('.')
  }

  // The property tree for a single subject or anonymous node
  propertyTree(subject: SubjectType, stats: TreeBuilderRootSubjects): TreeBuilderTree {
    const statements = stats.subjects[this.toStr(subject)]
    if (typeof statements === 'undefined') {
      throw new Error('Cant find statements for ' + subject)
    }

    const results: TreeBuilderTree = []
    let objects: TreeBuilderTree = []
    let previousPredicate: string | null = null
    for (const statement of statements) {
      if (statement.predicate.uri === previousPredicate) {
        objects.push(',')
      } else {
        if (previousPredicate) {
          results.push(objects, ';')
          objects = []
        }

        results.push(
          ...(this.keywords[statement.predicate.uri]
            ? [this.keywords[statement.predicate.uri]]
            : this.termToN3(statement.predicate, stats))
        )
      }

      previousPredicate = statement.predicate.uri
      objects.push(...this.objectTree(statement.object, stats))
    }

    results.push(objects)
    return results
  }

  objectTree(object: Node, stats: TreeBuilderRootSubjects, force?: boolean): TreeBuilderTree {
    if (object.termType === 'BlankNode' && (force || stats.rootsHash[this.toStr(object)] === undefined)) {
      // if not a root
      if (stats.subjects[this.toStr(object)]) {
        return ['[', this.propertyTree(object as BlankNode, stats), ']']
      } else {
        return ['[]']
      }
    }

    return this.termToN3(object, stats)
  }

  termToN3(node: Node, stats: TreeBuilderRootSubjects): TreeBuilderTree {
    switch (node.termType) {
      case 'Graph':
        return ['{', ...this.statementListToTree((node as Formula).statements), '}']

      case 'Collection':
        const elements: TreeBuilderNestedTree = (node as Collection).elements.map(element =>
          this.objectTree(element, stats)
        )
        return ['(', ...elements, ')']

      default:
        return [this.textConverter.atomicTermToN3(node)]
    }
  }

  // //////////////////////// Arrange the bits of text

  treeToLine(tree: TreeBuilderTree) {
    let line = ''
    for (let i = 0; i < tree.length; i++) {
      const branch = tree[i]
      const branchString = typeof branch === 'string' ? branch : this.treeToLine(branch)

      // Note the space before the dot in case statement ends with 123 or colon. which is in fact allowed but be conservative.
      if (i !== 0) {
        const isCommaOrSemicolon = branchString === ',' || branchString === ';'

        const lastLineChar = line.slice(-1) || ' '
        const isDotAfterNumberOrColon = branchString === '.' && !'0123456789.:'.includes(lastLineChar)

        if (!isCommaOrSemicolon && !isDotAfterNumberOrColon) {
          line += ' ' // separate from previous token
        }
      }

      line += branchString
    }

    return line
  }

  // Convert a nested tree of lists and strings to a string
  treeToString(tree: TreeBuilderTree, level: number = -1) {
    let result = ''
    let lastLength = Number.MAX_SAFE_INTEGER

    for (let branch of tree) {
      if (typeof branch !== 'string') {
        let substr = this.treeToString(branch, level + 1)

        // Possible short enough and not multiline string, so we can try to stay on the same line
        if (substr.length < 10 * (this.width - this.indent * level) && !substr.includes('"""')) {
          const line = this.treeToLine(branch)
          if (line.length < this.width - this.indent * level) {
            branch = line //   Note! treat as string below
            substr = ''
          }
        }

        if (substr) lastLength = Number.MAX_SAFE_INTEGER
        result += substr
      }

      if (typeof branch === 'string') {
        if (branch.length === 1 && result.slice(-1) === '\n') {
          if (branch === ',' || branch === ';' || branch === '.') {
            result = result.slice(0, -1)
            // be conservative and ensure a whitespace between some chars and a final dot, as in treeToLine above
            if (branch == '.' && '0123456789.:'.includes(result.charAt(result.length - 1))) {
              result += ' '
              lastLength += 1
            }
            result += branch + '\n' //  slip punct'n on end
            lastLength += 1
            continue
          }
        }

        if (
          lastLength + branch.length + 1 < this.width && // or the string fits on last line
          result[result.length - 2] !== ';' && // but not after
          result[result.length - 2] !== '.'
        ) {
          result = result.slice(0, -1) + ' ' + branch + '\n' // then continue on this line
          lastLength += branch.length + 1
          continue
        }

        const line = ' '.repeat(this.indent * Math.max(level, 0)) + branch
        result += line + '\n'
        lastLength = line.length + 1

        if (level < 0) {
          result += '\n' // extra blank line
          lastLength = Number.MAX_SAFE_INTEGER // don't touch
        }
      }
    }
    return result
  }
}
