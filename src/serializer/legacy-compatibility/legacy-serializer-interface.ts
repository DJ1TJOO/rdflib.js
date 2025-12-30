import { DataFactory } from '../../factories/factory-types'
import Formula from '../../formula'
import NamedNode from '../../named-node'
import Node from '../../node'
import Statement from '../../statement'
import { DefaultGraph } from '../../tf-types'
import { SubjectType } from '../../types'
import { createXSD } from '../../xsd'

interface LegacySerializerPrefixes extends Record<string, string> {}
interface LegacySerializerNamespaces extends Record<string, string> {}
interface LegacySerializerNamespacesUsed extends Record<string, boolean> {}
interface LegacySerializerIncoming extends Record<string, SubjectType[]> {}

interface LegacyRootSubjectsStats {
  roots: SubjectType[]
  subjects: Record<string, Statement[]>
  rootsHash: Record<string, boolean>
  incoming: LegacySerializerIncoming
}

/**
 * Typed interface based on the old Serializer class
 * This interface ensures legacy compatibility and type safety for LegacyCompatibleSerializer
 *
 * @deprecated This interface is for legacy compatibility only. Use implementations of {@link AbstractSerializer} instead.
 */
export interface LegacySerializerInterface {
  flags: string
  base: string | null
  prefixes: LegacySerializerPrefixes
  namespaces: LegacySerializerNamespaces
  defaultNamespace: string | null
  namespacesUsed: LegacySerializerNamespacesUsed
  keywords: string[]
  prefixchars: string
  incoming: LegacySerializerIncoming | null
  formulas: Record<string, Formula>
  store: Formula
  rdfFactory: DataFactory
  xsd: ReturnType<typeof createXSD>

  setBase(base?: string | null): this
  setFlags(flags?: string): this
  setNamespaces(namespaces: LegacySerializerNamespaces): this
  setPrefix(prefix: string, uri: string): void
  suggestPrefix(prefix: string, uri: string): void
  suggestNamespaces(namespaces: LegacySerializerNamespaces): this

  toStr(x: Node): string
  fromStr(s: string): Node
  checkIntegrity(): void
  makeUpPrefix(uri: string): string
  rootSubjects(sts: Statement[]): LegacyRootSubjectsStats

  toN3(f: Formula): string
  statementsToN3(sts: Statement[]): string
  statementsToNTriples(sts: Statement[]): string
  statementsToXML(sts: Statement[]): string
  statementsToJsonld(sts: Statement[]): string

  atomicTermToN3(expr: Node | DefaultGraph): string
  symbolToN3(x: NamedNode): string
  explicitURI(uri: string): string
  stringToN3(str: string, flags?: string): string
  isValidPNLocal(local: string): boolean

  writeStore(write: (s: string) => void): void
}
