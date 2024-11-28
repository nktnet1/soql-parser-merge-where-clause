import { describe, it, expect } from 'vitest';
import { mergeWhereClauses } from './index';
import { parseQuery } from 'soql-parser-js';

const BASE_QUERY_STRING = "SELECT Id FROM Object WHERE";

describe('mergeWhereClauses', () => {
  it('should merge two simple where clauses with AND', () => {
    const query1 = parseQuery(`${BASE_QUERY_STRING} field1 = 'value1'`);
    const query2 = parseQuery(`${BASE_QUERY_STRING} field2 = 'value2'`);
    const expectedResult = parseQuery(`${BASE_QUERY_STRING} field1 = 'value1' AND field2 = 'value2'`).where;
    
    const result = mergeWhereClauses(query1.where!, query2.where!, 'AND');
    expect(result).toMatchObject(expectedResult!);
  });
});