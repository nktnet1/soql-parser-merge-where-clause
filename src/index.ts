import { WhereClause, LogicalOperator } from 'soql-parser-js';

const wrapWhereClauseInParenthesis = (clause: WhereClause): { beginClause: WhereClause, endClause: WhereClause } => {
  const clone = JSON.parse(JSON.stringify(clause)) as WhereClause;
  clone.left.openParen = (clone.left.openParen ?? 0) + 1
  let current = clone;
  while (current.right) {
    current = current.right;
  }
  current.left.closeParen = (current.left.closeParen ?? 0) + 1
  return { beginClause: clone, endClause: current };
};

export const mergeWhereClauses = (
  where1?: WhereClause,
  where2?: WhereClause,
  operator: LogicalOperator = 'AND',
): WhereClause | undefined => {
  if (!where1 || !where2) return where1 ?? where2;

  const { beginClause: wrappedWhere1, endClause: endClause1 } = wrapWhereClauseInParenthesis(where1);
  const { beginClause: wrappedWhere2 } = wrapWhereClauseInParenthesis(where2);

  endClause1.operator = operator;
  endClause1.right = wrappedWhere2;

  return wrappedWhere1;
};
