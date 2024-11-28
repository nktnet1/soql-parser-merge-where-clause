import { WhereClause, LogicalOperator, composeQuery, formatQuery } from 'soql-parser-js';
import { parseQuery } from 'soql-parser-js';
import { format } from 'sql-formatter';

export function mergeWhereClauses(
  where1?: WhereClause,
  where2?: WhereClause,
  operator: LogicalOperator = 'AND',
): WhereClause {
  if (!(where1 && where2)) return { left: { operator: '=' } };
  if (!where1) return where2;
  if (!where2) return where1;

  const wrapClause = (clause: WhereClause): WhereClause => {
    const clone = JSON.parse(JSON.stringify(clause));
    
    clone.left = {
      ...clone.left,
      openParen: (clone.left.openParen || 0) + 1
    };

    let current = clone;
    while (current.right) {
      current = current.right;
    }
    current.left = {
      ...current.left,
      closeParen: (current.left.closeParen || 0) + 1
    };

    return clone;
  };

  const wrapped1 = wrapClause(where1);
  const wrapped2 = wrapClause(where2);

  let current = wrapped1;
  while (current.right) {
    current = current.right;
  }

  current.operator = operator;
  current.right = wrapped2;

  return wrapped1;
}

const main = () => {
  const queryString1 = `
    SELECT Id FROM Event__C 
    WHERE (slug__c != null AND Unit_Cap__c > 0 AND Status__c = 'Active') 
    OR (Unit_Cap__c = 0 AND Is_Published__c = true) 
    OR (Created_Date__c > '2024-01-01' AND Owner.Name = 'Admin' OR (Tam = 5 And Kien = 6))
  `.trim();

  const queryString2 = `
    SELECT Id FROM Event__C 
    WHERE (Name LIKE '%test%' OR Description__c = 'special') 
    AND (Pricing__c > 100 OR Pricing__c < 10) 
    AND Is_Featured__c = true 
    AND (Region__c IN ('US', 'EU') OR Country__c = 'Global')
  `.trim();

  const queryOne = parseQuery(queryString1);
  const queryTwo = parseQuery(queryString2);

  const CLAUSE_RIGHT = queryTwo.where;
  const CLAUSE_LEFT = queryOne.where;

  const LOGICAL_OPERATOR: LogicalOperator = 'AND';
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