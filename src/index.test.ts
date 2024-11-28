import { describe, test, expect } from 'vitest';
import { mergeWhereClauses } from './index';
import { composeQuery, formatQuery, LogicalOperator, parseQuery } from 'soql-parser-js';

function testMergeWhereClauses({ queryString1, queryString2, operator, expectedQueryString }: {
  queryString1: string;
  queryString2: string;
  operator: LogicalOperator;
  expectedQueryString: string;
}) {
  const query1 = parseQuery(queryString1);
  const query2 = parseQuery(queryString2);
  const expectedResult = parseQuery(expectedQueryString).where;

  const copyQuery = structuredClone(query1);
  const mergedWhere = mergeWhereClauses(query1.where, query2.where, operator);
  copyQuery.where = mergedWhere;
  const afterCompose = composeQuery(copyQuery);
  expect(() => formatQuery(afterCompose)).not.toThrow();
  expect(mergedWhere).toMatchObject(expectedResult!);
}

describe('Base Cases', () => {
  test('No WHERE clause in either query', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object",
      queryString2: "SELECT Id FROM Object",
      operator: 'AND',
      expectedQueryString: "SELECT Id FROM Object",
    });
  });
});

describe('Simple Cases', () => {
  test('Merges two simple WHERE clauses with AND', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2'",
      operator: 'AND',
      expectedQueryString: "SELECT Id FROM Object WHERE field1 = 'value1' AND field2 = 'value2'",
    });
  });

  test('Merges two simple WHERE clauses with OR', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2'",
      operator: 'OR',
      expectedQueryString: "SELECT Id FROM Object WHERE field1 = 'value1' OR field2 = 'value2'",
    });
  });
});

describe('Advanced Cases', () => {
  test('Handles nested WHERE clauses with AND', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1' AND field3 = 'value3'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2' OR field4 = 'value4'",
      operator: 'AND',
      expectedQueryString: "SELECT Id FROM Object WHERE (field1 = 'value1' AND field3 = 'value3') AND (field2 = 'value2' OR field4 = 'value4')",
    });
  });

  test('Handles nested WHERE clauses with OR', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1' AND field3 = 'value3'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2' OR field4 = 'value4'",
      operator: 'OR',
      expectedQueryString: "SELECT Id FROM Object WHERE (field1 = 'value1' AND field3 = 'value3') OR (field2 = 'value2' OR field4 = 'value4')",
    });
  });

  test('Handles empty WHERE clauses in one query', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object",
      queryString2: "SELECT Id FROM Object WHERE field1 = 'value1'",
      operator: 'AND',
      expectedQueryString: "SELECT Id FROM Object WHERE field1 = 'value1'",
    });

    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1'",
      queryString2: "SELECT Id FROM Object",
      operator: 'AND',
      expectedQueryString: "SELECT Id FROM Object WHERE field1 = 'value1'",
    });
  });
});