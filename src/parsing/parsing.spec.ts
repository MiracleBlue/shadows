import {
  pipe,
  toLower,
  type,
  equals
} from 'ramda';
import createParser, { ObjectLiteral, Consumer } from './index';

const isType = (expected: string) => pipe(type, toLower, equals(expected))

describe('Parser', () => {
  it('should take an object of conditions for identifying types of item', () => {
    const ITEM_TYPES = {
      LIST: 'item-types.list',
      IMPLICIT: 'non-item-types.implicit'
    };

    const createConsumer = createParser({
      [ITEM_TYPES.LIST]: (key, value) => key.startsWith('item') && Array.isArray(value),
      [ITEM_TYPES.IMPLICIT]: (key, value): value is boolean => !key.startsWith('item') && value === true
    })

    const consumer = createConsumer<Array<string>>({
      [ITEM_TYPES.LIST]: (result) => (key, value: string[]) => [...result, ...value],
      [ITEM_TYPES.IMPLICIT]: (result) => (key) => [...result, key]
    });

    const result = consumer({
      notAnItem: ['this should not be here'],
      itemThing: ['meow', 'woof', 'quack'],
      itemWrong: 'not item',
      itemOthers: ['hello'],
      foo: true
    }, []);

    expect(result).toEqual(['meow', 'woof', 'quack', 'hello', 'foo']);
  });

  it('should work with nested parsing', () => {
    type Result = Array<string>

    const ITEM_TYPES = {
      LIST: 'item-types.list',
      IMPLICIT: 'item-types.single',
      NESTED: 'item-types.nested'
    };

    console.time('consumer');

    const createConsumer = createParser({
      [ITEM_TYPES.LIST]: (key, value) => key.startsWith('item') && Array.isArray(value),
      [ITEM_TYPES.IMPLICIT]: (key, value) => !key.startsWith('item') && value === true,
      [ITEM_TYPES.NESTED]: (key, value) => isType('object')(value)
    })

    const consumer: Consumer<Result> = createConsumer({
      [ITEM_TYPES.LIST]: (result) => (key, value: Result) => [...result, ...value],
      [ITEM_TYPES.IMPLICIT]: (result) => (key) => [...result, key],
      [ITEM_TYPES.NESTED]: (result) => (key, value) => [...result, ...consumer(value, [])]
    })

    const result = consumer({
      notAnItem: ['this should not be here'],
      itemThing: ['meow', 'woof', 'quack'],
      itemWrong: 'not item',
      itemOthers: ['hello'],
      things: {
        moreThings: ['also not resulting', 'lorem', 'ipsum'],
        itemIpsum: ['dolor', 'sit amet'],
        testingImplicit: true,
        testingNestedagain: {
          turtles: 'all the way down',
          thisShouldReturn: 'absolutely nothing',
          things: {
            moreThings: ['also not resulting', 'lorem', 'ipsum'],
            itemIpsum: ['dolor', 'sit amet'],
            testingImplicit: true,
            testingNestedagain: {
              turtles: 'all the way down',
              thisShouldReturn: 'absolutely nothing',
              things: {
                moreThings: ['also not resulting', 'lorem', 'ipsum'],
                itemIpsum: ['dolor', 'sit amet'],
                testingImplicit: true,
                testingNestedagain: {
                  turtles: 'all the way down',
                  thisShouldReturn: 'absolutely nothing'
                },
                things: {
                  moreThings: ['also not resulting', 'lorem', 'ipsum'],
                  itemIpsum: ['dolor', 'sit amet'],
                  testingImplicit: true,
                  testingNestedagain: {
                    turtles: 'all the way down',
                    thisShouldReturn: 'absolutely nothing'
                  }
                }
              }
            }
          }
        }
      },
      foo: true
    }, []);

    console.timeEnd('consumer');

    expect(result).toEqual(expect.arrayContaining(['meow', 'woof', 'quack', 'hello', 'dolor', 'sit amet', 'testingImplicit', 'foo']));
  });

  it('can identify a pair as multiple types, and uses the first handler found which matches any of its types', () => {
    const ITEM_TYPES = {
      LIST: 'item-types.item-with-list',
      IMPLICIT: 'item-types.boolean-items',
      JUST_ITEM: 'item-types.item-keys-only.please',
      IS_ARRAY: 'item-types.just-gimme-all-your-arrays'
    };

    const createConsumer = createParser({
      [ITEM_TYPES.LIST]: (key, value) => key.startsWith('item') && Array.isArray(value),
      [ITEM_TYPES.IMPLICIT]: (key, value): value is boolean => !key.startsWith('item') && value === true,
      [ITEM_TYPES.JUST_ITEM]: (key, value) => key.startsWith('item'),
      [ITEM_TYPES.IS_ARRAY]: (key, value) => Array.isArray(value)
    })

    const consumerItemList = createConsumer<Array<string>>({
      [ITEM_TYPES.LIST]: (result) => (key, value) => [...result, ...value]
    })

    const consumerJustItem = createConsumer<Array<string>>({
      [ITEM_TYPES.JUST_ITEM]: (result) => (key, value) => [...result, ...value]
    })

    const consumerIsArray = createConsumer<Array<string>>({
      [ITEM_TYPES.IS_ARRAY]: (result) => (key, value) => [...result, ...value]
    })

    const testInput = {
      foo: true,
      notAnItem: ['this should definitely be here'],
      itemThing: ['meow', 'woof', 'quack'],
      itemWrong: 'not item',
      itemOthers: ['hello']
    }

    const resultItemList = consumerItemList(testInput, []);
    const resultJustItem = consumerJustItem(testInput, []);
    const resultIsArray = consumerIsArray(testInput, []);

    const arrayWithItemThing = expect.arrayContaining(['meow', 'woof', 'quack']);

    expect(resultItemList).toEqual(arrayWithItemThing)
    expect(resultJustItem).toEqual(arrayWithItemThing)
    expect(resultIsArray).toEqual(arrayWithItemThing)
  })

});
