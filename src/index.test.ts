import { describe, it, expect } from 'vitest';
import { mergeWhereClauses } from './index';
import { composeQuery, formatQuery, LogicalOperator, parseQuery } from 'soql-parser-js';

const BASE_QUERY_STRING = "SELECT Id FROM Object";

function testMergeWhereClauses(queryString1: string, queryString2: string, operator: LogicalOperator, expectedQueryString: string) {
  const query1 = parseQuery(queryString1);
  const query2 = parseQuery(queryString2);
  const expectedResult = parseQuery(expectedQueryString).where;


  const copyQuery = structuredClone(query1);
  const mergedWhere = mergeWhereClauses(query1.where, query2.where, operator);
  copyQuery.where = mergedWhere;
  const afterCompose = composeQuery(copyQuery);
  expect(() => formatQuery(afterCompose)).not.toThrow()

  expect(mergedWhere).toMatchObject(expectedResult!);
}

describe('mergeWhereClauses', () => {
  it('Simple no where clause', () => {
    testMergeWhereClauses(
      BASE_QUERY_STRING,
      BASE_QUERY_STRING,
      'AND',
      BASE_QUERY_STRING
    );
  });

  it('should merge two simple where clauses with AND', () => {
    testMergeWhereClauses(
      `${BASE_QUERY_STRING} WHERE field1 = 'value1'`,
      `${BASE_QUERY_STRING} WHERE field2 = 'value2'`,
      'AND',
      `${BASE_QUERY_STRING} WHERE field1 = 'value1' AND field2 = 'value2'`
    );
  });

  it('should merge two simple where clauses with OR', () => {
    testMergeWhereClauses(
      `${BASE_QUERY_STRING} WHERE field1 = 'value1'`,
      `${BASE_QUERY_STRING} WHERE field2 = 'value2'`,
      'OR',
      `${BASE_QUERY_STRING} WHERE field1 = 'value1' OR field2 = 'value2'`
    );
  });
});