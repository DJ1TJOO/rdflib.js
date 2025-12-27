import { IndexedFormula, N3Serializer, Statement } from '..'
import { NamedNode } from '../tf-types'

export class WriteStoreSerializer extends N3Serializer {
  constructor(store: IndexedFormula) {
    super(store)
  }

  // @para. write  - a function taking a single string to be output
  //
  writeStore(write: (s: string) => void) {
    var kb = this.store
    var fetcher = kb.fetcher
    var session = fetcher && fetcher.appNode

    // The core data

    // @TODO(serializer-refactor): This is a hack to get the types to work and safely cast the store, what is the best way to do this?
    if (!(this.store instanceof IndexedFormula)) {
      throw new Error('Store is not an IndexedFormula')
    }

    var sources = (this.store as IndexedFormula).index[3]
    for (var s in sources) {
      // -> assume we can use -> as short for log:semantics
      var source = kb.fromNT(s)
      if (session && source.equals(session)) continue
      write(
        '\n' +
          this.textConverter.atomicTermToN3(source) +
          ' ' +
          this.textConverter.atomicTermToN3(kb.sym('http://www.w3.org/2000/10/swap/log#semantics')) +
          ' { ' +
          this.serialize(kb.statementsMatching(undefined, undefined, undefined, source)) +
          ' }.\n'
      )
    }

    // The metadata from HTTP interactions:

    kb.statementsMatching(undefined, kb.sym('http://www.w3.org/2007/ont/link#requestedURI')).map(function (
      this: WriteStoreSerializer,
      st: Statement
    ) {
      write('\n<' + st.object.value + '> log:metadata {\n')
      var sts = kb.statementsMatching(undefined, undefined, undefined, st.subject)
      // @TODO(serializer-refactor): This was originally written as this.statementsToN3(this.statementsToN3(sts)), which is not valid, was this a mistake?
      write(this.serialize(sts))
      write('}.\n')
    })

    // Inferences we have made ourselves not attributable to anyone else

    var metaSources: NamedNode[] = []
    if (session) metaSources.push(session)
    var metadata: Statement[] = []
    metaSources.map(function (source) {
      metadata = metadata.concat(kb.statementsMatching(undefined, undefined, undefined, source))
    })
    write(this.serialize(metadata))
  }
}
