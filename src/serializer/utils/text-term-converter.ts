import { Literal, NamedNode } from '../../'
import Node from '../../node'
import { DefaultGraph } from '../../tf-types'
import * as Uri from '../../uri'
import { AbstractSerializer } from '../abstract-serializer'

export class TextTermConverter {
  public static readonly _notQNameChars = '\t\r\n !"#$%&\'()*,+/;<=>?@[\\]^`{|}~' // issue#228
  public static readonly _notNameChars = TextTermConverter._notQNameChars + ':'

  public static readonly forbidden1 = new RegExp(/[\\"\b\f\r\v\t\n\u0080-\uffff]/gm)
  public static readonly forbidden3 = new RegExp(/[\\"\b\f\r\v\u0080-\uffff]/gm)

  private readonly serializer: AbstractSerializer

  constructor(serializer: AbstractSerializer) {
    this.serializer = serializer
  }

  //  Deal with term level things and nesting with no bnode structure
  atomicTermToN3(expr: Node | DefaultGraph) {
    switch (expr.termType) {
      case 'BlankNode':
      case 'Variable':
        return expr.toNT()
      case 'Literal':
        var lit = expr as Literal
        var val = lit.value
        if (typeof val !== 'string') {
          throw new TypeError('Value of RDF literal node must be a string')
        }
        // var val = expr.value.toString() // should be a string already
        if (lit.datatype && this.serializer.flags.indexOf('x') < 0) {
          // Supress native numbers
          switch (lit.datatype.uri) {
            case 'http://www.w3.org/2001/XMLSchema#integer':
              return val

            case 'http://www.w3.org/2001/XMLSchema#decimal': // In Turtle, must have dot
              if (val.indexOf('.') < 0) val += '.0'
              return val

            case 'http://www.w3.org/2001/XMLSchema#double': {
              // Must force use of 'e'
              const eNotation = val.toLowerCase().indexOf('e') > 0
              if (val.indexOf('.') < 0 && !eNotation) val += '.0'
              if (!eNotation) val += 'e0'
              return val
            }

            case 'http://www.w3.org/2001/XMLSchema#boolean':
              return lit.value === '1' ? 'true' : 'false'
          }
        }
        var str = this.stringToN3(lit.value, this.serializer.flags)
        if (lit.language) {
          str += '@' + lit.language
        } else if (!lit.datatype.equals(this.serializer.xsd.string)) {
          str += '^^' + this.atomicTermToN3(lit.datatype)
        }
        return str
      case 'NamedNode':
        return this.symbolToN3(expr as NamedNode)
      case 'DefaultGraph':
        return ''
      default:
        throw new Error('Internal: atomicTermToN3 cannot handle ' + expr + ' of termType: ' + expr.termType)
    }
  }

  //  A single symbol, either in  <> or namespace notation
  symbolToN3(x: NamedNode) {
    // c.f. symbolString() in notation3.py
    var uri = x.uri
    var j = uri.indexOf('#')
    if (j < 0 && this.serializer.flags.indexOf('/') < 0) {
      j = uri.lastIndexOf('/')
    }
    if (
      j >= 0 &&
      this.serializer.flags.indexOf('p') < 0 &&
      // Can split at namespace but only if http[s]: URI or file: or ws[s] (why not others?)
      (uri.indexOf('http') === 0 || uri.indexOf('ws') === 0 || uri.indexOf('file') === 0)
    ) {
      var localid = uri.slice(j + 1)
      var namesp = uri.slice(0, j + 1)
      // Don't split if namespace is just the protocol (e.g., https://)
      // A valid namespace should have content after the protocol
      var minNamespaceLength = uri.indexOf('://') + 4 // e.g., "http://x" minimum
      // Also don't split if namespace is the base directory (would serialize as relative URI)
      var baseDir = this.serializer.base
        ? this.serializer.base.slice(
            0,
            Math.max(this.serializer.base.lastIndexOf('/'), this.serializer.base.lastIndexOf('#')) + 1
          )
        : null
      var namespaceIsBaseDir = baseDir && namesp === baseDir
      // If flag 'o' is present, forbid dots in local part when abbreviating
      var forbidDotLocal = this.serializer.flags.indexOf('o') >= 0 && localid.indexOf('.') >= 0
      var canSplit =
        !namespaceIsBaseDir && !forbidDotLocal && namesp.length > minNamespaceLength && this.isValidPNLocal(localid)
      /*
      if (uri.slice(0, j + 1) === this.base + '#') { // base-relative
        if (canSplit) {
          return ':' + uri.slice(j + 1) // assume deafult ns is local
        } else {
          return '<#' + uri.slice(j + 1) + '>'
        }
      }
      */
      if (canSplit) {
        if (
          this.serializer.defaultNamespace &&
          this.serializer.defaultNamespace === namesp &&
          this.serializer.flags.indexOf('d') < 0
        ) {
          // d -> suppress default
          if (this.serializer.flags.indexOf('k') >= 0 && this.serializer.keywords.indexOf(localid) < 0) {
            return localid
          }
          return ':' + localid
        }
        // this.checkIntegrity() //  @@@ Remove when not testing
        var prefix = this.serializer.prefixes[namesp]
        if (!prefix) prefix = this.serializer.makeUpPrefix(namesp)
        if (prefix) {
          this.serializer.namespacesUsed[namesp] = true
          return prefix + ':' + localid
        }
        // Fall though if can't do qname
      }
    }
    return this.explicitURI(uri)
  }

  //  stringToN3:  String escaping for N3
  stringToN3(str: string, flags?: string) {
    if (!flags) flags = 'e'
    var res = ''
    var i: number, j: number, k: number
    var delim: string
    var forbidden: RegExp
    if (
      str.length > 20 && // Long enough to make sense
      str.slice(-1) !== '"' && // corner case'
      flags.indexOf('n') < 0 && // Force single line
      (str.indexOf('\n') > 0 || str.indexOf('"') > 0)
    ) {
      delim = '"""'
      forbidden = TextTermConverter.forbidden3
    } else {
      delim = '"'
      forbidden = TextTermConverter.forbidden1
    }
    for (i = 0; i < str.length; ) {
      forbidden.lastIndex = 0
      var m = forbidden.exec(str.slice(i))
      if (m == null) break
      j = i + forbidden.lastIndex - 1
      res += str.slice(i, j)
      var ch = str[j]
      if (ch === '"' && delim === '"""' && str.slice(j, j + 3) !== '"""') {
        res += ch
      } else {
        k = '\b\f\r\t\v\n\\"'.indexOf(ch) // No escaping of bell (7)?
        if (k >= 0) {
          res += '\\' + 'bfrtvn\\"'[k]
        } else {
          if (flags.indexOf('e') >= 0) {
            // Unicode escaping in strings not unix style
            res += '\\u' + ('000' + ch.charCodeAt(0).toString(16).toLowerCase()).slice(-4)
          } else {
            // no 'e' flag
            res += ch
          }
        }
      }
      i = j + 1
    }
    return delim + res + str.slice(i) + delim
  }

  explicitURI(uri: string) {
    if (this.serializer.flags.indexOf('r') < 0 && this.serializer.base) {
      uri = Uri.refTo(this.serializer.base, uri)
    } else if (this.serializer.flags.indexOf('u') >= 0) {
      // Unicode encoding NTriples style
      uri = this.backslashUify(uri)
    } else {
      uri = this.hexify(decodeURI(uri))
    }
    return '<' + uri + '>'
  }

  // Validate if a string is a valid PN_LOCAL per Turtle 1.1 spec
  // Allows dots inside the local name but not as trailing character
  // Also allows empty local names (for URIs ending in / or #)
  isValidPNLocal(local: string) {
    // Empty local name is valid (e.g., ex: for http://example.com/)
    if (local.length === 0) return true

    // Cannot end with a dot
    if (local[local.length - 1] === '.') return false

    // Check each character (allow dots mid-string)
    for (var i = 0; i < local.length; i++) {
      var ch = local[i]
      // Dot is allowed unless it's the last character (checked above)
      if (ch === '.') continue
      // Other characters must not be in the blacklist
      if (TextTermConverter._notNameChars.indexOf(ch) >= 0) {
        return false
      }
    }
    return true
  }

  // String escaping utilities

  private hexify(str: string) {
    // also used in parser
    return encodeURI(str)
  }

  private backslashUify(str: string) {
    var res = ''
    var k: number
    for (var i = 0; i < str.length; i++) {
      k = str.charCodeAt(i)
      if (k > 65535) {
        res += '\\U' + ('00000000' + k.toString(16)).slice(-8) // convert to upper?
      } else if (k > 126) {
        res += '\\u' + ('0000' + k.toString(16)).slice(-4)
      } else {
        res += str[i]
      }
    }
    return res
  }
}
