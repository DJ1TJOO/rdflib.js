import { AbstractSerializer, Formula, N3Serializer, Statement } from '../../../../../src'
import OldSerializer, { type Serializer } from '../../../../../src/serializer/_old/serializer-old'

class OldSerializerImpl extends AbstractSerializer {
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

export function createN3Serializer(store: Formula): AbstractSerializer {
  return new N3Serializer(store)
}
