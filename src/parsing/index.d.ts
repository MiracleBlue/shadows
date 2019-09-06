export declare type Predicate<item> = (args: item) => boolean;
export declare type ObjectLiteral = {
    [key: string]: any;
};
export declare type Matcher = (key: string, value: any) => boolean;
export declare type Conditions = Record<string, Matcher>;
export declare type Consumer<result> = (original: ObjectLiteral, initialResult: result) => result;
export declare type Transformer<result = any> = (result: result) => (key: string, value: any) => result;
export declare type Interpreters<matchers extends Conditions, result> = {
    [K in keyof matchers]: Transformer<result>;
};
declare const createParser: <typeConditions extends Record<string, Matcher>>(typeConditions: typeConditions) => <result>(typeHandlers: Interpreters<typeConditions, result>) => Consumer<result>;
export default createParser;
//# sourceMappingURL=index.d.ts.map