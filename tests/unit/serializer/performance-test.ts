import { expect } from "chai";
import {
	blankNode,
	graph,
	lit,
	Serializer,
	st,
	Statement,
	sym,
} from "../../../src";

describe("Serializer - Performance Tests", () => {
	// Helper to generate test data
	function generateStatements(count: number) {
		const kb = graph();
		const statements: Statement[] = [];
		for (let i = 0; i < count; i++) {
			statements.push(
				st(
					sym(`http://example.com/subject${i}`),
					sym(`http://example.com/predicate${i}`),
					sym(`http://example.com/object${i}`)
				)
			);
		}
		return { kb, statements };
	}

	function generateLargeStatements(count: number) {
		const kb = graph();
		const statements: Statement[] = [];
		for (let i = 0; i < count; i++) {
			statements.push(
				st(
					sym(`http://example.com/subject${i}`),
					sym(`http://example.com/predicate${i}`),
					lit(
						`Value ${i} with some text content that makes it longer`
					)
				)
			);
		}
		return { kb, statements };
	}

	function generateStatementsWithPrefixes(count: number) {
		const kb = graph();
		const serializer = Serializer(kb);
		serializer.setPrefix("ex", "http://example.com/");
		serializer.setPrefix("schema", "http://schema.org/");
		const statements: Statement[] = [];
		for (let i = 0; i < count; i++) {
			statements.push(
				st(
					sym(`http://example.com/subject${i}`),
					sym(`http://schema.org/predicate${i}`),
					sym(`http://example.com/object${i}`)
				)
			);
		}
		return { kb, serializer, statements };
	}

	function generateStatementsWithBlankNodes(count: number) {
		const kb = graph();
		const statements: Statement[] = [];
		for (let i = 0; i < count; i++) {
			const bnode = blankNode();
			statements.push(
				st(
					sym(`http://example.com/subject${i}`),
					sym(`http://example.com/predicate${i}`),
					bnode
				)
			);
		}
		return { kb, statements };
	}

	function generateStatementsWithTypes(count: number) {
		const kb = graph();
		const statements: Statement[] = [];
		for (let i = 0; i < count; i++) {
			statements.push(
				st(
					sym(`http://example.com/subject${i}`),
					sym("http://www.w3.org/1999/02/22-rdf-syntax-ns#type"),
					sym(`http://example.com/Type${i % 10}`)
				)
			);
		}
		return { kb, statements };
	}

	// ============================================
	// statementsToN3 Performance Tests
	// ============================================
	describe("statementsToN3 performance", () => {
		it("should serialize 100 statements quickly", () => {
			const { kb, statements } = generateStatements(100);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToN3(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(100); // Should complete in < 100ms
			console.log(`  ✓ N3 - 100 statements: ${duration.toFixed(2)}ms`);
		});

		it("should serialize 1,000 statements in reasonable time", () => {
			const { kb, statements } = generateStatements(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToN3(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(500); // Should complete in < 500ms
			console.log(`  ✓ N3 - 1,000 statements: ${duration.toFixed(2)}ms`);
		});

		it("should serialize 10,000 statements in reasonable time", () => {
			const { kb, statements } = generateStatements(10000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToN3(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(5000); // Should complete in < 5s
			console.log(`  ✓ N3 - 10,000 statements: ${duration.toFixed(2)}ms`);
		});

		it("should handle large literals efficiently", () => {
			const { kb, statements } = generateLargeStatements(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToN3(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(1000); // Should complete in < 1s
			console.log(
				`  ✓ N3 - 1,000 statements with large literals: ${duration.toFixed(
					2
				)}ms`
			);
		});

		it("should handle prefixes efficiently", () => {
			const { serializer, statements } =
				generateStatementsWithPrefixes(1000);

			const start = performance.now();
			const result = serializer.statementsToN3(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(1000);
			console.log(
				`  ✓ N3 - 1,000 statements with prefixes: ${duration.toFixed(
					2
				)}ms`
			);
		});

		it("should handle blank nodes efficiently", () => {
			const { kb, statements } = generateStatementsWithBlankNodes(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToN3(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(1000);
			console.log(
				`  ✓ N3 - 1,000 statements with blank nodes: ${duration.toFixed(
					2
				)}ms`
			);
		});

		it("should handle rdf:type efficiently", () => {
			const { kb, statements } = generateStatementsWithTypes(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToN3(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(1000);
			console.log(
				`  ✓ N3 - 1,000 statements with types: ${duration.toFixed(2)}ms`
			);
		});

		it("should handle many prefixes efficiently", () => {
			const kb = graph();
			const serializer = Serializer(kb);

			// Add many prefixes
			for (let i = 0; i < 100; i++) {
				serializer.setPrefix(`ns${i}`, `http://example.com/ns${i}/`);
			}

			const statements: Statement[] = [];
			for (let i = 0; i < 1000; i++) {
				statements.push(
					st(
						sym(`http://example.com/ns${i % 100}/subject`),
						sym(`http://example.com/ns${i % 100}/predicate`),
						sym(`http://example.com/ns${i % 100}/object`)
					)
				);
			}

			const start = performance.now();
			const result = serializer.statementsToN3(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(2000);
			console.log(
				`  ✓ N3 - 1,000 statements with 100 prefixes: ${duration.toFixed(
					2
				)}ms`
			);
		});
	});

	// ============================================
	// statementsToNTriples Performance Tests
	// ============================================
	describe("statementsToNTriples performance", () => {
		it("should serialize 100 statements quickly", () => {
			const { kb, statements } = generateStatements(100);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToNTriples(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(50); // NTriples should be faster
			console.log(
				`  ✓ NTriples - 100 statements: ${duration.toFixed(2)}ms`
			);
		});

		it("should serialize 1,000 statements quickly", () => {
			const { kb, statements } = generateStatements(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToNTriples(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(200); // NTriples should be faster
			console.log(
				`  ✓ NTriples - 1,000 statements: ${duration.toFixed(2)}ms`
			);
		});

		it("should serialize 10,000 statements efficiently", () => {
			const { kb, statements } = generateStatements(10000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToNTriples(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(2000); // Should complete in < 2s
			console.log(
				`  ✓ NTriples - 10,000 statements: ${duration.toFixed(2)}ms`
			);
		});

		it("should handle large literals efficiently", () => {
			const { kb, statements } = generateLargeStatements(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToNTriples(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(500);
			console.log(
				`  ✓ NTriples - 1,000 statements with large literals: ${duration.toFixed(
					2
				)}ms`
			);
		});

		it("should handle blank nodes efficiently", () => {
			const { kb, statements } = generateStatementsWithBlankNodes(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToNTriples(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(500);
			console.log(
				`  ✓ NTriples - 1,000 statements with blank nodes: ${duration.toFixed(
					2
				)}ms`
			);
		});

		it("should serialize quads when flag 'q' is set", () => {
			const kb = graph();
			const serializer = Serializer(kb);
			serializer.setFlags("q");

			// Create statements with graph context (quads)
			const quadStatements: Statement[] = [];
			for (let i = 0; i < 1000; i++) {
				quadStatements.push(
					st(
						sym(`http://example.com/subject${i}`),
						sym(`http://example.com/predicate${i}`),
						sym(`http://example.com/object${i}`),
						sym("http://example.com/graph")
					)
				);
			}

			const start = performance.now();
			const result = serializer.statementsToNTriples(quadStatements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(500);
			console.log(`  ✓ NTriples - 1,000 quads: ${duration.toFixed(2)}ms`);
		});
	});

	// ============================================
	// statementsToXML Performance Tests
	// ============================================
	describe("statementsToXML performance", () => {
		it("should serialize 100 statements quickly", () => {
			const { kb, statements } = generateStatements(100);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToXML(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(100);
			console.log(`  ✓ XML - 100 statements: ${duration.toFixed(2)}ms`);
		});

		it("should serialize 1,000 statements in reasonable time", () => {
			const { kb, statements } = generateStatements(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToXML(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(500);
			console.log(`  ✓ XML - 1,000 statements: ${duration.toFixed(2)}ms`);
		});

		it("should serialize 10,000 statements in reasonable time", () => {
			const { kb, statements } = generateStatements(10000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToXML(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(5000);
			console.log(
				`  ✓ XML - 10,000 statements: ${duration.toFixed(2)}ms`
			);
		});

		it("should handle large literals efficiently", () => {
			const { kb, statements } = generateLargeStatements(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToXML(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(1000);
			console.log(
				`  ✓ XML - 1,000 statements with large literals: ${duration.toFixed(
					2
				)}ms`
			);
		});

		it("should handle prefixes efficiently", () => {
			const { serializer, statements } =
				generateStatementsWithPrefixes(1000);

			const start = performance.now();
			const result = serializer.statementsToXML(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(1000);
			console.log(
				`  ✓ XML - 1,000 statements with prefixes: ${duration.toFixed(
					2
				)}ms`
			);
		});

		it("should handle blank nodes efficiently", () => {
			const { kb, statements } = generateStatementsWithBlankNodes(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToXML(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(1000);
			console.log(
				`  ✓ XML - 1,000 statements with blank nodes: ${duration.toFixed(
					2
				)}ms`
			);
		});

		it("should handle rdf:type efficiently", () => {
			const { kb, statements } = generateStatementsWithTypes(1000);
			const serializer = Serializer(kb);

			const start = performance.now();
			const result = serializer.statementsToXML(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(1000);
			console.log(
				`  ✓ XML - 1,000 statements with types: ${duration.toFixed(
					2
				)}ms`
			);
		});

		it("should handle many prefixes efficiently", () => {
			const kb = graph();
			const serializer = Serializer(kb);

			// Add many prefixes
			for (let i = 0; i < 100; i++) {
				serializer.setPrefix(`ns${i}`, `http://example.com/ns${i}/`);
			}

			const statements: Statement[] = [];
			for (let i = 0; i < 1000; i++) {
				statements.push(
					st(
						sym(`http://example.com/ns${i % 100}/subject`),
						sym(`http://example.com/ns${i % 100}/predicate`),
						sym(`http://example.com/ns${i % 100}/object`)
					)
				);
			}

			const start = performance.now();
			const result = serializer.statementsToXML(statements);
			const end = performance.now();
			const duration = end - start;

			expect(result).to.be.a("string");
			expect(duration).to.be.below(2000);
			console.log(
				`  ✓ XML - 1,000 statements with 100 prefixes: ${duration.toFixed(
					2
				)}ms`
			);
		});
	});
});
