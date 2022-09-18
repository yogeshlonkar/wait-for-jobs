/**
 * RegExp matcher for string values with given expected delimiter
 * https://regex101.com/r/MN05hH/1
 *
 * @param delimiter
 */
const matcher = (delimiter: string) => new RegExp(`(".*?"|'.*?'|[^"'${delimiter}]+)(?=\\s*${delimiter}|\\s*$)`, "gm");

/**
 * Split value using delimiter
 *
 * @param value to split
 * @param delimiter to split value with, if delimiter is not provided value is split with newline (\n) if present
 * else comma (,) is used to split the value
 */
export const valuesFrom = (value: string, delimiter?: string): Array<string> => {
    let values: string[];
    if (!delimiter && /\n/g.test(value)) {
        values = value.split("\n");
    } else if (!delimiter || delimiter === ",") {
        values = value.match(matcher(",")) ?? [];
    } else {
        values = value.match(matcher(delimiter)) ?? [];
    }
    if (values.length < 1) {
        throw new Error(`No values in value "${value}"`);
    }
    return new Array<string>(...values.map(d => d.trim()).map(d => d));
};
