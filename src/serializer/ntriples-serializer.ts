import { Collection } from '..'
import Formula from '../formula'
import Node from '../node'
import Statement from '../statement'
import { DefaultGraph } from '../tf-types'
import { SubjectType } from '../types'
import { AbstractSerializer } from './abstract-serializer'
import { TextTermConverter } from './utils/text-term-converter'

export class NTriplesSerializer extends AbstractSerializer {
  public static readonly RDFNS = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'

  protected textConverter: TextTermConverter
  private result = ''

  constructor(store: Formula) {
    super(store)
    this.textConverter = new TextTermConverter(this)
  }

  serialize(statements: Statement[]): string {
    const includeQuads = this.flags.indexOf('q') >= 0
    const sortedStatments = [...statements].sort()

    this.result = ''
    for (const statement of sortedStatments) {
      let statementString = ''
      statementString += this.termToNT(statement.subject) + ' '
      statementString += this.termToNT(statement.predicate) + ' '
      statementString += this.termToNT(statement.object) + ' '
      if (includeQuads) {
        // Do quads not nrtiples
        statementString += this.termToNT(statement.why) + ' '
      }
      statementString += '.\n'
      this.result += statementString
    }

    return this.result
  }

  private termToNT(term: Node | DefaultGraph) {
    if (term.termType !== 'Collection') {
      return this.textConverter.atomicTermToN3(term)
    }

    const list = (term as Collection).elements

    let rest: SubjectType = this.store.sym(NTriplesSerializer.RDFNS + 'nil')
    for (let i = list.length - 1; i >= 0; i--) {
      const bnode = this.rdfFactory.blankNode()
      const value = this.termToNT(list[i])

      this.result +=
        this.termToNT(bnode) +
        ' ' +
        this.termToNT(this.store.sym(NTriplesSerializer.RDFNS + 'first')) +
        ' ' +
        value +
        '.\n'
      this.result +=
        this.termToNT(bnode) +
        ' ' +
        this.termToNT(this.store.sym(NTriplesSerializer.RDFNS + 'rest')) +
        ' ' +
        this.termToNT(rest) +
        '.\n'
      rest = bnode
    }

    return this.textConverter.atomicTermToN3(rest)
  }
}
