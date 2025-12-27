import solidNs from 'solid-namespace'
import CanonicalDataFactory from '../factories/canonical-data-factory'
import { DataFactory } from '../factories/factory-types'
import Formula from '../formula'
import Node from '../node'
import Statement from '../statement'
import { SubjectType } from '../types'
import { createXSD } from '../xsd'

// Types for the Serializer
export interface SerializerPrefixes extends Record<string, string> {}
export interface SerializerNamespaces extends Record<string, string> {}
export interface SerializerNamespacesUsed extends Record<string, boolean> {}
export interface SerializerIncoming extends Record<string, SubjectType[]> {}
export interface SerializerFormulas extends Record<string, Formula> {}

export abstract class AbstractSerializer {
  public static readonly validPrefix = new RegExp(/^[a-zA-Z][a-zA-Z0-9]*$/)

  flags: string
  base: string | null
  prefixes: SerializerPrefixes
  namespaces: SerializerNamespaces
  defaultNamespace: string | null
  namespacesUsed: SerializerNamespacesUsed
  keywords: string[]
  prefixchars: string
  incoming: SerializerIncoming | null
  formulas: SerializerFormulas
  store: Formula
  rdfFactory: DataFactory
  xsd: ReturnType<typeof createXSD>

  constructor(store: Formula) {
    this.flags = ''
    this.base = null

    this.defaultNamespace = null
    this.prefixes = {} // suggested prefixes
    this.namespaces = {} // complementary
    const nsKeys = Object.keys(solidNs())
    for (const i in nsKeys) {
      const uri = solidNs()[nsKeys[i]]('')
      const prefix = nsKeys[i]
      this.prefixes[uri] = prefix
      this.namespaces[prefix] = uri
    }

    this.suggestPrefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#') // XML code assumes this!
    this.suggestPrefix('xml', 'reserved:reservedForFutureUse') // XML reserves xml: in the spec.

    this.namespacesUsed = {} // Count actually used and so needed in @prefixes
    this.keywords = ['a'] // The only one we generate at the moment
    this.prefixchars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ'
    this.incoming = null // Array not calculated yet
    this.formulas = {} // remembering original formulae from hashes
    this.store = store
    this.rdfFactory = store.rdfFactory || CanonicalDataFactory
    this.xsd = createXSD(this.rdfFactory)
  }

  abstract serialize(statements: Statement[]): string

  setBase(base: string | null = null) {
    this.base = base
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

  toStr(x: Node) {
    var s = x.toNT()
    if (x.termType === 'Graph') {
      this.formulas[s] = x as Formula // remember as reverse does not work
    }
    return s
  }

  fromStr(s: string) {
    if (s[0] === '{') {
      var x = this.formulas[s] as Formula | undefined // @TODO(serializer-refactor): Should we enable "noUncheckedIndexedAccess": true
      if (!x) {
        console.log('No formula object for ' + s)
        // @TODO(serializer-refactor): This is to prevent undefined errors, is this okay to throw an error?
        throw new Error('No formula object for ' + s)
      }
      return x
    }
    return this.store.fromNT(s) as Node // @TODO(serializer-refactor): Store fromNT should be typed
  }

  /**
   * Defines a set of [prefix, namespace] pairs to be used by this Serializer instance.
   * Overrides previous prefixes if any
   * @param namespaces
   * @return {Serializer}
   */
  setNamespaces(namespaces: Record<string, string>) {
    for (var px in namespaces) {
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
    if (prefix.slice(0, 7) === 'default') return // Try to weed these out
    if (prefix.slice(0, 2) === 'ns') return //  From others inferior algos
    if (!prefix || !uri) return // empty strings not suitable

    // remove any existing prefix targeting this uri
    // for (let existingPrefix in this.namespaces) {
    //   if (this.namespaces[existingPrefix] == uri)
    //     delete this.namespaces[existingPrefix];
    // }

    // remove any existing mapping for this prefix
    for (let existingNs in this.prefixes) {
      if (this.prefixes[existingNs] == prefix) delete this.prefixes[existingNs]
    }

    this.prefixes[uri] = prefix
    this.namespaces[prefix] = uri
  }

  /* Accumulate Namespaces
   **
   ** These are only hints.  If two overlap, only one gets used
   ** There is therefore no guarantee in general.
   */
  suggestPrefix(prefix: string, uri: string) {
    if (prefix.slice(0, 7) === 'default') return // Try to weed these out
    if (prefix.slice(0, 2) === 'ns') return //  From others inferior algos
    if (!prefix || !uri) return // empty strings not suitable
    if (prefix in this.namespaces || uri in this.prefixes) return // already used
    this.prefixes[uri] = prefix
    this.namespaces[prefix] = uri
  }

  // Takes a namespace -> prefix map
  suggestNamespaces(namespaces: SerializerNamespaces) {
    for (var px in namespaces) {
      this.suggestPrefix(px, namespaces[px])
    }
    return this
  }

  // Make up an unused prefix for a random namespace
  makeUpPrefix(uri: string) {
    var p = uri
    function canUseMethod(this: AbstractSerializer, pp: string) {
      if (!AbstractSerializer.validPrefix.test(pp)) return false // bad format
      if (pp === 'ns') return false // boring
      if (pp in this.namespaces) return false // already used
      this.prefixes[uri] = pp
      this.namespaces[pp] = uri
      return pp
    }
    var canUse = canUseMethod.bind(this)

    if ('#/'.indexOf(p[p.length - 1]) >= 0) p = p.slice(0, -1)
    var slash = p.lastIndexOf('/')
    if (slash >= 0) p = p.slice(slash + 1)
    var i = 0
    while (i < p.length) {
      if (this.prefixchars.indexOf(p[i]) >= 0) {
        i++
      } else {
        break
      }
    }
    p = p.slice(0, i)

    if (p.length < 6 && canUse(p)) return p // exact is best
    if (canUse(p.slice(0, 3))) return p.slice(0, 3)
    if (canUse(p.slice(0, 2))) return p.slice(0, 2)
    if (canUse(p.slice(0, 4))) return p.slice(0, 4)
    if (canUse(p.slice(0, 1))) return p.slice(0, 1)
    if (canUse(p.slice(0, 5))) return p.slice(0, 5)
    if (!AbstractSerializer.validPrefix.test(p)) {
      p = 'n' // Otherwise the loop below may never termimnate
    }
    for (var j = 0; ; j++) if (canUse(p.slice(0, 3) + j)) return p.slice(0, 3) + j
  }

  checkIntegrity() {
    var p, ns
    for (p in this.namespaces) {
      if (this.prefixes[this.namespaces[p]] !== p) {
        throw new Error(
          'Serializer integity error 1: ' +
            p +
            ', ' +
            this.namespaces[p] +
            ', ' +
            this.prefixes[this.namespaces[p]] +
            '!'
        )
      }
    }
    for (ns in this.prefixes) {
      if (this.namespaces[this.prefixes[ns]] !== ns) {
        throw new Error(
          'Serializer integity error 2: ' +
            ns +
            ', ' +
            this.prefixes[ns] +
            ', ' +
            this.namespaces[this.prefixes[ns]] +
            '!'
        )
      }
    }
  }
}
