import { WhereClause, LogicalOperator, composeQuery, formatQuery } from 'soql-parser-js';
import { parseQuery } from 'soql-parser-js';
import { format } from 'sql-formatter';

const wrapWhereClauseInParenthesis = (clause: WhereClause): WhereClause => {
  const clone = JSON.parse(JSON.stringify(clause)) as WhereClause;
  clone.left.openParen = (clone.left.openParen ?? 0) + 1
  let current = clone;
  while (current.right) {
    current = current.right;
  }
  current.left.closeParen = (current.left.closeParen || 0) + 1
  return clone;
};

export function mergeWhereClauses(
  where1?: WhereClause,
  where2?: WhereClause,
  operator: LogicalOperator = 'AND',
): WhereClause {
  if (!(where1 && where2)) return { left: { operator: '=' } };
  if (!where1) return where2;
  if (!where2) return where1;

  const wrappedWhere1 = wrapWhereClauseInParenthesis(where1);
  const wrappedWhere2 = wrapWhereClauseInParenthesis(where2);

  let current = wrappedWhere1;
  while (current.right) {
    current = current.right;
  }

  current.operator = operator;
  current.right = wrappedWhere2;

  return wrappedWhere1;
}

const main = () => {
  const queryString1 = `
    SELECT Id FROM Event__C 
    WHERE (slug__c != null AND Unit_Cap__c > 0 AND Status__c = 'Active') 
    OR (Unit_Cap__c = 0 AND Is_Published__c = true) 
  `.trim();

  const queryString2 = `
    SELECT Id FROM Event__C 
    WHERE (Name LIKE '%test%' OR Description__c = 'special') 
    AND (Pricing__c > 100 OR Pricing__c < 10) 
  `.trim();

  const queryOne = parseQuery(queryString1);
  const queryTwo = parseQuery(queryString2);

  const CLAUSE_RIGHT = queryTwo.where;
  const CLAUSE_LEFT = queryOne.where;

  const LOGICAL_OPERATOR: LogicalOperator = 'OR';
  const mergedClause = mergeWhereClauses(CLAUSE_LEFT, CLAUSE_RIGHT, LOGICAL_OPERATOR);
  console.log(JSON.stringify(mergedClause, null, 2));

  queryOne.where = mergedClause;
  const afterCompose = composeQuery(queryOne);
  console.log({
    queryString1,
    LOGICAL_OPERATOR,
    queryString2,
    afterCompose,
  });
  try {
    formatQuery(afterCompose, {
      numIndent: 2,
      whereClauseOperatorsIndented: true,
      fieldSubqueryParensOnOwnLine: true
    });
  } catch (e) {
    console.error(e.message);
  }

  console.log(format(afterCompose, { logicalOperatorNewline: 'before', linesBetweenQueries: 3 }));
}

if (import.meta.url === `file://${process.argv[1]}`) {
  void main();
}