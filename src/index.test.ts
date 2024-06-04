import { describe, expect, test, vi } from "vitest";

import WaitForJobs from "./WaitForJobs.js";

const { start } = vi.hoisted(() => {
    return {
        start: vi.fn().mockResolvedValue(null)
    };
});

vi.mock("./WaitForJobs", () => ({
    __esModule: true,
    default: vi.fn().mockImplementation(() => ({
        start: start
    }))
}));

describe("index.ts", () => {
    test("main", async () => {
        // import main
        await import("./index.js");
        expect(WaitForJobs).toHaveBeenCalled();
        expect(start).toHaveBeenCalled();
    });
});
