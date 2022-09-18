import "../../test.globals";

import { create } from "@actions/artifact";
import { debug, info } from "@actions/core";
import { resolve } from "path";
import { promisify } from "util";

import { getOutput } from "./artifacts";

jest.mock("@actions/artifact");
jest.mock("@actions/core");
jest.mock("util");

describe("getOutput", () => {
    const output = "some-output.json";
    const readFile = jest.fn();

    beforeEach(() => {
        process.env.RUNNER_TEMP = "random-dir";
        process.env.GITHUB_RUN_ID = "10";
        process.env.GITHUB_RUN_ATTEMPT = "1";
        create
            .asMock()
            .mockReset()
            .mockImplementationOnce(() => {
                return {
                    downloadArtifact: jest.fn().mockResolvedValueOnce({
                        artifactName: "output.json",
                        downloadPath: "some"
                    })
                };
            });
        readFile.mockReset();
        promisify.asMock().mockReset();
        debug.asMock().mockReset();
        info.asMock().mockReset();
        promisify.asMock().mockReturnValueOnce(readFile);
        readFile.mockResolvedValueOnce(
            JSON.stringify({
                result: "success",
                abc: "xyz"
            })
        );
    });

    test("returns output for job", async () => {
        await expect(getOutput(output)).resolves.toEqual({
            result: "success",
            abc: "xyz"
        });
        const expected = resolve("some/some-output.json");
        expect(readFile).toBeCalledWith(expected);
    });

    afterEach(() => {
        delete process.env["RUNNER_TEMP"];
        delete process.env["GITHUB_RUN_ID"];
        delete process.env["GITHUB_RUN_ATTEMPT"];
    });
});
