import { describe, expect, test } from "vitest";

import { valuesFrom } from "./values.js";

describe("valuesFrom", () => {
    test("returns Array<string> on newline delimited input", () => {
        const actual = valuesFrom(`a\n b\nc \nd `);
        expect(actual).toEqual(["a", "b", "c", "d"]);
    });

    test("returns Array<string> on comma delimited input", () => {
        const actual = valuesFrom("a, b,c ,d ");
        expect(actual).toEqual(["a", "b", "c", "d"]);
    });

    test("returns Array<string> on # delimited input with option", () => {
        const actual = valuesFrom(`a# b#c #d `, "#");
        expect(actual).toEqual(["a", "b", "c", "d"]);
    });

    test("returns Array<string> on comma delimited input with option", () => {
        const actual = valuesFrom(`a, \nb,c ,d `, ",");
        expect(actual).toEqual(["a", "b", "c", "d"]);
    });

    test("returns Array<string> with single value with comma delimiter", () => {
        const actual = valuesFrom("a", ",");
        expect(actual).toEqual(["a"]);
    });

    test("returns Array<string> with values containing spaces", () => {
        const actual = valuesFrom("Job a, Job b");
        expect(actual).toEqual(["Job a", "Job b"]);
    });

    test("returns Array<string> with single value with # delimiter", () => {
        const actual = valuesFrom("a", "#");
        expect(actual).toEqual(["a"]);
    });

    test("throws error if comma delimited values not found", () => {
        expect(() => valuesFrom(``)).toThrow(new Error(`No values in value ""`));
    });

    test("throws error if # delimited values not found", () => {
        expect(() => valuesFrom(``, "#")).toThrow(new Error(`No values in value ""`));
    });
});
