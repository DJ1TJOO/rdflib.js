import BlankNode from '../blank-node'
import Collection from '../collection'
import Formula from '../formula'
import Literal from '../literal'
import NamedNode from '../named-node'
import Node from '../node'
import Statement from '../statement'
import * as Util from '../utils-js'
import Variable from '../variable'
import { AbstractSerializer } from './abstract-serializer'
import { TextTermConverter } from './utils/text-term-converter'
import { TreeBuilder, TreeBuilderNestedTree, TreeBuilderRootSubjects, TreeBuilderTree } from './utils/tree-builder'

type Attribute = { name: string; value: string }
type Attributes = (Attribute | undefined)[]

export class XMLSerializer extends AbstractSerializer {
  private static readonly liPrefix = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#_' // prefix for ordered list items

  protected treeBuilder: TreeBuilder

  private indent: number
  private width: number

  constructor(store: Formula, options?: { indent?: number; width?: number }) {
    super(store)
    this.treeBuilder = new TreeBuilder(this)

    this.indent = options?.indent ?? 4
    this.width = options?.width ?? 80
  }

  serialize(sts: Statement[]): string {
    this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
    this.namespacesUsed.set('http://www.w3.org/1999/02/22-rdf-syntax-ns#', Number.MAX_SAFE_INTEGER)

    const tree = this.statementListToTree(sts)
    const rdfElement = '<rdf:RDF' + this.prefixDirectives() + '>'

    return this.treeToString([rdfElement, tree, '</rdf:RDF>'])
  }

  prefixDirectives() {
    let directives = ''

    const hasBase = this.base && this.flags.includes('z')
    if (hasBase) {
      directives += ' xml:base="' + this.escapeForXML(this.base!) + '"'
    }

    if (!this.flags.includes('d') && this.defaultNamespace) {
      directives += (hasBase ? '\n' : '') + ' xmlns="' + this.escapeForXML(this.relURI(this.defaultNamespace)) + '"'
    }

    const namespacesUsed = Array.from(this.namespacesUsed).sort((a, b) => b[1] - a[1])
    for (const [ns] of namespacesUsed) {
      directives += '\n xmlns:' + this.prefixes[ns] + '="' + this.escapeForXML(this.relURI(ns)) + '"'
    }

    return directives
  }

  // //////////////////////// Text

  qname(term: NamedNode | Variable) {
    const uri = term.uri

    let separator = uri.indexOf('#')
    if (separator < 0 && !this.flags.includes('/')) {
      separator = uri.lastIndexOf('/')
    }

    if (separator < 0) throw new Error('Cannot make qname out of <' + uri + '>')

    for (let k = separator + 1; k < uri.length; k++) {
      if (TextTermConverter._notNameChars.includes(uri[k])) {
        throw new Error('Invalid character "' + uri[k] + '" cannot be in XML qname for URI: ' + uri)
      }
    }

    const namespace = uri.slice(0, separator + 1)
    const localname = uri.slice(separator + 1)

    if (this.defaultNamespace && this.defaultNamespace === namespace && !this.flags.includes('d')) {
      // d -> suppress default
      return localname
    }

    let prefix = this.prefixes[namespace]
    if (!prefix) prefix = this.makeUpPrefix(namespace)

    this.useNamespace(namespace)
    return prefix + ':' + localname
  }

  escapeForXML(str: string) {
    if (typeof str === 'undefined') return '@@@undefined@@@@'
    return str.replace(/[&<"]/g, match => {
      switch (match as '&' | '<' | '"') {
        case '&':
          return '&amp;'
        case '<':
          return '&lt;'
        case '"':
          return '&quot;'
      }
    })
  }

  relURI(term: NamedNode | Variable | string) {
    let uri = typeof term === 'string' ? term : term.uri

    // Rel uris in xml ns is not strictly allowed in the XMLNS spec but needed in practice often
    if (this.base && this.flags.includes('z')) {
      uri = Util.uri.refTo(this.base, uri)
    }

    return uri
  }

