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

  constructor(store: Formula) {
    super(store)
    this.textConverter = new TextTermConverter(this)
    this.treeBuilder = new TreeBuilder(this)
  }

  serialize(sts: Statement[]): string {
    var indent = 4
    var width = 80
    var kb = this.store
    // A URI Map alows us to put the type statemnts at the top.
    var uriMap = { 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type': 'aaa:00' }
    var SPO = function (x: Statement, y: Statement) {
      // Do limited canonicalization of bnodes
      return Util.heavyCompareSPO(x, y, kb, uriMap) as number // @TODO(serializer-refactor): Utils-js.heavyCompareSPO should be typed
    }
    sts.sort(SPO)

    if (this.base && !this.defaultNamespace) {
      this.defaultNamespace = this.base + '#'
    }

    var predMap: Record<string, string> = {}
    if (this.flags.indexOf('s') < 0) {
      predMap['http://www.w3.org/2002/07/owl#sameAs'] = '='
    }
    if (this.flags.indexOf('t') < 0) {
      predMap['http://www.w3.org/1999/02/22-rdf-syntax-ns#type'] = 'a'
    }
    if (this.flags.indexOf('i') < 0) {
      predMap['http://www.w3.org/2000/10/swap/log#implies'] = '=>'
    }
    // //////////////////////// Arrange the bits of text

    var spaces = function (n: number) {
      var s = ''
      for (var i = 0; i < n; i++) s += ' '
      return s
    }

    var treeToLine = function (tree: TreeBuilderTree) {
      var str = ''
      for (var i = 0; i < tree.length; i++) {
        var branch = tree[i]
        var s2 = typeof branch === 'string' ? branch : treeToLine(branch)
        // Note the space before the dot in case statement ends with 123 or colon. which is in fact allowed but be conservative.
        if (i !== 0) {
          var ch = str.slice(-1) || ' '
          if (s2 === ',' || s2 === ';') {
            // no gap
          } else if (s2 === '.' && !'0123456789.:'.includes(ch)) {
            // no gap except after number and colon
            // no gap
          } else {
            str += ' ' // separate from previous token
          }
        }
        str += s2
      }
      return str
    }

    // Convert a nested tree of lists and strings to a string
    var treeToString = function (tree: TreeBuilderTree, level?: number) {
      var str = ''
      var lastLength = 100000
      if (level === undefined) level = -1
      for (var i = 0; i < tree.length; i++) {
        var branch = tree[i]
        if (typeof branch !== 'string') {
          var substr = treeToString(branch, level + 1)
          if (substr.length < 10 * (width - indent * level) && substr.indexOf('"""') < 0) {
            // Don't mess up multiline strings
            var line = treeToLine(branch)
            if (line.length < width - indent * level) {
              branch = line //   Note! treat as string below
              substr = ''
            }
          }
          if (substr) lastLength = 10000
          str += substr
        }
        if (typeof branch === 'string') {
          if (branch.length === 1 && str.slice(-1) === '\n') {
            if (',.;'.indexOf(branch) >= 0) {
              str = str.slice(0, -1)
              // be conservative and ensure a whitespace between some chars and a final dot, as in treeToLine above
              if (branch == '.' && '0123456789.:'.includes(str.charAt(str.length - 1))) {
                str += ' '
                lastLength += 1
              }
              str += branch + '\n' //  slip punct'n on end
              lastLength += 1
              continue
            }
          }
          if (
            lastLength < indent * level + 4 || // if new line not necessary
            (lastLength + branch.length + 1 < width && ';.'.indexOf(str[str.length - 2]) < 0)
          ) {
            // or the string fits on last line
            str = str.slice(0, -1) + ' ' + branch + '\n' // then continue on this line
            lastLength += branch.length + 1
          } else {
            let line = spaces(indent * level) + branch
            str += line + '\n'
            lastLength = line.length
            if (level < 0) {
              str += '\n' // extra blank line
              lastLength = 100000 // don't touch
            }
          }
        }
      }
      return str
    }

    // //////////////////////////////////////////// Structure for N3
    // Convert a set of statements into a nested tree of lists and strings
    function statementListToTreeMethod(this: N3Serializer, statements: Statement[]): TreeBuilderTree {
      var stats = this.treeBuilder.rootSubjects(statements)
      var roots = stats.roots
      var results: TreeBuilderTree = []
      for (var i = 0; i < roots.length; i++) {
        var root = roots[i]
        results.push(subjectTree(root, stats))
      }
      return results
    }
    var statementListToTree = statementListToTreeMethod.bind(this)

    // The tree for a subject
    function subjectTreeMethod(
      this: N3Serializer,
      subject: SubjectType,
      stats: TreeBuilderRootSubjects
    ): TreeBuilderTree {
      if (subject.termType === 'BlankNode' && !stats.incoming[this.toStr(subject)]) {
        return [objectTree(subject, stats, true)].concat(['.']) // Anonymous bnode subject
      }
      return [termToN3(subject, stats)].concat([propertyTree(subject, stats)]).concat(['.'])
    }
    var subjectTree = subjectTreeMethod.bind(this)
    // The property tree for a single subject or anonymous node
    function propertyTreeMethod(
      this: N3Serializer,
      subject: SubjectType,
      stats: TreeBuilderRootSubjects
    ): TreeBuilderTree {
      var results: TreeBuilderTree = []
      var lastPred: string | null = null
      var sts = stats.subjects[this.toStr(subject)] || [] // relevant statements
      if (typeof sts === 'undefined') {
        throw new Error('Cant find statements for ' + subject)
      }

      var objects: TreeBuilderTree = []
      for (var i = 0; i < sts.length; i++) {
        var st = sts[i]
        if (st.predicate.uri === lastPred) {
          objects.push(',')
        } else {
          if (lastPred) {
            results = results.concat([objects]).concat([';'])
            objects = []
          }
          results.push(predMap[st.predicate.uri] ? predMap[st.predicate.uri] : termToN3(st.predicate, stats))
        }
        lastPred = st.predicate.uri
        objects.push(objectTree(st.object as Node, stats)) // @TODO(serializer-refactor): Types of Collection generic T do not match, but is not important for this method
      }
      results = results.concat([objects])
      return results
    }

    var propertyTree = propertyTreeMethod.bind(this)

    function objectTreeMethod(
      this: N3Serializer,
      obj: Node,
      stats: TreeBuilderRootSubjects,
      force?: boolean
    ): TreeBuilderNestedTree {
      if (obj.termType === 'BlankNode' && (force || stats.rootsHash[obj.toNT()] === undefined)) {
        // if not a root
        if (stats.subjects[this.toStr(obj)]) {
          return ['[', propertyTree(obj as BlankNode, stats), ']']
        } else {
          return '[]'
        }
      }
      return termToN3(obj, stats)
    }

    var objectTree = objectTreeMethod.bind(this)

    function termToN3Method(this: N3Serializer, expr: Node, stats: TreeBuilderRootSubjects): TreeBuilderNestedTree {
      //
      var i, res: TreeBuilderNestedTree
      switch (expr.termType) {
        case 'Graph':
          res = ['{']
          res = res.concat(statementListToTree((expr as Formula).statements))
          return res.concat(['}'])

        case 'Collection':
          res = ['(']
          for (i = 0; i < (expr as Collection).elements.length; i++) {
            res.push([objectTree((expr as Collection).elements[i], stats)])
          }
          res.push(')')
          return res

        default:
          return this.textConverter.atomicTermToN3(expr)
      }
    }
    // Serializer.prototype.termToN3 = termToN3 // @TODO(serializer-refactor): This is not used in the library, why is it here?
    var termToN3 = termToN3Method.bind(this)

    function prefixDirectivesMethod(this: N3Serializer) {
      var str = ''
      if (this.flags.indexOf('d') < 0 && this.defaultNamespace) {
        str += '@prefix : ' + this.textConverter.explicitURI(this.defaultNamespace) + '.\n'
      }
      for (var ns in this.prefixes) {
        if (!this.prefixes.hasOwnProperty(ns)) continue
        if (!this.namespacesUsed[ns]) continue
        str += '@prefix ' + this.prefixes[ns] + ': ' + this.textConverter.explicitURI(ns) + '.\n'
      }
      return str + '\n'
    }
    var prefixDirectives = prefixDirectivesMethod.bind(this)
    // Body of statementsToN3:
    var tree = statementListToTree(sts)
    return prefixDirectives() + treeToString(tree)
  }
}
