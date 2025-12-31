import * as ttl2jsonld from '@frogcat/ttl2jsonld'
import Formula from '../formula'
import Statement from '../statement'
import { N3Serializer } from './n3-serializer'

export class JSONLDSerializer extends N3Serializer {
  constructor(store: Formula) {
    super(store)
  }

  serialize(statements: Statement[]): string {
    const turtleDoc = super.serialize(statements)
    const jsonldObj = ttl2jsonld.parse(turtleDoc)
    return JSON.stringify(jsonldObj, null, 2)
  }
}
