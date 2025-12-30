import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";

import { debug, info } from "@actions/core";
import { resolve } from "path";
import { promisify } from "util";

import { getOutput } from "./artifacts.js";

const artifactClient = vi.hoisted(() => {
    return {
        getArtifact: vi.fn(),
        downloadArtifact: vi.fn()
    };
});
vi.mock(import("@actions/artifact"), () => ({
    DefaultArtifactClient: vi.fn().mockImplementation(function () {
        return artifactClient;
    })
}));
vi.mock("@actions/core");
vi.mock("util");

describe("getOutput", () => {
    const artifactName = "some-output.json";
    const readFile = vi.fn();

    beforeEach(() => {
        process.env.RUNNER_TEMP = "random-dir";
        process.env.GITHUB_RUN_ID = "10";
        process.env.GITHUB_RUN_ATTEMPT = "1";
        artifactClient.getArtifact.mockResolvedValueOnce({
            artifact: {
                id: 123
            }
        });
        readFile.mockReset();
        promisify.mockReset();
        debug.mockReset();
        info.mockReset();
        promisify.mockReturnValueOnce(readFile);
        readFile.mockResolvedValueOnce(
            JSON.stringify({
                result: "success",
                abc: "xyz"
            })
        );
    });

    test("returns output for job", async () => {
        artifactClient.downloadArtifact.mockResolvedValueOnce({
            downloadPath: resolve("some")
        });
        await expect(getOutput(artifactName)).resolves.toEqual({
            result: "success",
            abc: "xyz"
        });
        const expected = resolve("some", "some-output.json");
        expect(readFile).toHaveBeenCalledWith(expected);
    });

    test("throws error if no artifact to download", async () => {
        artifactClient.downloadArtifact.mockResolvedValueOnce({});
        await expect(getOutput(artifactName)).rejects.toEqual(new Error(`Failed to download artifact ${artifactName}`));
        expect(readFile).not.toHaveBeenCalledWith();
    });

    afterEach(() => {
        delete process.env["RUNNER_TEMP"];
        delete process.env["GITHUB_RUN_ID"];
        delete process.env["GITHUB_RUN_ATTEMPT"];
    });
});
