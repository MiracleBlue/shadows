import {
  curry,
  toPairs,
  pipe,
  chain,
  reduce,
  // map,
  head,
  keys,
  pick,
  always,
  prop,
  has
} from 'ramda';

import {
  Option,
  fromNullable
} from 'fp-ts/lib/Option';

import {
  map,
  // reduce,
  findFirst,
  filter,
  // head,
  array
} from 'fp-ts/lib/Array';

export type Predicate<item> = (args: item) => boolean;
export type ObjectLiteral = { [key: string]: any }

export type Matcher = (key: string, value: any) => boolean
export type Conditions = Record<string, Matcher>

export type Consumer<result> = (original: ObjectLiteral, initialResult: result) => result
export type Transformer<result = any> = (result: result) => (key: string, value: any) => result

export type Interpreters<matchers extends Conditions, result> = {
  // Not sure if this constraint is even working properly tbh
  [K in keyof matchers]: Transformer<result>
}

const hasPropIn = (original: ObjectLiteral) => (key: string) => has(key, original)
const getPropFrom = (original: ObjectLiteral) => (key: string) => fromNullable(prop(key, original));

const findMaybe = <item>(predicate: Predicate<item>) =>
  (original: item[]): Option<item> =>
    findFirst(predicate)(original)

const pickIntersecting = pipe(
  keys,
  pick
)
// Combines the predicates from Conditions with the transforming functions from interpreters
// to create a full parser. Keys in the `typeHandlers` object should be a subset of keys from
// the `typeConditions` object.
const generateTypeMatcher = <typeConditions extends Conditions, result>(typeConditions: typeConditions, typeHandlers: Interpreters<typeConditions, result>) => {
  const handledConditions = pickIntersecting(typeHandlers)(typeConditions);
  const handledConditionPairs = toPairs(handledConditions);

  return (
    (key: string, value: any): Option<string> => {
      const matchedTypes = findMaybe<[string, any]>(
        ([typeName, predicate]) => predicate(key, value)
      )(handledConditionPairs);

      return (
        matchedTypes
          .map(head)
      );
    }
  )
}

const matchTypeWithHandler = (handlers: ObjectLiteral) => (key: string) => fromNullable(prop(key, handlers));

const handleDefault: Transformer = (result) => (key, value) => result;

const createParser = <typeConditions extends Conditions>(typeConditions: typeConditions) => {
  const createConsumer = <result>(typeHandlers: Interpreters<typeConditions, result>): Consumer<result> => {
    const findMatchingTypes = generateTypeMatcher(typeConditions, typeHandlers);

    const consumer: Consumer<result> = (original: ObjectLiteral, initialResult: result) => {
      const originalPairs = toPairs(original);

      const createResultFromPairs = reduce((result: result, [key, value]) => {
        const parseItem = (
          findMatchingTypes(key, value)
          .chain(getPropFrom(typeHandlers))
          .getOrElse(handleDefault)
        )

        return parseItem(result)(key, value);
      }, initialResult);

      return createResultFromPairs(originalPairs);
    }

    return consumer;
  }

  return createConsumer;
}

export default createParser;
