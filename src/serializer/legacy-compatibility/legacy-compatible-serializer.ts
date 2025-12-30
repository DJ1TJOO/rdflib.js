import { NamedNode } from '../..'
import Formula from '../../formula'
import Node from '../../node'
import Statement from '../../statement'
import { DefaultGraph } from '../../tf-types'
import { AbstractSerializer } from '../abstract-serializer'
import { JSONLDSerializer } from '../jsonld-serializer'
import { N3Serializer } from '../n3-serializer'
import { NTriplesSerializer } from '../ntriples-serializer'
import { TextTermConverter } from '../utils/text-term-converter'
import { TreeBuilder } from '../utils/tree-builder'
import { WriteStoreSerializer } from '../write-store-serializer'
import { XMLSerializer } from '../xml-serializer'
import { LegacySerializerInterface } from './legacy-serializer-interface'

/**
 * @deprecated Use implementations of {@link AbstractSerializer} instead
 * @see {@link N3Serializer}
 * @see {@link NTriplesSerializer}
 * @see {@link XMLSerializer}
 * @see {@link JSONLDSerializer}
 */
export default function createSerializer(store: Formula) {
  return new LegacyCompatibleSerializer(store)
}

/**
 * @deprecated Use implementations of {@link AbstractSerializer} instead or see the {@link serialize} function
 * @see {@link serialize}
 * @see {@link N3Serializer}
 * @see {@link NTriplesSerializer}
 * @see {@link XMLSerializer}
 * @see {@link JSONLDSerializer}
 */
export class LegacyCompatibleSerializer extends AbstractSerializer implements LegacySerializerInterface {
  _notQNameChars = TextTermConverter._notQNameChars
  _notNameChars = TextTermConverter._notNameChars
  validPrefix = AbstractSerializer.validPrefix
  forbidden1 = TextTermConverter.forbidden1
  forbidden3 = TextTermConverter.forbidden3

  protected textConverter = new TextTermConverter(this)
  protected treeBuilder = new TreeBuilder(this)

  constructor(store: Formula) {
    super(store)
  }

  serialize(statements: Statement[]): string {
    throw new Error(
      'LegacyCompatibleSerializer is not implemented, please use a concrete implementation of AbstractSerializer instead'
    )
  }

  private createSerializer<T extends AbstractSerializer>(SerializerClass: new (store: Formula) => T): T {
    const serializer = new SerializerClass(this.store)

    // Do not copy LegacyCompatibleSerializer specific properties
    const { textConverter, _notQNameChars, _notNameChars, validPrefix, forbidden1, forbidden3, ...propsToCopy } = this
    Object.assign(serializer, propsToCopy)

    return serializer
  }

  private createN3Serializer() {
    return this.createSerializer(N3Serializer)
  }

  private createNTriplesSerializer() {
    return this.createSerializer(NTriplesSerializer)
  }

  private createXMLSerializer() {
    return this.createSerializer(XMLSerializer)
  }

  private createJSONLDSerializer() {
    return this.createSerializer(JSONLDSerializer)
  }

  private createWriteStoreSerializer() {
    // @TODO(serializer-refactor): This assumption was already made, but is not safe since index is missing from Formula, and required for WriteStoreSerializer.writeStore to function
    return this.createSerializer(WriteStoreSerializer as unknown as new (store: Formula) => WriteStoreSerializer)
  }

  statementsToN3(sts: Statement[]) {
    const serializer = this.createN3Serializer()
    return serializer.serialize(sts)
  }

  statementsToNTriples(sts: Statement[]) {
    const serializer = this.createNTriplesSerializer()
    return serializer.serialize(sts)
  }

  statementsToXML(sts: Statement[]) {
    const serializer = this.createXMLSerializer()
    return serializer.serialize(sts)
  }

  statementsToJsonld(sts: Statement[]) {
    const serializer = this.createJSONLDSerializer()
    return serializer.serialize(sts)
  }

  toN3(f: Formula) {
    return this.statementsToN3(f.statements)
  }

  writeStore(write: (s: string) => void) {
    const serializer = this.createWriteStoreSerializer()
    serializer.writeStore(write)
  }

  atomicTermToN3(expr: Node | DefaultGraph) {
    return this.textConverter.atomicTermToN3(expr)
  }

  symbolToN3(x: NamedNode) {
    return this.textConverter.symbolToN3(x)
  }

  explicitURI(uri: string) {
    return this.textConverter.explicitURI(uri)
  }

  stringToN3(str: string, flags?: string) {
    return this.textConverter.stringToN3(str, flags || this.flags)
  }

  isValidPNLocal(local: string) {
    return this.textConverter.isValidPNLocal(local)
  }

  rootSubjects(sts: Statement[]) {
    return this.treeBuilder.rootSubjects(sts)
  }
}
