import { BlankNode, blankNode, Collection, graph, lit, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('big store with all kinds of nodes', () => {
  BlankNode.nextId = 0
  afterEach(() => {
    BlankNode.nextId = 0
  })

  describe('should serialize a comprehensive store with all node types', () => {
    const store = graph()

    const person1 = sym('http://example.com/person1')
    const person2 = sym('http://example.com/person2')
    const person3 = sym('http://example.com/person3')
    const org1 = sym('http://example.com/org1')
    const org2 = sym('http://example.com/org2')
    const graph1 = sym('http://example.com/graph1')
    const graph2 = sym('http://example.com/graph2')

    const bnode1 = blankNode('b1')
    const bnode2 = blankNode('b2')
    const bnode3 = blankNode()
    const bnode4 = blankNode('b4')

    const rdfType = sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
    const foafName = sym('http://xmlns.com/foaf/0.1/name')
    const foafAge = sym('http://xmlns.com/foaf/0.1/age')
    const foafKnows = sym('http://xmlns.com/foaf/0.1/knows')
    const foafMember = sym('http://xmlns.com/foaf/0.1/member')
    const dcTitle = sym('http://purl.org/dc/elements/1.1/title')
    const dcDescription = sym('http://purl.org/dc/elements/1.1/description')
    const schemaEmail = sym('http://schema.org/email')
    const schemaAddress = sym('http://schema.org/address')

    store.add(st(person1, rdfType, sym('http://xmlns.com/foaf/0.1/Person')))
    store.add(st(person1, foafName, lit('Alice')))
    store.add(st(person1, foafAge, lit('30', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))))
    store.add(st(person1, schemaEmail, lit('alice@example.com')))

    store.add(st(person2, rdfType, sym('http://xmlns.com/foaf/0.1/Person')))
    store.add(st(person2, foafName, lit('Bob', 'en')))
    store.add(st(person2, foafName, lit('Robert', 'en')))
    store.add(st(person2, foafAge, lit('25', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))))

    store.add(st(person3, rdfType, sym('http://xmlns.com/foaf/0.1/Person')))
    store.add(st(person3, foafName, lit('Charlie')))
    store.add(st(person3, foafAge, lit('35', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))))

    store.add(st(org1, rdfType, sym('http://xmlns.com/foaf/0.1/Organization')))
    store.add(st(org1, foafName, lit('Acme Corp')))
    store.add(st(org1, dcDescription, lit('A company that makes widgets\nand other products.')))

    store.add(st(org2, rdfType, sym('http://xmlns.com/foaf/0.1/Organization')))
    store.add(st(org2, foafName, lit('Tech Inc')))

    store.add(st(person1, foafKnows, person2))
    store.add(st(person1, foafKnows, person3))
    store.add(st(person2, foafKnows, person3))
    store.add(st(person1, foafMember, org1))
    store.add(st(person2, foafMember, org1))
    store.add(st(person3, foafMember, org2))

    store.add(st(bnode1, rdfType, sym('http://example.com/Address')))
    store.add(st(bnode1, schemaAddress, lit('123 Main St')))
    store.add(st(person1, schemaAddress, bnode1))

    store.add(st(bnode2, rdfType, sym('http://example.com/Address')))
    store.add(st(bnode2, schemaAddress, lit('456 Oak Ave')))
    store.add(st(person2, schemaAddress, bnode2))

    store.add(st(bnode3, rdfType, sym('http://example.com/ContactInfo')))
    store.add(st(bnode3, schemaEmail, lit('contact@example.com')))
    store.add(st(bnode3, schemaAddress, bnode4))
    store.add(st(bnode4, schemaAddress, lit('789 Pine Rd')))
    store.add(st(org1, sym('http://example.com/contact'), bnode3))

    store.add(
      st(
        person1,
        sym('http://example.com/weight'),
        lit('65.5', undefined, sym('http://www.w3.org/2001/XMLSchema#decimal'))
      )
    )
    store.add(
      st(
        person1,
        sym('http://example.com/height'),
        lit('1.75', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
      )
    )
    store.add(
      st(
        person1,
        sym('http://example.com/isActive'),
        lit('1', undefined, sym('http://www.w3.org/2001/XMLSchema#boolean'))
      )
    )
    store.add(
      st(
        person2,
        sym('http://example.com/isActive'),
        lit('0', undefined, sym('http://www.w3.org/2001/XMLSchema#boolean'))
      )
    )
    store.add(
      st(
        person1,
        sym('http://example.com/birthDate'),
        lit('1993-01-15T00:00:00Z', undefined, sym('http://www.w3.org/2001/XMLSchema#dateTime'))
      )
    )
    store.add(
      st(
        person2,
        sym('http://example.com/birthDate'),
        lit('1998-05-20T12:30:00Z', undefined, sym('http://www.w3.org/2001/XMLSchema#dateTime'))
      )
    )

    store.add(st(org1, dcDescription, lit('This is a multiline\ndescription\nwith multiple lines\nof text.')))
    store.add(
      st(
        person1,
        sym('http://example.com/bio'),
        lit(
          'Alice is a software engineer who loves programming and open source. This is just a very long line of text to test the serializer. It should not be split into multiple lines.'
        )
      )
    )

    store.add(st(org1, dcTitle, lit('Acme Corporation', 'en')))
    store.add(st(org1, dcTitle, lit('Acme Corporation', 'fr')))
    store.add(st(org1, dcTitle, lit('Acme Corporation', 'de')))
    store.add(st(person1, foafName, lit('Alice', 'en')))
    store.add(st(person1, foafName, lit('Alicia', 'es')))

    const skillsCollection = new Collection([lit('JavaScript'), lit('TypeScript'), lit('Python'), lit('Java')])
    store.add(st(person1, sym('http://example.com/skills'), skillsCollection))

    const hobbiesCollection = new Collection([
      lit('Reading'),
      sym('http://example.com/activity/Hiking'),
      lit('42', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
    ])
    store.add(st(person2, sym('http://example.com/hobbies'), hobbiesCollection))

    const nestedCollection = new Collection([
      lit('item1'),
      new Collection([lit('nested1'), lit('nested2')]),
      lit('item3')
    ])
    store.add(st(person3, sym('http://example.com/nested'), nestedCollection))

    const bnodeCollection = new Collection([bnode1, bnode2, person1])
    store.add(st(org1, sym('http://example.com/members'), bnodeCollection))

    store.add(st(person1, sym('http://example.com/privateNote'), lit('This is a private note'), graph1))
    store.add(st(person2, sym('http://example.com/privateNote'), lit('Another private note'), graph1))
    store.add(st(org1, sym('http://example.com/internalData'), lit('Internal data'), graph2))

    store.add(st(person1, sym('http://example.com/tag'), lit('developer')))
    store.add(st(person1, sym('http://example.com/tag'), lit('senior')))
    store.add(st(person1, sym('http://example.com/tag'), lit('fullstack')))

    store.add(st(person1, sym('http://example.com/project'), sym('http://example.com/project1')))
    store.add(st(person1, sym('http://example.com/project'), sym('http://example.com/project2')))
    store.add(st(person1, sym('http://example.com/project'), sym('http://example.com/project3')))

    store.add(st(bnode1, sym('http://example.com/city'), lit('New York')))
    store.add(st(bnode1, sym('http://example.com/state'), lit('NY')))
    store.add(st(bnode1, sym('http://example.com/country'), lit('USA')))

    store.add(st(bnode2, sym('http://example.com/city'), lit('Los Angeles')))
    store.add(st(bnode2, sym('http://example.com/state'), lit('CA')))

    store.add(st(bnode3, sym('http://example.com/related'), bnode4))
    store.add(st(bnode4, sym('http://example.com/related'), bnode3))

    const complexBnode = blankNode('complex')
    store.add(st(complexBnode, rdfType, sym('http://example.com/ComplexObject')))
    store.add(st(complexBnode, sym('http://example.com/prop1'), lit('value1')))
    store.add(
      st(
        complexBnode,
        sym('http://example.com/prop2'),
        lit('2', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )
    )
    store.add(st(complexBnode, sym('http://example.com/prop3'), bnode1))
    store.add(st(complexBnode, sym('http://example.com/prop4'), person1))
    store.add(st(person1, sym('http://example.com/complex'), complexBnode))

    const bigChildNode = blankNode('bigChild')
    store.add(st(bigChildNode, rdfType, sym('http://example.com/BigDataObject')))
    store.add(st(bigChildNode, sym('http://example.com/field1'), lit('value1')))
    store.add(st(bigChildNode, sym('http://example.com/field2'), lit('value2')))
    store.add(st(bigChildNode, sym('http://example.com/field3'), lit('value3')))
    store.add(st(bigChildNode, sym('http://example.com/field4'), lit('value4')))
    store.add(st(bigChildNode, sym('http://example.com/field5'), lit('value5')))
    store.add(st(bigChildNode, sym('http://example.com/field6'), lit('value6')))
    store.add(st(bigChildNode, sym('http://example.com/field7'), lit('value7')))
    store.add(st(bigChildNode, sym('http://example.com/field8'), lit('value8')))
    store.add(st(bigChildNode, sym('http://example.com/field9'), lit('value9')))
    store.add(st(bigChildNode, sym('http://example.com/field10'), lit('value10')))
    store.add(st(bigChildNode, sym('http://example.com/field11'), lit('value11')))
    store.add(st(bigChildNode, sym('http://example.com/field12'), lit('value12')))
    store.add(st(bigChildNode, sym('http://example.com/field13'), lit('value13')))
    store.add(st(bigChildNode, sym('http://example.com/field14'), lit('value14')))
    store.add(st(bigChildNode, sym('http://example.com/field15'), lit('value15')))
    store.add(st(bigChildNode, sym('http://example.com/field16'), lit('value16')))
    store.add(st(bigChildNode, sym('http://example.com/field17'), lit('value17')))
    store.add(st(bigChildNode, sym('http://example.com/field18'), lit('value18')))
    store.add(st(bigChildNode, sym('http://example.com/field19'), lit('value19')))
    store.add(st(bigChildNode, sym('http://example.com/field20'), lit('value20')))
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/number1'),
        lit('1', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/number2'),
        lit('2', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/number3'),
        lit('3', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/number4'),
        lit('4', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/number5'),
        lit('5', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/decimal1'),
        lit('10.5', undefined, sym('http://www.w3.org/2001/XMLSchema#decimal'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/decimal2'),
        lit('20.75', undefined, sym('http://www.w3.org/2001/XMLSchema#decimal'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/decimal3'),
        lit('30.25', undefined, sym('http://www.w3.org/2001/XMLSchema#decimal'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/boolean1'),
        lit('1', undefined, sym('http://www.w3.org/2001/XMLSchema#boolean'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/boolean2'),
        lit('0', undefined, sym('http://www.w3.org/2001/XMLSchema#boolean'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/date1'),
        lit('2020-01-01', undefined, sym('http://www.w3.org/2001/XMLSchema#date'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/date2'),
        lit('2021-06-15', undefined, sym('http://www.w3.org/2001/XMLSchema#date'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/datetime1'),
        lit('2020-01-01T00:00:00Z', undefined, sym('http://www.w3.org/2001/XMLSchema#dateTime'))
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/datetime2'),
        lit('2021-06-15T12:30:00Z', undefined, sym('http://www.w3.org/2001/XMLSchema#dateTime'))
      )
    )
    store.add(st(bigChildNode, sym('http://example.com/lang1'), lit('Hello', 'en')))
    store.add(st(bigChildNode, sym('http://example.com/lang2'), lit('Bonjour', 'fr')))
    store.add(st(bigChildNode, sym('http://example.com/lang3'), lit('Hola', 'es')))
    store.add(st(bigChildNode, sym('http://example.com/lang4'), lit('Guten Tag', 'de')))
    store.add(st(bigChildNode, sym('http://example.com/ref1'), person1))
    store.add(st(bigChildNode, sym('http://example.com/ref2'), person2))
    store.add(st(bigChildNode, sym('http://example.com/ref3'), org1))
    store.add(st(bigChildNode, sym('http://example.com/ref4'), org2))
    store.add(st(bigChildNode, sym('http://example.com/nested1'), bnode1))
    store.add(st(bigChildNode, sym('http://example.com/nested2'), bnode2))
    store.add(st(bigChildNode, sym('http://example.com/nested3'), bnode3))
    store.add(st(bigChildNode, sym('http://example.com/nested4'), bnode4))
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/multiline'),
        lit(
          'This is a very long multiline text\nthat spans multiple lines\nand contains various characters\nincluding special symbols: !@#$%^&*()'
        )
      )
    )
    store.add(
      st(
        bigChildNode,
        sym('http://example.com/description'),
        lit(
          'This is a comprehensive description of a very big child node that contains many properties and relationships to test serialization of complex structures in collections.'
        )
      )
    )

    const collectionWithBigChild = new Collection([
      lit('item1'),
      lit('item2'),
      bigChildNode,
      lit('item3'),
      sym('http://example.com/item4')
    ])
    store.add(st(person1, sym('http://example.com/bigCollection'), collectionWithBigChild))

    store.add(
      st(
        person1,
        sym('http://example.com/edgeCase1'),
        lit('0.123e2', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
      )
    )
    store.add(
      st(
        person1,
        sym('http://example.com/edgeCase2'),
        lit('123e-2', undefined, sym('http://www.w3.org/2001/XMLSchema#double'))
      )
    )
    store.add(st(person1, sym('http://example.com/edgeCase3'), lit('text with "quotes" and\nnewlines')))

    store.add(st(org1, sym('http://example.com/foundedBy'), person1))
    store.add(st(org1, sym('http://example.com/foundedBy'), person2))
    store.add(st(org2, sym('http://example.com/foundedBy'), person3))

    serializeEqualMultiple(store, 'big', ['n3', 'nt', 'rdf'])
  })
})
