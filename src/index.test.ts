import { describe, test, expect } from 'vitest';
import { mergeWhereClauses } from './index';
import { composeQuery, formatQuery, LogicalOperator, parseQuery } from 'soql-parser-js';
import { format } from 'sql-formatter';

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
  const queryAfterMerge = composeQuery(copyQuery);

  // These functions will throw if the result cannot be parsed
  expect(() => formatQuery(queryAfterMerge)).not.toThrow();
  expect(() => format(queryAfterMerge)).not.toThrow();

  // Equality match for the generated structure
  expect(mergedWhere).toStrictEqual(expectedResult!);
}

describe('Base case merge', () => {
  test('No WHERE clause in either query', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object",
      queryString2: "SELECT Id FROM Object",
      operator: 'AND',
      expectedQueryString: "SELECT Id FROM Object",
    });
  });

  test('empty WHERE clauses in first query', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object",
      queryString2: "SELECT Id FROM Object WHERE field1 = 'value1'",
      operator: 'AND',
      expectedQueryString: "SELECT Id FROM Object WHERE field1 = 'value1'",
    });
  });

  test('empty WHERE clauses in second query', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1'",
      queryString2: "SELECT Id FROM Object",
      operator: 'AND',
      expectedQueryString: "SELECT Id FROM Object WHERE field1 = 'value1'",
    });
  });
});

describe('Basic merge', () => {
  test('two simple WHERE clauses with AND', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2'",
      operator: 'AND',
      expectedQueryString: "SELECT Id FROM Object WHERE (field1 = 'value1') AND (field2 = 'value2')",
    });
  });

  test('two simple WHERE clauses with OR', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2'",
      operator: 'OR',
      expectedQueryString: "SELECT Id FROM Object WHERE (field1 = 'value1') OR (field2 = 'value2')",
    });
  });
});

describe('Advance merge', () => {
  test('nested WHERE clauses with AND', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1' AND field3 = 'value3'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2' OR field4 = 'value4'",
      operator: 'AND',
      expectedQueryString: "SELECT Id FROM Object WHERE (field1 = 'value1' AND field3 = 'value3') AND (field2 = 'value2' OR field4 = 'value4')",
    });
  });

  test('nested WHERE clauses with OR', () => {
    testMergeWhereClauses({
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1' AND field3 = 'value3'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2' OR field4 = 'value4'",
      operator: 'OR',
      expectedQueryString: "SELECT Id FROM Object WHERE (field1 = 'value1' AND field3 = 'value3') OR (field2 = 'value2' OR field4 = 'value4')",
    });
  });

  test('extremely high nesting in WHERE clauses with AND', () => {
    testMergeWhereClauses({
      queryString1: `
        SELECT Id FROM Object WHERE 
        ((field1 = 'value1' AND (field2 = 'value2' OR (field3 = 'value3' AND field4 = 'value4'))) 
         OR ((field5 = 'value5' AND field6 = 'value6') AND (field7 = 'value7' OR field8 = 'value8')))
      `,
      queryString2: `
        SELECT Id FROM Object WHERE
        (((field9 = 'value9' AND (field10 = 'value10' OR field11 = 'value11')) OR field12 = 'value12') 
         AND ((field13 = 'value13' OR field14 = 'value14') AND (field15 = 'value15' AND field16 = 'value16')))
      `,
      operator: 'AND',
      expectedQueryString: `
        SELECT Id FROM Object WHERE 
        (((field1 = 'value1' AND (field2 = 'value2' OR (field3 = 'value3' AND field4 = 'value4'))) 
          OR ((field5 = 'value5' AND field6 = 'value6') AND (field7 = 'value7' OR field8 = 'value8')))) 
        AND 
        ((((field9 = 'value9' AND (field10 = 'value10' OR field11 = 'value11')) OR field12 = 'value12') 
          AND ((field13 = 'value13' OR field14 = 'value14') AND (field15 = 'value15' AND field16 = 'value16'))))
      `,
    });
  });
});
