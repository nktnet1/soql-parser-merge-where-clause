import { describe, it, expect } from 'vitest';
import { mergeWhereClauses } from './index';
import { parseQuery } from 'soql-parser-js';

const BASE_QUERY_STRING = "SELECT Id FROM Object";

describe('mergeWhereClauses', () => {
  it('Simple no where clause', () => {
    const query1 = parseQuery(BASE_QUERY_STRING);
    const query2 = parseQuery(BASE_QUERY_STRING);
    const expectedResult = parseQuery(BASE_QUERY_STRING).where;
    
    const result = mergeWhereClauses(query1.where!, query2.where!, 'AND');
    expect(result).toMatchObject(expectedResult!);
  });

  it('should merge two simple where clauses with AND', () => {
    const query1 = parseQuery(`${BASE_QUERY_STRING} WHERE field1 = 'value1'`);
    const query2 = parseQuery(`${BASE_QUERY_STRING} WHERE field2 = 'value2'`);
    const expectedResult = parseQuery(`${BASE_QUERY_STRING} WHERE field1 = 'value1' AND field2 = 'value2'`).where;
    
    const result = mergeWhereClauses(query1.where!, query2.where!, 'AND');
    expect(result).toMatchObject(expectedResult!);
  });

  it('should merge two simple where clauses with OR', () => {
    const query1 = parseQuery(`${BASE_QUERY_STRING} WHERE field1 = 'value1'`);
    const query2 = parseQuery(`${BASE_QUERY_STRING} WHERE field2 = 'value2'`);
    const expectedResult = parseQuery(`${BASE_QUERY_STRING} WHERE field1 = 'value1' OR field2 = 'value2'`).where;
    
    const result = mergeWhereClauses(query1.where!, query2.where!, 'OR');
    expect(result).toMatchObject(expectedResult!);
  });
});