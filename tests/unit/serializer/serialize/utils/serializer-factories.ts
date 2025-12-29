import {
  AbstractSerializer,
  Formula,
  N3Serializer,
  NTriplesSerializer,
  Statement,
  XMLSerializer
} from '../../../../../src'
import OldSerializer, { type Serializer } from '../../../../../src/serializer/_old/serializer-old'

export type SerializerFactory = (store: Formula) => AbstractSerializer

export function createN3Serializer(store: Formula): AbstractSerializer {
  return new N3Serializer(store)
}

export function createNTriplesSerializer(store: Formula): AbstractSerializer {
  return new NTriplesSerializer(store)
}

export function createXMLSerializer(store: Formula): AbstractSerializer {
  return new XMLSerializer(store)
}

class OldSerializerN3 extends AbstractSerializer {
  private oldSerializer: Serializer
  constructor(store: Formula) {
    super(store)
    this.oldSerializer = OldSerializer(store)
  }

  serialize(sts: Statement[]): string {
    const { oldSerializer, ...props } = this
    Object.assign(oldSerializer, props)
    return this.oldSerializer.statementsToN3(sts)
  }
}

class OldSerializerNTriples extends AbstractSerializer {
  private oldSerializer: Serializer
  constructor(store: Formula) {
    super(store)
    this.oldSerializer = OldSerializer(store)
  }

  serialize(sts: Statement[]): string {
    const { oldSerializer, ...props } = this
    Object.assign(oldSerializer, props)
    return this.oldSerializer.statementsToNTriples(sts)
  }
}

class OldSerializerXML extends AbstractSerializer {
  private oldSerializer: Serializer
  constructor(store: Formula) {
    super(store)
    this.oldSerializer = OldSerializer(store)
  }

  serialize(sts: Statement[]): string {
    const { oldSerializer, ...props } = this
    Object.assign(oldSerializer, props)
    return this.oldSerializer.statementsToXML(sts)
  }
}

export function createOldN3Serializer(store: Formula): AbstractSerializer {
  return new OldSerializerN3(store)
}

export function createOldNTriplesSerializer(store: Formula): AbstractSerializer {
  return new OldSerializerNTriples(store)
}

export function createOldXMLSerializer(store: Formula): AbstractSerializer {
  return new OldSerializerXML(store)
}
