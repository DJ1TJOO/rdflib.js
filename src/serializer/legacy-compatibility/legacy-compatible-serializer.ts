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
import { LegacySerializerInterface, LegacySerializerNamespacesUsed } from './legacy-serializer-interface'

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
export class LegacyCompatibleSerializer implements LegacySerializerInterface {
  prefixchars = AbstractSerializer.prefixchars
  validPrefix = AbstractSerializer.validPrefix

  keywords = TextTermConverter.keywords
  _notQNameChars = TextTermConverter._notQNameChars
  _notNameChars = TextTermConverter._notNameChars
  forbidden1 = TextTermConverter.forbiddenSingleLine
  forbidden3 = TextTermConverter.forbiddenMultiline

  incoming: LegacySerializerInterface['incoming'] | null

  private internalSerializer: InternalSerializer
  protected textConverter: TextTermConverter
  protected treeBuilder: TreeBuilder

  get flags() {
    return this.internalSerializer.flags
  }
  set flags(value: LegacySerializerInterface['flags']) {
    this.internalSerializer.flags = value
  }

  get base() {
    return this.internalSerializer.base
  }
  set base(value: LegacySerializerInterface['base']) {
    this.internalSerializer.base = value
  }

  get defaultNamespace() {
    return this.internalSerializer.defaultNamespace
  }
  set defaultNamespace(value: LegacySerializerInterface['defaultNamespace']) {
    this.internalSerializer.defaultNamespace = value
  }

  get prefixes() {
    return this.internalSerializer.prefixes
  }
  set prefixes(value: LegacySerializerInterface['prefixes']) {
    this.internalSerializer.prefixes = value
  }

  get namespaces() {
    return this.internalSerializer.namespaces
  }
  set namespaces(value: LegacySerializerInterface['namespaces']) {
    this.internalSerializer.namespaces = value
  }

  get namespacesUsed() {
    // Convert Map<string, number> to Record<string, boolean>
    const namespacesUsed: LegacySerializerNamespacesUsed = {}
    for (const [namespace, count] of this.internalSerializer.namespacesUsed) {
      if (count > 0) {
        namespacesUsed[namespace] = true
      }
    }
    return namespacesUsed
  }
  set namespacesUsed(value: LegacySerializerInterface['namespacesUsed']) {
    const namespacesUsedMap = new Map<string, number>()
    for (const namespace in value) {
      if (value[namespace]) {
        namespacesUsedMap.set(namespace, 1)
      }
    }
    this.internalSerializer.namespacesUsed = namespacesUsedMap
  }

  get formulas() {
    return this.internalSerializer.formulas
  }
  set formulas(value: LegacySerializerInterface['formulas']) {
    this.internalSerializer.formulas = value
  }

  get store() {
    return this.internalSerializer.store
  }
  set store(value: LegacySerializerInterface['store']) {
    this.internalSerializer.store = value
  }

  get rdfFactory() {
    return this.internalSerializer.rdfFactory
  }
  set rdfFactory(value: LegacySerializerInterface['rdfFactory']) {
    this.internalSerializer.rdfFactory = value
  }

  get xsd() {
    return this.internalSerializer.xsd
  }
  set xsd(value: LegacySerializerInterface['xsd']) {
    this.internalSerializer.xsd = value
  }

  constructor(store: Formula) {
    this.internalSerializer = new InternalSerializer(store)
    this.textConverter = new TextTermConverter(this.internalSerializer)
    this.treeBuilder = new TreeBuilder(this.internalSerializer)
    this.incoming = null
  }

  setBase(base?: string | null): this {
    this.internalSerializer.setBase(base)
    return this
  }

  setFlags(flags?: string): this {
    this.internalSerializer.setFlags(flags)
    return this
  }

  setNamespaces(namespaces: LegacySerializerInterface['namespaces']): this {
    this.internalSerializer.setNamespaces(namespaces)
    return this
  }

  setPrefix(prefix: string, uri: string): void {
    this.internalSerializer.setPrefix(prefix, uri)
  }

  suggestPrefix(prefix: string, uri: string): void {
    this.internalSerializer.suggestPrefix(prefix, uri)
  }

  suggestNamespaces(namespaces: LegacySerializerInterface['namespaces']): this {
    this.internalSerializer.suggestNamespaces(namespaces)
    return this
  }

  toStr(x: Node): string {
    return this.internalSerializer.toStr(x)
  }

  fromStr(s: string): Node {
    return this.internalSerializer.fromStr(s)
  }

  checkIntegrity(): void {
    this.internalSerializer.checkIntegrity()
  }

  makeUpPrefix(uri: string): string {
    return this.internalSerializer.makeUpPrefix(uri)
  }

  private createSerializer<T extends AbstractSerializer>(SerializerClass: new (store: Formula) => T): T {
    const serializer = new SerializerClass(this.store)

    Object.assign(serializer, this.internalSerializer)

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

    if (this.base && !this.defaultNamespace) {
      serializer.setDefaultNamespace(this.base + '#')
    }
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
    const result = this.treeBuilder.rootSubjects(sts)
    this.incoming = result.incoming
    return result
  }
}

class InternalSerializer extends AbstractSerializer {
  serialize(statements: Statement[]): string {
    throw new Error('InternalSerializer should not be serialized directly')
  }
}
