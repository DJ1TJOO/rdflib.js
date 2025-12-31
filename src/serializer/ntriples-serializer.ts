import { Collection } from '..'
import Formula from '../formula'
import Node from '../node'
import Statement from '../statement'
import { DefaultGraph } from '../tf-types'
import { SubjectType } from '../types'
import { AbstractSerializer } from './abstract-serializer'
import { TextTermConverter } from './utils/text-term-converter'

export class NTriplesSerializer extends AbstractSerializer {
  protected textConverter: TextTermConverter

  constructor(store: Formula) {
    super(store)
    this.textConverter = new TextTermConverter(this)
  }

  serialize(sts: Statement[]): string {
    var sorted = sts.slice()
    sorted.sort()
    var str = ''
    var rdfns = 'http://www.w3.org/1999/02/22-rdf-syntax-ns#'
    var self = this
    var kb = this.store
    var factory = this.rdfFactory
    var termToNT = function (x: Node | DefaultGraph) {
      if (x.termType !== 'Collection') {
        return self.textConverter.atomicTermToN3(x)
      }
      var list = (x as Collection).elements
      var rest: SubjectType = kb.sym(rdfns + 'nill')
      for (var i = list.length - 1; i >= 0; i--) {
        var bnode = factory.blankNode()
        str += termToNT(bnode) + ' ' + termToNT(kb.sym(rdfns + 'first')) + ' ' + termToNT(list[i]) + '.\n'
        str += termToNT(bnode) + ' ' + termToNT(kb.sym(rdfns + 'rest')) + ' ' + termToNT(rest) + '.\n'
        rest = bnode
      }
      return self.textConverter.atomicTermToN3(rest)
    }
    for (var i = 0; i < sorted.length; i++) {
      var st = sorted[i]
      var s = ''
      s += termToNT(st.subject) + ' '
      s += termToNT(st.predicate) + ' '
      s += termToNT(st.object) + ' '
      if (this.flags.indexOf('q') >= 0) {
        // Do quads not nrtiples
        s += termToNT(st.why) + ' '
      }
      s += '.\n'
      str += s
    }
    return str
  }
}
