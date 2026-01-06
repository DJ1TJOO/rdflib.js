import solidNs from 'solid-namespace'
import CanonicalDataFactory from '../factories/canonical-data-factory'
import { DataFactory } from '../factories/factory-types'
import Formula from '../formula'
import Node from '../node'
import Statement from '../statement'
import { createXSD } from '../xsd'

// Types for the Serializer
export interface SerializerPrefixes extends Record<string, string> {}
export interface SerializerNamespaces extends Record<string, string> {}
export type SerializerNamespacesUsed = Map<string, number>
export interface SerializerFormulas extends Record<string, Formula> {}

export abstract class AbstractSerializer {
  // @TODO(serializer-refactor): prefixchars and validPrefix are way too restrictive, for the n3 and xml qname specs
  public static readonly prefixchars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
  public static readonly validPrefix = new RegExp(/^[a-zA-Z][a-zA-Z0-9]*$/)

  store: Formula
  flags: string
  base: string | null
  defaultNamespace: string | null
  prefixes: SerializerPrefixes
  namespaces: SerializerNamespaces
  namespacesUsed: SerializerNamespacesUsed
  formulas: SerializerFormulas
  rdfFactory: DataFactory
  xsd: ReturnType<typeof createXSD>

  constructor(store: Formula) {
    this.store = store

    this.flags = ''

    this.base = null
    this.defaultNamespace = null

    this.prefixes = {} // suggested prefixes
    this.namespaces = {} // complementary
    this.namespacesUsed = new Map() // Keep track of used namespaces needed to generate

    const ns = solidNs()
    for (const prefix in ns) {
      const uri = ns[prefix]('')
      this.suggestPrefix(prefix, uri)
    }

    this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#') // XML code assumes this!
    this.suggestPrefix('xml', 'reserved:reservedForFutureUse') // XML reserves xml: in the spec.

    this.formulas = {} // remembering original formulae from hashes

    this.rdfFactory = store.rdfFactory || CanonicalDataFactory
    this.xsd = createXSD(this.rdfFactory)
  }

  abstract serialize(statements: Statement[]): string

  setBase(base: string | null = null) {
    this.base = base
    return this
  }

  setDefaultNamespace(namespace: string | null = null) {
    this.defaultNamespace = namespace
    return this
  }

  /**
   * Set serializer behavior flags. Letters can be combined with spaces.
   * Examples: 'si', 'deinprstux', 'si dr', 'o'.
   * Notable flags:
   *  - 'o': do not abbreviate to a prefixed name when the local part contains a dot
   */
  setFlags(flags: string = '') {
    this.flags = flags || ''
    return this
  }

  /**
   * Defines a set of [prefix, namespace] pairs to be used by this Serializer instance.
   * Overrides previous prefixes if any
   * @param namespaces
   * @return {Serializer}
   */
  setNamespaces(namespaces: Record<string, string>) {
    for (const px in namespaces) {
      this.setPrefix(px, namespaces[px])
    }
    return this
  }

  /**
   * Defines a namespace prefix, overriding any existing prefix for that URI
   * @param prefix
   * @param uri
   */
  setPrefix(prefix: string, uri: string) {
    if (!uri) return this // empty strings not suitable
    if (!this.isValidPrefix(prefix)) return this // not suitable

    // remove any existing prefix targeting this uri
    for (let existingPrefix in this.namespaces) {
      if (this.namespaces[existingPrefix] == uri) delete this.namespaces[existingPrefix]
    }

    // remove any existing mapping for this prefix
    for (let existingNs in this.prefixes) {
      if (this.prefixes[existingNs] == prefix) delete this.prefixes[existingNs]
    }

    this.prefixes[uri] = prefix
    this.namespaces[prefix] = uri

    return this
  }

  /* Accumulate Namespaces
   **
   ** These are only hints.  If two overlap, only one gets used
   ** There is therefore no guarantee in general.
   */
  suggestPrefix(prefix: string, uri: string) {
    if (!uri) return this // empty strings not suitable
    if (!this.isValidPrefix(prefix)) return this // not suitable

    if (prefix in this.namespaces || uri in this.prefixes) return this // already used

    this.prefixes[uri] = prefix
    this.namespaces[prefix] = uri

    return this
  }

