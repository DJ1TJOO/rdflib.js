import { BlankNode, blankNode, Collection, graph, lit, st, sym } from '../../../../src'

import { serializeEqualMultiple } from './utils/serialize-equal'

describe('big store with all kinds of nodes', () => {
  before(() => {
    BlankNode.nextId = 0
  })
  afterEach(() => {
    BlankNode.nextId = 0
  })

  describe('should serialize a comprehensive store with all node types', () => {
    const store = graph()

    // Create various named nodes
    const person1 = sym('http://example.com/person1')
    const person2 = sym('http://example.com/person2')
    const person3 = sym('http://example.com/person3')
    const org1 = sym('http://example.com/org1')
    const org2 = sym('http://example.com/org2')
    const graph1 = sym('http://example.com/graph1')
    const graph2 = sym('http://example.com/graph2')

    // Create blank nodes
    const bnode1 = blankNode('b1')
    const bnode2 = blankNode('b2')
    const bnode3 = blankNode()
    const bnode4 = blankNode('b4')

    // Create various predicates
    const rdfType = sym('http://www.w3.org/1999/02/22-rdf-syntax-ns#type')
    const foafName = sym('http://xmlns.com/foaf/0.1/name')
    const foafAge = sym('http://xmlns.com/foaf/0.1/age')
    const foafKnows = sym('http://xmlns.com/foaf/0.1/knows')
    const foafMember = sym('http://xmlns.com/foaf/0.1/member')
    const dcTitle = sym('http://purl.org/dc/elements/1.1/title')
    const dcDescription = sym('http://purl.org/dc/elements/1.1/description')
    const schemaEmail = sym('http://schema.org/email')
    const schemaAddress = sym('http://schema.org/address')

    // Add basic statements with named nodes
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

    // Add organization statements
    store.add(st(org1, rdfType, sym('http://xmlns.com/foaf/0.1/Organization')))
    store.add(st(org1, foafName, lit('Acme Corp')))
    store.add(st(org1, dcDescription, lit('A company that makes widgets\nand other products.')))

    store.add(st(org2, rdfType, sym('http://xmlns.com/foaf/0.1/Organization')))
    store.add(st(org2, foafName, lit('Tech Inc')))

    // Add relationships
    store.add(st(person1, foafKnows, person2))
    store.add(st(person1, foafKnows, person3))
    store.add(st(person2, foafKnows, person3))
    store.add(st(person1, foafMember, org1))
    store.add(st(person2, foafMember, org1))
    store.add(st(person3, foafMember, org2))

    // Add statements with blank nodes
    store.add(st(bnode1, rdfType, sym('http://example.com/Address')))
    store.add(st(bnode1, schemaAddress, lit('123 Main St')))
    store.add(st(person1, schemaAddress, bnode1))

    store.add(st(bnode2, rdfType, sym('http://example.com/Address')))
    store.add(st(bnode2, schemaAddress, lit('456 Oak Ave')))
    store.add(st(person2, schemaAddress, bnode2))

    // Add nested blank nodes
    store.add(st(bnode3, rdfType, sym('http://example.com/ContactInfo')))
    store.add(st(bnode3, schemaEmail, lit('contact@example.com')))
    store.add(st(bnode3, schemaAddress, bnode4))
    store.add(st(bnode4, schemaAddress, lit('789 Pine Rd')))
    store.add(st(org1, sym('http://example.com/contact'), bnode3))

    // Add statements with various literal types
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

    // Add multiline literals
    store.add(st(org1, dcDescription, lit('This is a multiline\ndescription\nwith multiple lines\nof text.')))
    store.add(
      st(
        person1,
        sym('http://example.com/bio'),
        lit('Alice is a software engineer\nwho loves programming\nand open source.')
      )
    )

    // Add literals with language tags
    store.add(st(org1, dcTitle, lit('Acme Corporation', 'en')))
    store.add(st(org1, dcTitle, lit('Acme Corporation', 'fr')))
    store.add(st(org1, dcTitle, lit('Acme Corporation', 'de')))
    store.add(st(person1, foafName, lit('Alice', 'en')))
    store.add(st(person1, foafName, lit('Alicia', 'es')))

    // Add collections
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

    // Add statements in named graphs
    store.add(st(person1, sym('http://example.com/privateNote'), lit('This is a private note'), graph1))
    store.add(st(person2, sym('http://example.com/privateNote'), lit('Another private note'), graph1))
    store.add(st(org1, sym('http://example.com/internalData'), lit('Internal data'), graph2))

    // Add multiple predicates for same subject
    store.add(st(person1, sym('http://example.com/tag'), lit('developer')))
    store.add(st(person1, sym('http://example.com/tag'), lit('senior')))
    store.add(st(person1, sym('http://example.com/tag'), lit('fullstack')))

    // Add multiple objects for same predicate
    store.add(st(person1, sym('http://example.com/project'), sym('http://example.com/project1')))
    store.add(st(person1, sym('http://example.com/project'), sym('http://example.com/project2')))
    store.add(st(person1, sym('http://example.com/project'), sym('http://example.com/project3')))

    // Add statements with blank nodes as subjects pointing to other nodes
    store.add(st(bnode1, sym('http://example.com/city'), lit('New York')))
    store.add(st(bnode1, sym('http://example.com/state'), lit('NY')))
    store.add(st(bnode1, sym('http://example.com/country'), lit('USA')))

    store.add(st(bnode2, sym('http://example.com/city'), lit('Los Angeles')))
    store.add(st(bnode2, sym('http://example.com/state'), lit('CA')))

    // Add statements with blank nodes pointing to other blank nodes
    store.add(st(bnode3, sym('http://example.com/related'), bnode4))
    store.add(st(bnode4, sym('http://example.com/related'), bnode3))

    // Add more complex nested structures
    const complexBnode = blankNode('complex')
    store.add(st(complexBnode, rdfType, sym('http://example.com/ComplexObject')))
    store.add(st(complexBnode, sym('http://example.com/prop1'), lit('value1')))
    store.add(
      st(
        complexBnode,
        sym('http://example.com/prop2'),
        lit('value2', undefined, sym('http://www.w3.org/2001/XMLSchema#integer'))
      )
    )
    store.add(st(complexBnode, sym('http://example.com/prop3'), bnode1))
    store.add(st(complexBnode, sym('http://example.com/prop4'), person1))
    store.add(st(person1, sym('http://example.com/complex'), complexBnode))

    // Add edge case literals
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

    // Add statements connecting everything together
    store.add(st(org1, sym('http://example.com/foundedBy'), person1))
    store.add(st(org1, sym('http://example.com/foundedBy'), person2))
    store.add(st(org2, sym('http://example.com/foundedBy'), person3))

    serializeEqualMultiple(store, 'big', ['n3', 'nt', 'rdf'])
  })
})
