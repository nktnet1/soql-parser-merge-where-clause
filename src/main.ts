import { composeQuery, formatQuery, LogicalOperator, parseQuery } from "soql-parser-js";
import { mergeWhereClauses } from ".";
import { format } from "sql-formatter";

const main = () => {
  const queryString1 = `
    SELECT Id FROM Object WHERE field1 = 'value1' AND field3 = 'value3'
  `.trim();

  const queryString2 = `
    SELECT Id FROM Object WHERE field2 = 'value2' OR field4 = 'value4'
  `.trim();

  const queryOne = parseQuery(queryString1);
  const queryTwo = parseQuery(queryString2);

  const CLAUSE_RIGHT = queryTwo.where;
  const CLAUSE_LEFT = queryOne.where;

  const LOGICAL_OPERATOR: LogicalOperator = 'OR';
  const mergedClause = mergeWhereClauses(CLAUSE_LEFT, CLAUSE_RIGHT, LOGICAL_OPERATOR);
  console.log(JSON.stringify(mergedClause, null, 2));

  queryOne.where = mergedClause;
  const queryAfterMerge = composeQuery(queryOne);
  console.log({
    queryString1,
    LOGICAL_OPERATOR,
    queryString2,
    queryAfterMerge,
  });
  try {
    formatQuery(queryAfterMerge, {
      numIndent: 2,
      whereClauseOperatorsIndented: true,
      fieldSubqueryParensOnOwnLine: true
    });
  } catch (e) {
    console.error(e.message);
  }

  console.log(format(queryAfterMerge, { logicalOperatorNewline: 'before', linesBetweenQueries: 3 }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}