  // //////////////////////////////////////////// Structure for XML
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
  subjectTree(subject: Node, stats: TreeBuilderRootSubjects): TreeBuilderTree {
    const statements = stats.subjects[this.toStr(subject)] // relevant statements
    if (typeof statements === 'undefined') {
      throw new Error('Cant find statements for ' + subject)
    }

    // Sort only on the predicate, leave the order at object
    // level undisturbed.  This leaves multilingual content in
    // the order of entry (for partner literals), which helps
    // readability.
    //
    // For the predicate sort, we attempt to split the uri
    // as a hint to the sequence
    statements.sort((a, b) => {
      const aPredicate = a.predicate.uri
      const bPredicate = b.predicate.uri
      if (
        aPredicate.substring(0, XMLSerializer.liPrefix.length) === XMLSerializer.liPrefix ||
        bPredicate.substring(0, XMLSerializer.liPrefix.length) === XMLSerializer.liPrefix
      ) {
        // we're only interested in sorting list items
        return aPredicate.localeCompare(bPredicate)
      }

      const aListId = aPredicate.substring(XMLSerializer.liPrefix.length)
      const bListId = bPredicate.substring(XMLSerializer.liPrefix.length)
      const aListIdInt = parseInt(aListId, 10)
      const bListIdInt = parseInt(bListId, 10)

      // Checks if the strings are actually pure integer (no leading zeros, decimals, or trailing non-numeric)
      if (
        isNaN(aListIdInt) ||
        isNaN(bListIdInt) ||
        aListIdInt.toString() !== aListId ||
        bListIdInt.toString() !== bListId
      ) {
        // we only care about integers
        return aPredicate.localeCompare(bPredicate)
      }

      return aListIdInt - bListIdInt
    })

    const type = statements.find(
      statement =>
        statement.predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
        statement.object.termType === 'NamedNode'
    )?.object as NamedNode | undefined

    const tag = type ? this.qname(type) : 'rdf:Description'

    const attributes: Attributes = []
    if (subject.termType === 'BlankNode') {
      if (!stats.incoming[this.toStr(subject)] || stats.incoming[this.toStr(subject)].length !== 1) {
        // not an anonymous bnode
        attributes.push({
          name: 'rdf:nodeID',
          value: (subject as BlankNode).id
        })
      }
    } else {
      attributes.push({
        name: 'rdf:about',
        value: this.relURI(subject as NamedNode | Variable)
      })
    }

    return this.element(tag, attributes, this.propertyTree(subject, stats))
  }

  // The property tree for a single subject or anonymous node
  propertyTree(subject: Node, stats: TreeBuilderRootSubjects, includeType?: boolean): TreeBuilderTree {
    const statements = stats.subjects[this.toStr(subject)] // relevant statements
    if (typeof statements === 'undefined') {
      throw new Error('Cant find statements for ' + subject)
    }

    const results: TreeBuilderTree = []
    for (const statement of statements) {
      // Skip type statement as it's already used in the tag
      if (
        !includeType &&
        statement.predicate.uri === 'http://www.w3.org/1999/02/22-rdf-syntax-ns#type' &&
        statement.object.termType === 'NamedNode'
      ) {
        continue
      }

      // see whether predicate can be replaced with "li"
      let predicate = statement.predicate
      if (predicate.uri.startsWith(XMLSerializer.liPrefix)) {
        const listId = predicate.uri.slice(XMLSerializer.liPrefix.length)
        // make sure these are actually numeric list items
        const listIdInt = parseInt(listId, 10)
        if (listId === listIdInt.toString()) {
          // was numeric; don't need to worry about ordering since we've already
          // sorted the statements
          predicate = this.rdfFactory.namedNode('http://www.w3.org/1999/02/22-rdf-syntax-ns#li')
        }
      }

      const predicateTag = this.qname(predicate)
      results.push(...this.objectTree(predicateTag, statement.object, stats))
    }

    return results
  }

  objectTree(predicateTag: string, object: Node, stats: TreeBuilderRootSubjects): TreeBuilderTree {
    if (object.termType === 'BlankNode' && stats.rootsHash[this.toStr(object)] === undefined) {
      // if not a root
      const id = (object as BlankNode).id
      const isDescription = predicateTag === 'rdf:Description'

      const hasChildren = stats.subjects[this.toStr(object)] as Statement[] | undefined

      const nodeIdAttribute =
        stats.incoming[this.toStr(object)]?.length !== 1 ? { name: 'rdf:nodeID', value: id } : undefined
      const parseTypeAttribute = !isDescription ? { name: 'rdf:parseType', value: 'Resource' } : undefined

      return this.element(
        predicateTag,
        [nodeIdAttribute, parseTypeAttribute],
        hasChildren ? this.propertyTree(object, stats, true) : []
      )
    }

    return this.termToXML(predicateTag, object, stats)
  }

