import { expect } from 'chai'
import fs from 'fs'
import path from 'path'
import { AbstractSerializer, Formula } from '../../../../../src'
import {
  createN3Serializer,
  createNTriplesSerializer,
  createOldN3Serializer,
  createOldNTriplesSerializer,
  createOldXMLSerializer,
  createXMLSerializer,
  SerializerFactory
} from '../../utils/serializer-factories'

function serializeEqual(
  factory: SerializerFactory,
  store: Formula,
  file: string,
  configure?: (serializer: AbstractSerializer) => void
) {
  const serializer = factory(store)
  configure?.(serializer)

  const serializedString = serializer.serialize(store.statements)

  const expectedPath = path.join(__dirname, '..', 'expected', file)
  const expected = fs.readFileSync(expectedPath).toString()

  expect(serializedString).to.equal(expected)
}

function serializeError(
  factory: SerializerFactory,
  store: Formula,
  error: string,
  configure?: (serializer: AbstractSerializer) => void
) {
  const serializer = factory(store)
  configure?.(serializer)

  expect(() => {
    serializer.serialize(store.statements)
  }).to.throw(error)
}

const fileTypeFactoryMapping: Record<string, SerializerFactory[]> = {
  n3: [createN3Serializer, createOldN3Serializer],
  nt: [createNTriplesSerializer, createOldNTriplesSerializer],
  rdf: [createXMLSerializer, createOldXMLSerializer]
} as const

export function serializeEqualMultiple(
  store: Formula,
  file: string,
  factories: (keyof typeof fileTypeFactoryMapping)[],
  configure?: (serializer: AbstractSerializer) => void
) {
  const flatFactories = factories.flatMap(type => fileTypeFactoryMapping[type].map(factory => ({ factory, type })))
  for (const { factory, type } of flatFactories) {
    it(`${type} using ${factory.name.replace('create', '')}`, () => {
      serializeEqual(factory, store, `${file}.${type}`, configure)
    })
  }
}

export function serializeErrorMultiple(
  store: Formula,
  error: string,
  factories: (keyof typeof fileTypeFactoryMapping)[],
  configure?: (serializer: AbstractSerializer) => void
) {
  const flatFactories = factories.flatMap(type => fileTypeFactoryMapping[type].map(factory => ({ factory, type })))
  for (const { factory, type } of flatFactories) {
    it(`Expected error: ${error} for ${type} using ${factory.name.replace('create', '')}`, () => {
      serializeError(factory, store, error, configure)
    })
  }
}
