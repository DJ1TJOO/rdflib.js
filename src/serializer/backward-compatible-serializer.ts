import { IndexedFormula, NamedNode } from '..'
import Formula from '../formula'
import Node from '../node'
import type serialize from '../serialize'
import Statement from '../statement'
import { DefaultGraph } from '../tf-types'
import { AbstractSerializer } from './abstract-serializer'
import { JSONLDSerializer } from './jsonld-serializer'
import { N3Serializer } from './n3-serializer'
import { NTriplesSerializer } from './ntriples-serializer'
import { TextTermConverter } from './utils/text-term-converter'
import { XMLSerializer } from './xml-serializer'

/**
 * @deprecated Use implementations of {@link AbstractSerializer} instead or see the {@link serialize} function
 * @see {@link serialize}
 * @see {@link N3Serializer}
 * @see {@link NTriplesSerializer}
 * @see {@link XMLSerializer}
 * @see {@link JSONLDSerializer}
 */
export class BackwardCompatibleSerializer extends AbstractSerializer {
  _notQNameChars = TextTermConverter._notQNameChars
  _notNameChars = TextTermConverter._notNameChars
  validPrefix = AbstractSerializer.validPrefix
  forbidden1 = TextTermConverter.forbidden1
  forbidden3 = TextTermConverter.forbidden3

  protected textConverter = new TextTermConverter(this)

  constructor(store: Formula) {
    super(store)
  }

  serialize(statements: Statement[]): string {
    return this.statementsToN3(statements)
  }

  private createSerializer<T extends AbstractSerializer>(SerializerClass: new (store: Formula) => T): T {
    const serializer = new SerializerClass(this.store)

    // Do not copy BackwardCompatibleSerializer specific properties
    const { textConverter, _notQNameChars, _notNameChars, validPrefix, forbidden1, forbidden3, ...propsToCopy } = this
    Object.assign(serializer, propsToCopy)

    return serializer
  }

  private createN3Serializer(): N3Serializer {
    return this.createSerializer(N3Serializer)
  }

  private createNTriplesSerializer(): NTriplesSerializer {
    return this.createSerializer(NTriplesSerializer)
  }

  private createXMLSerializer(): XMLSerializer {
    return this.createSerializer(XMLSerializer)
  }

  private createJSONLDSerializer(): JSONLDSerializer {
    return this.createSerializer(JSONLDSerializer)
  }

  statementsToN3(sts: Statement[]): string {
    const serializer = this.createN3Serializer()
    return serializer.serialize(sts)
  }

  statementsToNTriples(sts: Statement[]): string {
    const serializer = this.createNTriplesSerializer()
    return serializer.serialize(sts)
  }

  statementsToXML(sts: Statement[]): string {
    const serializer = this.createXMLSerializer()
    return serializer.serialize(sts)
  }

  statementsToJsonld(sts: Statement[]): string {
    const serializer = this.createJSONLDSerializer()
    return serializer.serialize(sts)
  }

  toN3(f: Formula): string {
    return this.statementsToN3(f.statements)
  }

  writeStore(write: (s: string) => void) {
    const kb = this.store
    const fetcher = kb.fetcher
    const session = fetcher && fetcher.appNode

    // The core data
    if (!(this.store instanceof IndexedFormula)) {
      throw new Error('Store is not an IndexedFormula')
    }

    const sources = (this.store as IndexedFormula).index[3]
    for (const s in sources) {
      // -> assume we can use -> as short for log:semantics
      const source = kb.fromNT(s)
      if (session && source.equals(session)) continue
      write(
        '\n' +
          this.atomicTermToN3(source) +
          ' ' +
          this.atomicTermToN3(kb.sym('http://www.w3.org/2000/10/swap/log#semantics')) +
          ' { ' +
          this.statementsToN3(kb.statementsMatching(undefined, undefined, undefined, source)) +
          ' }.\n'
      )
    }

    // The metadata from HTTP interactions:
    kb.statementsMatching(undefined, kb.sym('http://www.w3.org/2007/ont/link#requestedURI')).forEach(
      (st: Statement) => {
        write('\n<' + st.object.value + '> log:metadata {\n')
        const sts = kb.statementsMatching(undefined, undefined, undefined, st.subject)
        write(this.statementsToN3(sts))
        write('}.\n')
      }
    )

    // Inferences we have made ourselves not attributable to anyone else
    const metaSources: any[] = []
    if (session) metaSources.push(session)
    let metadata: Statement[] = []
    metaSources.forEach(source => {
      metadata = metadata.concat(kb.statementsMatching(undefined, undefined, undefined, source))
    })
    write(this.statementsToN3(metadata))
  }

  atomicTermToN3(expr: Node | DefaultGraph): string {
    return this.textConverter.atomicTermToN3(expr)
  }

  symbolToN3(x: NamedNode): string {
    return this.textConverter.symbolToN3(x)
  }

  explicitURI(uri: string): string {
    return this.textConverter.explicitURI(uri)
  }

  stringToN3(str: string, flags?: string): string {
    return this.textConverter.stringToN3(str, flags || this.flags)
  }

  isValidPNLocal(local: string): boolean {
    return this.textConverter.isValidPNLocal(local)
  }
}

/**
 * @deprecated Use implementations of {@link AbstractSerializer} instead
 * @see {@link N3Serializer}
 * @see {@link NTriplesSerializer}
 * @see {@link XMLSerializer}
 * @see {@link JSONLDSerializer}
 */
export default function createSerializer(store: Formula) {
  return new BackwardCompatibleSerializer(store)
}
