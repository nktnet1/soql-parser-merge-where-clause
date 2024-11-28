import { WhereClause, LogicalOperator, composeQuery } from 'soql-parser-js';
import { parseQuery } from 'soql-parser-js';

function mergeWhereClauses(
  where1?: WhereClause,
  where2?: WhereClause,
  operator: LogicalOperator = 'AND',
): WhereClause {
  if (!(where1 && where2)) return { left: { operator: '=' } };
  if (!where1) return where2;
  if (!where2) return where1;

  return {
    left: where1.left,
    operator: operator,
    right: where1.right ? mergeWhereClauses(where1.right, where2, operator) : where2,
  };
}

const main = () => {
  const queryString1 = `
    SELECT Id FROM Event__C WHERE slug = 'my_slug'
  `.trim();
  const queryString2 = `
    SELECT Id FROM Event__C WHERE name = 'my_name'
  `.trim();

  const queryOne = parseQuery(queryString1);
  const queryTwo = parseQuery(queryString2);

  const CLAUSE_RIGHT = queryTwo.where;
  const CLAUSE_LEFT = queryOne.where;

  const mergedClause = mergeWhereClauses(CLAUSE_LEFT, CLAUSE_RIGHT, 'OR');
  console.log(JSON.stringify(mergedClause, null, 2));

  queryOne.where = mergedClause;
  console.log({
    queryString1,
    queryString2,
    afterCompose: composeQuery(queryOne),
  });
}

main();

