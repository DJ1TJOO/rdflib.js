import { Collection } from '..'
import Formula from '../formula'
import NamedNode from '../named-node'
import Node from '../node'
import Statement from '../statement'
import { PredicateType } from '../types'
import * as Util from '../utils-js'
import Variable from '../variable'
import { AbstractSerializer, SerializerNamespacesUsed } from './abstract-serializer'
import { TextTermConverter } from './utils/text-term-converter'
import { TreeBuilder, TreeBuilderRootSubjects, TreeBuilderTree } from './utils/tree-builder'

export class XMLSerializer extends AbstractSerializer {
  private treeBuilder: TreeBuilder

  constructor(store: Formula) {
    super(store)
    this.treeBuilder = new TreeBuilder(this)
  }

  serialize(sts: Statement[]): string {
    var indent = 4
    var width = 80

    var namespaceCounts: SerializerNamespacesUsed = {} // which have been used
    namespaceCounts['http://www.w3.org/1999/02/22-rdf-syntax-ns#'] = true

    var liPrefix = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#_' // prefix for ordered list items

    // //////////////////////// Arrange the bits of XML text

    var spaces = function (n: number) {
      var s = ''
      for (var i = 0; i < n; i++) s += ' '
      return s
    }

    var XMLtreeToLine = function (tree: TreeBuilderTree) {
      var str = ''
      for (var i = 0; i < tree.length; i++) {
        var branch = tree[i]
        var s2 = typeof branch === 'string' ? branch : XMLtreeToLine(branch)
        str += s2
      }
      return str
    }

    // Convert a nested tree of lists and strings to a string
    var XMLtreeToString = function (tree: TreeBuilderTree, level?: number) {
      var str = ''
      var line: string
      var lastLength = 100000
      if (!level) level = 0
      for (var i = 0; i < tree.length; i++) {
        var branch = tree[i]
        if (typeof branch !== 'string') {
          var substr = XMLtreeToString(branch, level + 1)
          if (substr.length < 10 * (width - indent * level) && substr.indexOf('"""') < 0) {
            // Don't mess up multiline strings
            line = XMLtreeToLine(branch)
            if (line.length < width - indent * level) {
              branch = '   ' + line //   @@ Hack: treat as string below
              substr = ''
            }
          }
          if (substr) lastLength = 10000
          str += substr
        }
        if (typeof branch === 'string') {
          if (lastLength < indent * level + 4) {
            // continue
            str = str.slice(0, -1) + ' ' + branch + '\n'
            lastLength += branch.length + 1
          } else {
            line = spaces(indent * level) + branch
            str += line + '\n'
            lastLength = line.length
          }
        } else {
          // not string
        }
      }
      return str
    }

    function statementListToXMLTreeMethod(this: XMLSerializer, statements: Statement[]): TreeBuilderTree {
      this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
      var stats = this.treeBuilder.rootSubjects(statements)
      var roots = stats.roots
      var results: TreeBuilderTree = []
      for (var i = 0; i < roots.length; i++) {
        var root = roots[i]
        results.push(subjectXMLTree(root, stats))
      }
      return results
    }
    var statementListToXMLTree = statementListToXMLTreeMethod.bind(this)

    function escapeForXML(str: string) {
      if (typeof str === 'undefined') return '@@@undefined@@@@'
      return str.replace(/[&<"]/g, function (m) {
        switch (m[0]) {
          case '&':
            return '&amp;'
          case '<':
            return '&lt;'
          case '"':
            return '&quot;' // '
          default: // @TODO(serializer-refactor): Should not be reachable, but is to prevent TypeScript from complaining
            return ''
        }
      })
    }

    function relURIMethod(this: XMLSerializer, term: NamedNode | Variable) {
      return escapeForXML(this.base ? Util.uri.refTo(this.base, term.uri) : term.uri)
    }
    var relURI = relURIMethod.bind(this)

    // The tree for a subject
    // @TODO(serializer-refactor): Subject is Node type, but should be SubjectType, if not in subjects, returns [] from propertyXMLTree
    function subjectXMLTreeMethod(this: XMLSerializer, subject: Node, stats: TreeBuilderRootSubjects): TreeBuilderTree {
      var results: TreeBuilderTree = []
      var type: NamedNode | undefined, t: string, st: Statement, pred: PredicateType
      var sts = stats.subjects[this.toStr(subject)] // relevant statements
      if (typeof sts === 'undefined') {
        // empty bnode
        return propertyXMLTree(subject, stats)
      }

      // Sort only on the predicate, leave the order at object
      // level undisturbed.  This leaves multilingual content in
      // the order of entry (for partner literals), which helps
      // readability.
      //
      // For the predicate sort, we attempt to split the uri
      // as a hint to the sequence
      sts.sort(function (a, b) {
        var ap = a.predicate.uri
        var bp = b.predicate.uri
        if (ap.substring(0, liPrefix.length) === liPrefix || bp.substring(0, liPrefix.length) === liPrefix) {
          // we're only interested in sorting list items
          return ap.localeCompare(bp)
        }

        var as = ap.substring(liPrefix.length)
        var bs = bp.substring(liPrefix.length)
        var an = parseInt(as, 10)
        var bn = parseInt(bs, 10)
        // @TODO(serializer-refactor): Checks if the strings are actually pure integer (no leading zeros, decimals, or trailing non-numeric)
        if (isNaN(an) || isNaN(bn) || an.toString() !== as || bn.toString() !== bs) {
          // we only care about integers
          return ap.localeCompare(bp)
        }

        return an - bn
      })

      for (var i = 0; i < sts.length; i++) {
        st = sts[i]
        // look for a type
        if (
          st.predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
          !type &&
          st.object.termType === 'NamedNode'
        ) {
          type = st.object
          continue // don't include it as a child element
        }

        // see whether predicate can be replaced with "li"
        pred = st.predicate
        if (pred.uri.substr(0, liPrefix.length) === liPrefix) {
          var number = pred.uri.substr(liPrefix.length)
          // make sure these are actually numeric list items
          var intNumber = parseInt(number, 10)
          if (number === intNumber.toString()) {
            // was numeric; don't need to worry about ordering since we've already
            // sorted the statements
            pred = this.rdfFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#li')
          }
        }

        t = qname(pred)
        switch (st.object.termType) {
          case 'BlankNode':
            if (stats.incoming[this.toStr(st.object)].length === 1) {
              // there should always be something in the incoming array for a bnode
              results = results.concat([
                '<' + t + ' rdf:parseType="Resource">',
                subjectXMLTree(st.object, stats),
                '</' + t + '>'
              ])
            } else {
              results = results.concat(['<' + t + ' rdf:nodeID="' + st.object.toNT().slice(2) + '"/>'])
            }
            break
          case 'NamedNode':
            results = results.concat(['<' + t + ' rdf:resource="' + relURI(st.object) + '"/>'])
            break
          case 'Literal':
            results = results.concat([
              '<' +
                t +
                (st.object.language
                  ? ' xml:lang="' + st.object.language + '"'
                  : st.object.datatype.equals(this.xsd.string)
                  ? ''
                  : ' rdf:datatype="' + escapeForXML(st.object.datatype.uri) + '"') +
                '>' +
                escapeForXML(st.object.value) +
                '</' +
                t +
                '>'
            ])
            break
          case 'Collection':
            results = results.concat([
              '<' + t + ' rdf:parseType="Collection">',
              collectionXMLTree(st.object, stats),
              '</' + t + '>'
            ])
            break
          default:
            throw new Error("Can't serialize object of type " + st.object.termType + ' into XML')
        } // switch
      }

      var tag = type ? qname(type) : 'rdf:Description'

      var attrs = ''
      if (subject.termType === 'BlankNode') {
        if (!stats.incoming[this.toStr(subject)] || stats.incoming[this.toStr(subject)].length !== 1) {
          // not an anonymous bnode
          attrs = ' rdf:nodeID="' + subject.toNT().slice(2) + '"'
        }
      } else {
        attrs = ' rdf:about="' + relURI(subject as NamedNode | Variable) + '"'
      }

      return (['<' + tag + attrs + '>'] as TreeBuilderTree).concat([results]).concat(['</' + tag + '>'])
    }

    var subjectXMLTree = subjectXMLTreeMethod.bind(this)

    function collectionXMLTree(subject: Collection, stats: TreeBuilderRootSubjects): TreeBuilderTree {
      var res: TreeBuilderTree = []
      for (var i = 0; i < subject.elements.length; i++) {
        res.push(subjectXMLTree(subject.elements[i], stats))
      }
      return res
    }

    // The property tree for a single subject or anonymos node
    // @TODO(serializer-refactor): Subject is Node type, but should be SubjectType, if not in subjects, returns []
    function propertyXMLTreeMethod(
      this: XMLSerializer,
      subject: Node,
      stats: TreeBuilderRootSubjects
    ): TreeBuilderTree {
      var results: TreeBuilderTree = []
      var sts = stats.subjects[this.toStr(subject)] // relevant statements
      if (!sts) return results // No relevant statements
      sts.sort()
      for (var i = 0; i < sts.length; i++) {
        var st = sts[i]
        switch (st.object.termType) {
          case 'BlankNode':
            if (stats.rootsHash[st.object.toNT()]) {
              // This bnode has been done as a root -- no content here @@ what bout first time
              results = results.concat([
                '<' + qname(st.predicate) + ' rdf:nodeID="' + st.object.toNT().slice(2) + '">',
                '</' + qname(st.predicate) + '>'
              ])
            } else {
              results = results.concat([
                '<' + qname(st.predicate) + ' rdf:parseType="Resource">',
                propertyXMLTree(st.object, stats),
                '</' + qname(st.predicate) + '>'
              ])
            }
            break
          case 'NamedNode':
            results = results.concat(['<' + qname(st.predicate) + ' rdf:resource="' + relURI(st.object) + '"/>'])
            break
          case 'Literal':
            results = results.concat([
              '<' +
                qname(st.predicate) +
                (st.object.language
                  ? ' xml:lang="' + st.object.language + '"'
                  : st.object.datatype.equals(this.xsd.string)
                  ? ''
                  : ' rdf:datatype="' + escapeForXML(st.object.datatype.uri) + '"') +
                '>' +
                escapeForXML(st.object.value) +
                '</' +
                qname(st.predicate) +
                '>'
            ])
            break
          case 'Collection':
            results = results.concat([
              '<' + qname(st.predicate) + ' rdf:parseType="Collection">',
              collectionXMLTree(st.object, stats),
              '</' + qname(st.predicate) + '>'
            ])
            break
          default:
            throw new Error("Can't serialize object of type " + st.object.termType + ' into XML')
        } // switch
      }
      return results
    }
    var propertyXMLTree = propertyXMLTreeMethod.bind(this)

    function qnameMethod(this: XMLSerializer, term: NamedNode | Variable) {
      var uri = term.uri

      var j = uri.indexOf('#')
      if (j < 0 && this.flags.indexOf('/') < 0) {
        j = uri.lastIndexOf('/')
      }
      if (j < 0) throw new Error('Cannot make qname out of <' + uri + '>')

      for (var k = j + 1; k < uri.length; k++) {
        if (TextTermConverter._notNameChars.indexOf(uri[k]) >= 0) {
          throw new Error('Invalid character "' + uri[k] + '" cannot be in XML qname for URI: ' + uri)
        }
      }
      var localid = uri.slice(j + 1)
      var namesp = uri.slice(0, j + 1)
      if (this.defaultNamespace && this.defaultNamespace === namesp && this.flags.indexOf('d') < 0) {
        // d -> suppress default
        return localid
      }
      var prefix = this.prefixes[namesp]
      if (!prefix) prefix = this.makeUpPrefix(namesp)
      namespaceCounts[namesp] = true
      return prefix + ':' + localid
    }
    var qname = qnameMethod.bind(this)

    // Body of toXML:

    var tree = statementListToXMLTree(sts)
    var str = '<rdf:RDF'
    if (this.defaultNamespace) {
      str += ' xmlns="' + escapeForXML(this.defaultNamespace) + '"'
    }
    for (var ns in namespaceCounts) {
      if (!namespaceCounts.hasOwnProperty(ns)) continue
      // Rel uris in xml ns is not strictly allowed in the XMLNS spec but needed in practice often
      var ns2 = this.base && this.flags.includes('z') ? Util.uri.refTo(this.base, ns) : ns
      str += '\n xmlns:' + this.prefixes[ns] + '="' + escapeForXML(ns2) + '"'
    }
    str += '>'

    var tree2 = [str, tree, '</rdf:RDF>'] // @@ namespace declrations
    return XMLtreeToString(tree2, -1)
  } // End @@ body
}
