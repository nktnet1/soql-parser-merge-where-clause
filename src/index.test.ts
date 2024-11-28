import { composeQuery, formatQuery, type LogicalOperator, parseQuery } from "soql-parser-js";
import { format } from "sql-formatter";
import { describe, test, expect } from "vitest";
import { mergeWhereClauses } from "./index";

function testMergeWhereClauses({
  queryString1,
  queryString2,
  operator,
  expectedQueryString,
  useStrict = true,
}: {
  queryString1: string;
  queryString2: string;
  operator: LogicalOperator;
  expectedQueryString: string;
  useStrict?: boolean;
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

  if (useStrict) {
    expect(mergedWhere).toStrictEqual(expectedResult);
  } else {
    /*
     * NOTE:
     * - avoid `.toStrictEqual` since in Jest/Vitest, SoqlQuery gets converted to "Object"
     * - This is relevant only for the subqueries test cases
     * - Further reading: https://backend.cafe/should-you-use-jest-as-a-testing-library
     */
    expect(mergedWhere).toEqual(expectedResult);
  }
}

describe("Base case merge", () => {
  test.each([
    {
      queryString1: "SELECT Id FROM Object",
      queryString2: "SELECT Id FROM Object",
      operator: "AND" as LogicalOperator,
      expectedQueryString: "SELECT Id FROM Object"
    },
    {
      queryString1: "SELECT Id FROM Object",
      queryString2: "SELECT Id FROM Object WHERE field1 = 'value1'",
      operator: "AND" as LogicalOperator,
      expectedQueryString: "SELECT Id FROM Object WHERE field1 = 'value1'"
    },
  ])("merge basic WHERE clauses - $expectedQueryString", ({ queryString1, queryString2, operator, expectedQueryString }) => {
    testMergeWhereClauses({
      queryString1,
      queryString2,
      operator,
      expectedQueryString,
    });
  });
});

describe("Basic merge with AND/OR conditions", () => {
  test.each([
    {
      operator: "AND" as LogicalOperator,
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2'",
      expectedQueryString: `
        SELECT Id FROM Object WHERE
        (field1 = 'value1') AND (field2 = 'value2')
      `
    },
    {
      operator: "OR" as LogicalOperator,
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2'",
      expectedQueryString: `
        SELECT Id FROM Object WHERE
        (field1 = 'value1') OR (field2 = 'value2')
      `
    },
  ])("should merge WHERE clauses with $operator", ({ operator, queryString1, queryString2, expectedQueryString }) => {
    testMergeWhereClauses({
      queryString1,
      queryString2,
      operator,
      expectedQueryString,
    });
  });
});

describe("Nested AND/OR", () => {
  test.each([
    {
      operator: "AND" as LogicalOperator,
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1' AND field3 = 'value3'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2' OR field4 = 'value4'",
      expectedQueryString: `
        SELECT Id FROM Object WHERE
        (field1 = 'value1' AND field3 = 'value3') AND (field2 = 'value2' OR field4 = 'value4')
      `
    },
    {
      operator: "OR" as LogicalOperator,
      queryString1: "SELECT Id FROM Object WHERE field1 = 'value1' AND field3 = 'value3'",
      queryString2: "SELECT Id FROM Object WHERE field2 = 'value2' OR field4 = 'value4'",
      expectedQueryString: `
        SELECT Id FROM Object WHERE
        (field1 = 'value1' AND field3 = 'value3') OR (field2 = 'value2' OR field4 = 'value4')
      `
    },
  ])("should merge nested WHERE clauses with $operator", ({ operator, queryString1, queryString2, expectedQueryString }) => {
    testMergeWhereClauses({
      queryString1,
      queryString2,
      operator,
      expectedQueryString,
    });
  });

  test("extremely high nesting in WHERE clauses with AND", () => {
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
      operator: "AND" as LogicalOperator,
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

describe("Subqueries", () => {
  test.each([
    {
      operator: "AND" as LogicalOperator,
      queryString1: `
        SELECT Id FROM Object WHERE
        field1 IN (SELECT Id FROM RelatedObject WHERE field2 = 'value1')
        AND field3 = 'value3'
      `,
      queryString2: `
        SELECT Id FROM Object WHERE
        field4 = 'value4'
        AND field5 IN (SELECT Id FROM AnotherRelatedObject WHERE field6 = 'value5')
      `,
      expectedQueryString: `
        SELECT Id FROM Object WHERE
        (field1 IN (SELECT Id FROM RelatedObject WHERE field2 = 'value1')
         AND field3 = 'value3')
        AND
        (field4 = 'value4'
         AND field5 IN (SELECT Id FROM AnotherRelatedObject WHERE field6 = 'value5'))
      `
    },
    {
      operator: "OR" as LogicalOperator,
      queryString1: `
        SELECT Id FROM Object WHERE
        field1 IN (SELECT Id FROM RelatedObject WHERE field2 = 'value1')
        OR field3 = 'value3'
      `,
      queryString2: `
        SELECT Id FROM Object WHERE
        field4 = 'value4'
        OR field5 IN (SELECT Id FROM AnotherRelatedObject WHERE field6 = 'value5')
      `,
      expectedQueryString: `
        SELECT Id FROM Object WHERE
        (field1 IN (SELECT Id FROM RelatedObject WHERE field2 = 'value1')
         OR field3 = 'value3')
        OR
        (field4 = 'value4'
         OR field5 IN (SELECT Id FROM AnotherRelatedObject WHERE field6 = 'value5'))
      `
    },
  ])("should merge WHERE clauses with subqueries using $operator", ({ operator, queryString1, queryString2, expectedQueryString }) => {
    testMergeWhereClauses({
      queryString1,
      queryString2,
      operator,
      expectedQueryString,
      useStrict: false,
    });
  });
});

describe("Contains NOT", () => {
  test("should merge WHERE clauses with mixed AND, OR, NOT operators", () => {
    testMergeWhereClauses({
      queryString1: `
        SELECT Id FROM Object WHERE
        field1 = 'value1' AND field2 = 'value2' OR NOT field3 = 'value3'
      `,
      queryString2: `
        SELECT Id FROM Object WHERE
        field4 = 'value4' AND NOT field5 = 'value5'
      `,
      operator: "AND" as LogicalOperator,
      expectedQueryString: `
        SELECT Id FROM Object WHERE
        (field1 = 'value1' AND field2 = 'value2' OR NOT field3 = 'value3')
        AND
        (field4 = 'value4' AND NOT field5 = 'value5')
      `
    });
  });

  test("should handle AND and NOT operators correctly when combined", () => {
    testMergeWhereClauses({
      queryString1: `
        SELECT Id FROM Object WHERE
        field1 = 'value1' AND NOT field2 = 'value2'
      `,
      queryString2: `
        SELECT Id FROM Object WHERE
        field3 = 'value3' AND NOT field4 = 'value4'
      `,
      operator: "AND" as LogicalOperator,
      expectedQueryString: `
        SELECT Id FROM Object WHERE
        (field1 = 'value1' AND NOT field2 = 'value2')
        AND
        (field3 = 'value3' AND NOT field4 = 'value4')
      `
    });
  });

  test("should handle OR and NOT operators correctly when combined", () => {
    testMergeWhereClauses({
      queryString1: `
        SELECT Id FROM Object WHERE
        field1 = 'value1' OR NOT field2 = 'value2'
      `,
      queryString2: `
        SELECT Id FROM Object WHERE
        field3 = 'value3' OR NOT field4 = 'value4'
      `,
      operator: "OR" as LogicalOperator,
      expectedQueryString: `
        SELECT Id FROM Object WHERE
        (field1 = 'value1' OR NOT field2 = 'value2')
        OR
        (field3 = 'value3' OR NOT field4 = 'value4')
      `
    });
  });
});
