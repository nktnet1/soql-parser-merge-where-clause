import type { WhereClause, LogicalOperator } from "soql-parser-js";

/**
 * Wraps the given `WhereClause` in parentheses - useful for merging.
 *
 * @param {WhereClause} clause - The `WhereClause` to be wrapped.
 * @returns {{beginClause: WhereClause, endClause: WhereClause}} An object
 *          containing the `beginClause` (the wrapped version of the input
 *          `clause`) and the `endClause` (the last clause where the right
 *          side of the expression ends with a close parenthesis).
 */
const wrapWhereClauseInParenthesis = (clause: WhereClause): { beginClause: WhereClause, endClause: WhereClause } => {
  const clone = JSON.parse(JSON.stringify(clause)) as WhereClause;
  clone.left.openParen = (clone.left.openParen ?? 0) + 1;
  let current = clone;
  while (current.right) {
    current = current.right;
  }
  current.left.closeParen = (current.left.closeParen ?? 0) + 1;
  return { beginClause: clone, endClause: current };
};

/**
 * Merges two `WhereClause` objects into a single clause, joining them with a
 * logical operator.
 *
 * @param {WhereClause} [where1] - First clause to merge. Optional.
 * @param {WhereClause} [where2] - Second clause to merge. Optional.
 * @param {LogicalOperator} [operator='AND'] - Operator used to join the clauses 
 * (default is 'AND'). Optional.
 *
 * @returns {WhereClause|undefined} A new `WhereClause` that represents the merged
 * expression, or `undefined` if both clauses are not provided.
 */
export const mergeWhereClauses = (
  where1?: WhereClause,
  where2?: WhereClause,
  operator: LogicalOperator = "AND",
): WhereClause | undefined => {
  if (!where1 || !where2) return where1 ?? where2;

  const { beginClause: wrappedWhere1, endClause: endClause1 } = wrapWhereClauseInParenthesis(where1);
  const { beginClause: wrappedWhere2 } = wrapWhereClauseInParenthesis(where2);

  endClause1.operator = operator;
  endClause1.right = wrappedWhere2;

  return wrappedWhere1;
};
