// @TODO(serializer-refactor): These tests are broken until changes made in the abstract-serializer.ts file, see L46 and L127
// import { expect } from 'chai'
// import { graph } from '../../../../src'
// import { createEmptySerializer } from '../utils/serializer-factories'

// describe('checkIntegrity', () => {
//   it('should pass when prefixes and namespaces are consistent', () => {
//     const serializer = createEmptySerializer(graph())
//     serializer.setPrefix('ex', 'http://example.org/')

//     expect(() => {
//       serializer.checkIntegrity()
//     }).to.not.throw()
//   })

//   it('should throw error when namespace exists but prefix not', () => {
//     const serializer = createEmptySerializer(graph())

//     // Manually break integrity
//     serializer.namespaces['ex'] = 'http://example.org/'

//     expect(() => {
//       serializer.checkIntegrity()
//     }).to.throw('Serializer integity error 1')
//   })

//   it('should throw error when namespace exists but prefix is incorrect', () => {
//     const serializer = createEmptySerializer(graph())
//     serializer.setPrefix('ex', 'http://example.org/')

//     // Manually break integrity
//     serializer.prefixes['http://example.org/'] = 'wrong'

//     expect(() => {
//       serializer.checkIntegrity()
//     }).to.throw('Serializer integity error 1')
//   })

//   it('should throw error when prefix exists but namespace is incorrect', () => {
//     const serializer = createEmptySerializer(graph())
//     serializer.setPrefix('ex', 'http://example.org/')

//     // Manually break integrity
//     serializer.namespaces['ex'] = 'http://wrong.org/'

//     expect(() => {
//       serializer.checkIntegrity()
//     }).to.throw('Serializer integity error 1')
//   })

//   it('should pass when overriding existing prefix for same namespace', () => {
//     const serializer = createEmptySerializer(graph())
//     serializer.setPrefix('ex', 'http://example.org/')

//     serializer.setPrefix('example', 'http://example.org/')

//     expect(() => {
//       serializer.checkIntegrity()
//     }).to.not.throw()
//   })

//   it('should throw error when prefix exists but namespace does not', () => {
//     const serializer = createEmptySerializer(graph())

//     // Manually break integrity
//     serializer.prefixes['http://example.org/'] = 'ex'

//     expect(() => {
//       serializer.checkIntegrity()
//     }).to.throw('Serializer integity error 2')
//   })

//   it('should pass with multiple consistent mappings', () => {
//     const serializer = createEmptySerializer(graph())
//     serializer.setPrefix('ex', 'http://example.org/')
//     serializer.setPrefix('foaf', 'http://xmlns.com/foaf/0.1/')
//     serializer.suggestPrefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#')

//     expect(() => {
//       serializer.checkIntegrity()
//     }).to.not.throw()
//   })
// })
