import { describe, expect, test } from "vitest";

import { compareDates } from "./dates.js";

describe("compareDates", () => {
    test("returns negative value with ascending order", () => {
        const actual = compareDates("2020-01-20T17:44:39Z", "2020-01-20T17:45:39Z");
        expect(actual).toBeLessThan(0);
    });

    test("returns negative value with descending order", () => {
        const actual = compareDates("2020-01-20T17:44:39Z", "2020-01-20T17:45:39Z", true);
        expect(actual).toBeGreaterThan(0);
    });

    test("returns 0 on null value", () => {
        const actual = compareDates(null, null);
        expect(actual).toBe(0);
    });

    test("handles date type", () => {
        const actual = compareDates(new Date("2020-01-20T17:44:39Z"), "2020-01-20T17:45:39Z");
        expect(actual).toBeLessThan(0);
    });
});
