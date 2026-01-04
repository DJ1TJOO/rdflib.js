import { Literal, NamedNode } from '../../'
import Node from '../../node'
import { DefaultGraph } from '../../tf-types'
import * as Uri from '../../uri'
import { AbstractSerializer } from '../abstract-serializer'

export class TextTermConverter {
  public static readonly keywords = ['a'] // The only one we generate at the moment
  public static readonly _notQNameChars = '\t\r\n !"#$%&\'()*,+/;<=>?@[\\]^`{|}~' // issue#228
  public static readonly _notNameChars = TextTermConverter._notQNameChars + ':'

  public static readonly forbiddenSingleLine = new RegExp(/[\\"\b\f\r\v\t\n\u0080-\uffff]/gm)
  public static readonly forbiddenMultiline = new RegExp(/[\\"\b\f\r\v\u0080-\uffff]/gm)

  private readonly serializer: AbstractSerializer

  constructor(serializer: AbstractSerializer) {
    this.serializer = serializer
  }

  //  Deal with term level things and nesting with no bnode structure
  atomicTermToN3(node: Node | DefaultGraph) {
    switch (node.termType) {
      case 'BlankNode':
      case 'Variable':
        return node.toNT()
      case 'Literal':
        const literal = node as Literal
        let value = literal.value
        if (typeof value !== 'string') {
          throw new TypeError('Value of RDF literal node must be a string')
        }

        if (literal.datatype && this.serializer.flags.indexOf('x') < 0) {
          // Supress native numbers
          switch (literal.datatype.uri) {
            case 'http://www.w3.org/2001/XMLSchema#integer':
              return value

            case 'http://www.w3.org/2001/XMLSchema#decimal': // In Turtle, must have dot
              if (value.indexOf('.') < 0) value += '.0'
              return value

            case 'http://www.w3.org/2001/XMLSchema#double': {
              // Must force use of 'e'
              const eNotation = value.toLowerCase().indexOf('e') > 0
              if (value.indexOf('.') < 0 && !eNotation) value += '.0'
              if (!eNotation) value += 'e0'
              return value
            }

            case 'http://www.w3.org/2001/XMLSchema#boolean':
              return literal.value === '1' ? 'true' : 'false'
          }
        }

        let expression = this.stringToN3(literal.value)
        if (literal.language) {
          expression += '@' + literal.language
        } else if (!literal.datatype.equals(this.serializer.xsd.string)) {
          expression += '^^' + this.atomicTermToN3(literal.datatype)
        }
        return expression
      case 'NamedNode':
        return this.symbolToN3(node as NamedNode)
      case 'DefaultGraph':
        return ''
      default:
        throw new Error('Internal: atomicTermToN3 cannot handle ' + node + ' of termType: ' + node.termType)
    }
  }

  //  A single symbol, either in  <> or namespace notation
  symbolToN3(node: NamedNode) {
    // c.f. symbolString() in notation3.py
    const uri = node.uri
    let separator = uri.indexOf('#')
    if (separator < 0 && this.serializer.flags.indexOf('/') < 0) {
      separator = uri.lastIndexOf('/')
    }

    if (
      separator < 0 ||
      this.serializer.flags.indexOf('p') >= 0 ||
      // Can split at namespace but only if http[s]: URI or file: or ws[s] (why not others?)
      !(uri.indexOf('http') === 0 || uri.indexOf('ws') === 0 || uri.indexOf('file') === 0)
    ) {
      return this.explicitURI(uri)
    }

    const namespace = uri.slice(0, separator + 1)
    const localname = uri.slice(separator + 1)

    // Don't split if namespace is just the protocol (e.g., https://)
    // A valid namespace should have content after the protocol
    const minNamespaceLength = uri.indexOf('://') + 4 // e.g., "http://x" minimum

    // Also don't split if namespace is the base directory (would serialize as relative URI)
    let baseDir = this.serializer.base
    if (baseDir) {
      // let baseDirSeparator = baseDir.indexOf('#')
      // if (baseDirSeparator < 0 && this.serializer.flags.indexOf('/') < 0) {
      //   baseDirSeparator = baseDir.lastIndexOf('/')
      // }
      // baseDir = baseDir.slice(0, baseDirSeparator + 1)

      // @TODO(serializer-refactor): Should this not work as above? Same as L76-79
      const lastIndexOfHash = baseDir.lastIndexOf('#')
      const lastIndexOfSlash = baseDir.lastIndexOf('/')
      const maxIndex = Math.max(lastIndexOfSlash, lastIndexOfHash)
      baseDir = baseDir.slice(0, maxIndex + 1)
    }

    const namespaceIsBaseDir = baseDir && namespace === baseDir

    // If flag 'o' is present, forbid dots in local part when abbreviating
    const forbidDotLocal = this.serializer.flags.indexOf('o') >= 0 && localname.indexOf('.') >= 0

    const cannotSplit =
      namespaceIsBaseDir || forbidDotLocal || namespace.length <= minNamespaceLength || !this.isValidPNLocal(localname)
    if (cannotSplit) {
      return this.explicitURI(uri)
    }

    if (
      this.serializer.defaultNamespace &&
      this.serializer.defaultNamespace === namespace &&
      this.serializer.flags.indexOf('d') < 0
    ) {
      // d -> suppress default
      if (this.serializer.flags.indexOf('k') >= 0 && TextTermConverter.keywords.indexOf(localname) < 0) {
        return localname
      }
      return ':' + localname
    }

    // this.checkIntegrity() //  @@@ Remove when not testing

    let prefix = this.serializer.prefixes[namespace]
    if (!prefix) prefix = this.serializer.makeUpPrefix(namespace)

    this.serializer.namespacesUsed[namespace] = true
    return prefix + ':' + localname
  }

  //  stringToN3:  String escaping for N3
  stringToN3(string: string, flags?: string) {
    const flagsToUse = flags || this.serializer.flags || 'e'
    const forceSingleLine = flagsToUse.indexOf('n') >= 0
    const escapeUnicode = flagsToUse.indexOf('e') >= 0

    const multiline =
      string.length > 20 && // Long enough to make sense
      string.slice(-1) !== '"' && // corner case'
      (string.indexOf('\n') > 0 || string.indexOf('"') > 0) &&
      !forceSingleLine

    const delim = multiline ? '"""' : '"'
    const forbidden = multiline ? TextTermConverter.forbiddenMultiline : TextTermConverter.forbiddenSingleLine

    let result = ''
    let i: number
    for (i = 0; i < string.length; ) {
      forbidden.lastIndex = 0
      if (forbidden.exec(string.slice(i)) == null) break

      // Index of forbidden character
      const j = i + forbidden.lastIndex - 1

      // Add allowed characters that are between forbidden characters to result
      result += string.slice(i, j)
      i += forbidden.lastIndex

      const char = string[j]

      // Single quotes allowed in multiline strings but not three in a row
      if (char === '"' && multiline && string.slice(j, j + 3) !== delim) {
        result += char
        continue
      }

      const k = '\b\f\r\t\v\n\\"'.indexOf(char) // No escaping of bell (7)?
      if (k >= 0) {
        result += '\\' + 'bfrtvn\\"'[k]
      } else if (escapeUnicode) {
        // Unicode escaping in strings not unix style
        result += '\\u' + ('000' + char.charCodeAt(0).toString(16).toLowerCase()).slice(-4)
      } else {
        result += char
      }
    }

    return delim + result + string.slice(i) + delim
  }

  explicitURI(uri: string) {
    if (this.serializer.flags.indexOf('r') < 0 && this.serializer.base) {
      uri = Uri.refTo(this.serializer.base, uri)
    } else if (this.serializer.flags.indexOf('u') >= 0) {
      // Unicode encoding NTriples style
      uri = this.backslashUify(uri)
    } else {
      uri = encodeURI(decodeURI(uri))
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
    for (let i = 0; i < local.length; i++) {
      const char = local[i]

      // Dot is allowed unless it's the last character (checked above)
      if (char === '.') continue

      // Other characters must not be in the blacklist
      if (TextTermConverter._notNameChars.indexOf(char) >= 0) {
        return false
      }
    }
    return true
  }

  // String escaping utilities

  private backslashUify(string: string) {
    let result = ''
    for (let i = 0; i < string.length; i++) {
      const code = string.charCodeAt(i)
      if (code > 65535) {
        result += '\\U' + ('00000000' + code.toString(16)).slice(-8) // convert to upper?
      } else if (code > 126) {
        result += '\\u' + ('0000' + code.toString(16)).slice(-4)
      } else {
        result += string[i]
      }
    }
    return result
  }
}
