import { describe, expect, test } from "vitest";

import { duration } from "./duration.js";

describe("duration", () => {
    test("returns 1d2h3m4s", () => {
        const actual = duration(new Date("2020-01-20T17:44:39Z"), new Date("2020-01-21T19:47:43Z"));
        expect(actual).toBe("1d2h3m4s");
    });
    test("returns 1d0h3m0s", () => {
        const actual = duration(new Date("2020-01-20T17:44:39Z"), new Date("2020-01-21T17:47:39Z"));
        expect(actual).toBe("1d0h3m0s");
    });
    test("returns 1d0h0m0s", () => {
        const actual = duration(new Date("2020-01-20T17:44:39Z"), new Date("2020-01-21T17:44:39Z"));
        expect(actual).toBe("1d0h0m0s");
    });
    test("returns 2h0m0s", () => {
        const actual = duration(new Date("2020-01-20T17:44:39Z"), new Date("2020-01-20T19:44:39Z"));
        expect(actual).toBe("2h0m0s");
    });
    test("returns 3m0s", () => {
        const actual = duration(new Date("2020-01-20T17:44:39Z"), new Date("2020-01-20T17:47:39Z"));
        expect(actual).toBe("3m0s");
    });
    test("returns 4s", () => {
        const actual = duration(new Date("2020-01-20T17:44:39Z"), new Date("2020-01-20T17:44:43Z"));
        expect(actual).toBe("4s");
    });
    test("returns 0s", () => {
        const actual = duration(new Date("2020-01-20T17:44:39Z"), new Date("2020-01-20T17:44:39Z"));
        expect(actual).toBe("0s");
    });
});
