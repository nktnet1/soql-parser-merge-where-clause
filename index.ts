import { WhereClause, LogicalOperator, composeQuery, formatQuery } from 'soql-parser-js';
import { parseQuery } from 'soql-parser-js';

function mergeWhereClauses(
  where1?: WhereClause,
  where2?: WhereClause,
  operator: LogicalOperator = 'AND',
): WhereClause {
  // Handle null cases
  if (!(where1 && where2)) return { left: { operator: '=' } };
  if (!where1) return where2;
  if (!where2) return where1;

  // Deep clone to avoid mutations
  const clause1: WhereClause = JSON.parse(JSON.stringify(where1));
  const clause2: WhereClause = JSON.parse(JSON.stringify(where2));

  // Create the wrapped version of clause2
  const wrappedClause2: WhereClause = {
    left: {
      ...clause2.left,
      openParen: 1
    },
    operator: clause2.operator,
    right: clause2.right
  };

  // Add closing parenthesis to last condition of clause2
  let lastClause2 = wrappedClause2;
  while (lastClause2.right) {
    lastClause2 = lastClause2.right;
  }
  lastClause2.left = {
    ...lastClause2.left,
    closeParen: 1
  };

  // Create the final merged structure
  return {
    left: {
      ...clause1.left,
      openParen: 1
    },
    operator: clause1.operator,
    right: {
      left: clause1.right!.left,
      operator: clause1.right!.operator,
      right: {
        left: clause1.right!.right!.left,
        operator: operator,
        right: wrappedClause2
      }
    }
  };
}

const main = () => {
  const queryString1 = `
    SELECT Id FROM Event__C WHERE slug__c != null AND (slug__c = 'my_slug' OR slug__c = 'my_other_slug')
  `.trim();
  const queryString2 = `
    SELECT Id FROM Event__C WHERE Name = 'my_name' OR Name != 'my_other_name'
  `.trim();

  const queryOne = parseQuery(queryString1);
  const queryTwo = parseQuery(queryString2);

  const CLAUSE_RIGHT = queryTwo.where;
  const CLAUSE_LEFT = queryOne.where;

  const mergedClause = mergeWhereClauses(CLAUSE_LEFT, CLAUSE_RIGHT, 'AND');
  console.log(JSON.stringify(mergedClause, null, 2));

  queryOne.where = mergedClause;
  const afterCompose = composeQuery(queryOne);
  console.log({
    queryString1,
    queryString2,
    afterCompose,
  });
  try {
    console.log(formatQuery(afterCompose, { numIndent: 2}));
  } catch (e) {
    console.error(e.message);
  }
}

main();

