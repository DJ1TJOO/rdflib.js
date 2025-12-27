import Formula from './formula'
import {
  ContentType,
  JSONLDContentType,
  N3ContentType,
  N3LegacyContentType,
  NQuadsAltContentType,
  NQuadsContentType,
  NTriplesContentType,
  RDFXMLContentType,
  TurtleContentType,
  TurtleLegacyContentType,
} from './types'
import IndexedFormula from './store'
import { BlankNode, NamedNode } from './tf-types'
import type { AbstractSerializer } from './serializer/abstract-serializer'
import { XMLSerializer } from './serializer/xml-serializer'
import { N3Serializer } from './serializer/n3-serializer'
import { NTriplesSerializer } from './serializer/ntriples-serializer'
import { JSONLDSerializer } from './serializer/jsonld-serializer'

/**
 * Serialize to the appropriate format
 */
export default function serialize (
  /** The graph or nodes that should be serialized */
  target: Formula | NamedNode | BlankNode | null,
  /** The store */
  kb: Formula,
  base?: string | null,
  /**
   * The mime type.
   * Defaults to Turtle.
   */
  contentType?: string | ContentType,
  callback?: (err: Error | undefined | null, result?: string) => any,
  options?: {
    /**
     * A string of letters, each of which set an options
     * e.g. `deinprstux`
     */
    flags?: string,
    /**
     * A set of [prefix, uri] pairs that define namespace prefixes
     */
    namespaces?: Record<string, string>
  }
): string | undefined {
  base = base || target?.value
  const opts = options || {}
  contentType = contentType || TurtleContentType // text/n3 if complex?

  let sz: AbstractSerializer
  let flags = opts.flags
  try {
    switch (contentType) {
      case RDFXMLContentType:
        sz = new XMLSerializer(kb)        
        break
      case N3ContentType:
      case N3LegacyContentType:
        sz = new N3Serializer(kb)
        break
      case TurtleContentType:
      case TurtleLegacyContentType:
        // Suppress = for sameAs and => for implies; preserve any user-specified flags (e.g., 'o')
        flags = 'si' + (opts.flags ? (' ' + opts.flags) : '')
        sz = new N3Serializer(kb)
        break
      case NTriplesContentType:
        flags = 'deinprstux' // Suppress nice parts of N3 to make ntriples
        sz = new NTriplesSerializer(kb)
        break
      case JSONLDContentType:
        // turtle + dr (means no default, no relative prefix); preserve user flags
        flags = 'si dr' + (opts.flags ? (' ' + opts.flags) : '')
        sz = new JSONLDSerializer(kb)
        break
      case NQuadsContentType:
      case NQuadsAltContentType: // @@@ just outpout the quads? Does not work for collections
        flags = 'deinprstux q' // Suppress nice parts of N3 to make ntriples
        sz = new NTriplesSerializer(kb)
        break
      default:
        throw new Error('Serialize: Content-type ' + contentType + ' not supported for data write.')
    }
    
    if (flags) sz.setFlags(flags)
    var newSts = kb!.statementsMatching(undefined, undefined, undefined, target as NamedNode)

    // If an IndexedFormula, use the namespaces from the given graph as suggestions
    if ('namespaces' in kb) {
      sz.suggestNamespaces((kb as IndexedFormula).namespaces)
    }

    // use the provided options.namespaces are mandatory prefixes
    if (opts.namespaces) {
      sz.setNamespaces(opts.namespaces)
    }

    sz.setBase(base)
    const documentString = sz.serialize(newSts)
    return executeCallback(null, documentString)
  } catch (err) {
    if (callback) {
      // @ts-ignore
      return callback(err, undefined)
    }
    throw err // Don't hide problems from caller in sync mode
  }

  function executeCallback (err: Error | null | undefined, result: string | undefined): string | undefined {
    if (callback) {
      callback(err, result)
      return
    } else {
      return result as string
    }
  }
}
