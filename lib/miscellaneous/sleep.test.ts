import { expect, test, vi } from "vitest";

import { debug } from "@actions/core";

import { sleep } from "./sleep.js";

vi.mock("@actions/core");

test("sleep debug logs label", async () => {
    const controller = new AbortController();
    await expect(sleep(2, controller, "label-1")).resolves.toBeUndefined();
    expect(debug).toHaveBeenCalledWith("label-1 done");
});
