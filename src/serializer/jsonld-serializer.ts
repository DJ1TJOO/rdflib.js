import * as ttl2jsonld from "@frogcat/ttl2jsonld";
import Formula from "../formula";
import Statement from "../statement";
import { N3Serializer } from "./n3-serializer";

export class JSONLDSerializer extends N3Serializer {
  constructor(store: Formula) {
    super(store);
  }

  serialize(statements: Statement[]): string {
    // ttl2jsonld creates context keys for all ttl prefix
    // context keys must be absolute IRI ttl2jsonld@0.0.8
    /* function findId (itemObj) {
		if (itemObj['@id']) {
			const item = itemObj['@id'].split(':')
			if (keys[item[0]]) itemObj['@id'] = jsonldObj['@context'][item[0]] + item[1]
		}
		const itemValues = Object.values(itemObj)
		for (const i in itemValues) {
			if (typeof itemValues[i] !== 'string') { // @list contains array
			findId(itemValues[i])
			}
		}
		} */
    const turtleDoc = super.serialize(statements);
    const jsonldObj = ttl2jsonld.parse(turtleDoc);
    return JSON.stringify(jsonldObj, null, 2);
  }
}