  termToXML(predicateTag: string, node: Node, stats: TreeBuilderRootSubjects): TreeBuilderTree {
    const isDescription = predicateTag === 'rdf:Description'

    switch (node.termType) {
      case 'Collection':
        const elements: TreeBuilderNestedTree = (node as Collection).elements.flatMap(element =>
          this.objectTree('rdf:Description', element, stats)
        )

        if (!isDescription) {
          return this.element(predicateTag, [{ name: 'rdf:parseType', value: 'Collection' }], elements)
        }

        // parseType is not allowed on rdf:Description, so we need to wrap it in an rdf:value
        return this.element(
          predicateTag,
          [],
          this.element('rdf:value', [{ name: 'rdf:parseType', value: 'Collection' }], elements)
        )

      case 'Literal':
        const literal = node as Literal

        const literalAttribute = literal.language
          ? { name: 'xml:lang', value: literal.language }
          : !literal.datatype.equals(this.xsd.string)
          ? { name: 'rdf:datatype', value: literal.datatype.uri }
          : undefined

        if (!isDescription) {
          return this.element(predicateTag, [literalAttribute], literal.value)
        }

        if (!literalAttribute) {
          return this.element(predicateTag, [{ name: 'rdf:value', value: literal.value }])
        }

        // Attributes are not allowed on rdf:Description, so we need to wrap it in an rdf:value
        return this.element(predicateTag, [], this.element('rdf:value', [literalAttribute], literal.value))

      default:
        return [this.atomicTermToXML(predicateTag, node)]
    }
  }

  atomicTermToXML(predicateTag: string, node: Node): string {
    const isDescription = predicateTag === 'rdf:Description'
    switch (node.termType) {
      case 'BlankNode':
        return this.element(predicateTag, [{ name: 'rdf:nodeID', value: (node as BlankNode).id }])[0]

      case 'NamedNode':
        return this.element(predicateTag, [
          {
            name: 'rdf:' + (isDescription ? 'about' : 'resource'),
            value: this.relURI(node as NamedNode)
          }
        ])[0]

      case 'DefaultGraph':
        return ''
      default:
        throw new Error("Can't serialize object of type " + node.termType + ' into XML')
    }
  }

  element(tag: string, attributes: Attributes, children?: undefined): [string]
  element(tag: string, attributes: Attributes, children: string | TreeBuilderTree): TreeBuilderTree

  element(tag: string, attributes: Attributes, children?: string | TreeBuilderTree): string | TreeBuilderTree {
    const isUndefined = typeof children === 'undefined'
    const isTree = Array.isArray(children)
    const selfClosing = isUndefined || (isTree && children.length === 0)

    const attributesString = attributes
      .filter(attribute => attribute !== undefined)
      .map(attribute => attribute.name + '="' + this.escapeForXML(attribute.value) + '"')
      .join(' ')
    const elementStart =
      '<' + tag + (attributesString.length > 0 ? ' ' + attributesString : '') + (selfClosing ? ' />' : '>')

    if (selfClosing) {
      return [elementStart]
    }

    if (isTree) {
      return [elementStart, children, '</' + tag + '>']
    }

    return [elementStart + this.escapeForXML(children) + '</' + tag + '>']
  }

  // //////////////////////// Arrange the bits of XML text

  treeToLine(tree: TreeBuilderTree) {
    let line = ''
    for (const branch of tree) {
      line += typeof branch === 'string' ? branch : this.treeToLine(branch)
    }

    return line
  }

  // Convert a nested tree of lists and strings to a string
  treeToString(tree: TreeBuilderTree, level: number = -1) {
    let result = ''

    for (let branch of tree) {
      if (typeof branch !== 'string') {
        let substr = this.treeToString(branch, level + 1)

        // Possible short enough and not multiline string, so we can try to stay on the same line
        if (substr.length < 10 * (this.width - this.indent * level) && !substr.includes('"""')) {
          const line = this.treeToLine(branch)
          if (line.length < this.width - this.indent * (level + 1)) {
            branch = ' '.repeat(this.indent) + line //   Note! treat as string below
            substr = ''
          }
        }

        result += substr
      }

      if (typeof branch === 'string') {
        const line = ' '.repeat(this.indent * Math.max(level, 0)) + branch
        result += line + '\n'
      }
    }
    return result
  }
}