  // Takes a namespace -> prefix map
  suggestNamespaces(namespaces: SerializerNamespaces) {
    for (const px in namespaces) {
      this.suggestPrefix(px, namespaces[px])
    }

    return this
  }

  // Make up an unused prefix for a random namespace
  makeUpPrefix(uri: string) {
    if (uri in this.prefixes) return this.prefixes[uri]

    let prefix = uri
    if (prefix.endsWith('#') || prefix.endsWith('/')) prefix = prefix.slice(0, -1)

    const slash = prefix.lastIndexOf('/')
    if (slash >= 0) prefix = prefix.slice(slash + 1)

    let i = 0
    while (i < prefix.length && AbstractSerializer.prefixchars.includes(prefix[i])) i++
    prefix = prefix.slice(0, i)

    if (prefix.length < 6 && this.tryUseMadeUpPrefix(prefix, uri)) return prefix // exact is best
    if (this.tryUseMadeUpPrefix(prefix.slice(0, 3), uri)) return prefix.slice(0, 3)
    if (this.tryUseMadeUpPrefix(prefix.slice(0, 2), uri)) return prefix.slice(0, 2)
    if (this.tryUseMadeUpPrefix(prefix.slice(0, 4), uri)) return prefix.slice(0, 4)
    if (this.tryUseMadeUpPrefix(prefix.slice(0, 1), uri)) return prefix.slice(0, 1)
    if (this.tryUseMadeUpPrefix(prefix.slice(0, 5), uri)) return prefix.slice(0, 5)

    if (!AbstractSerializer.validPrefix.test(prefix) || !this.isValidPrefix(prefix.slice(0, 3))) {
      prefix = 'n' // Otherwise the loop below may never termimnate
    }
    for (let j = 0; ; j++) if (this.tryUseMadeUpPrefix(prefix.slice(0, 3) + j, uri)) return prefix.slice(0, 3) + j
  }

  private tryUseMadeUpPrefix(prefix: string, uri: string) {
    if (!AbstractSerializer.validPrefix.test(prefix)) return false // bad format

    if (!this.isValidPrefix(prefix)) return false // not suitable
    if (prefix in this.namespaces || uri in this.prefixes) return false // already used

    this.prefixes[uri] = prefix
    this.namespaces[prefix] = uri

    return true
  }

  private isValidPrefix(prefix: string) {
    if (prefix.slice(0, 7) === 'default') return false // Try to weed these out
    if (prefix.slice(0, 2) === 'ns') return false //  From others inferior algos
    if (!prefix) return false // empty strings not suitable

    return true
  }

  useNamespace(namespace: string) {
    if (!(namespace in this.prefixes)) return this

    this.namespacesUsed.set(namespace, (this.namespacesUsed.get(namespace) ?? 0) + 1)
    return this
  }

  checkIntegrity() {
    for (const prefix in this.namespaces) {
      if (this.prefixes[this.namespaces[prefix]] !== prefix) {
        throw new Error(
          'Serializer integity error 1: ' +
            prefix +
            ', ' +
            this.namespaces[prefix] +
            ', ' +
            this.prefixes[this.namespaces[prefix]] +
            '!'
        )
      }
    }

    for (const namespace in this.prefixes) {
      if (this.namespaces[this.prefixes[namespace]] !== namespace) {
        throw new Error(
          'Serializer integity error 2: ' +
            namespace +
            ', ' +
            this.prefixes[namespace] +
            ', ' +
            this.namespaces[this.prefixes[namespace]] +
            '!'
        )
      }
    }
  }

  toStr(x: Node) {
    const s = x.toNT()
    if (x.termType === 'Graph') {
      this.formulas[s] = x as Formula // remember as reverse does not work
    }

    return s
  }

  fromStr(s: string) {
    if (s[0] === '{') {
      const x = this.formulas[s] as Formula | undefined // @TODO(serializer-refactor): Should we enable "noUncheckedIndexedAccess": true, this is a big change and should be done in a separate PR
      if (!x) {
        throw new Error('No formula object for ' + s)
      }

      return x
    }

    return this.store.fromNT(s) as Node // @TODO(serializer-refactor): Store fromNT should be typed, this should be done in a separate PR
  }
}
