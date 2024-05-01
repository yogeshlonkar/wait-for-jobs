import "../testUtil";

import { debug, endGroup, getInput, info, setFailed, setOutput, startGroup, warning } from "@actions/core";

import { getCurrentJobs, getOutput, Job } from "../lib/github";
import { duration, sleep, valuesFrom } from "../lib/miscellaneous";
import inProgressJobs from "./__fixtures__/in_progress-jobs.json";
import inProgressJobs2 from "./__fixtures__/in_progress-jobs-2.json";
import pendingJobs from "./__fixtures__/pending-jobs.json";
import successfulJobs from "./__fixtures__/successful-jobs.json";
import waitingJobs from "./__fixtures__/waiting-jobs.json";
import WaitForJobs from "./WaitForJobs";

jest.mock("@actions/core");
jest.mock("../lib/github");
jest.mock("../lib/miscellaneous");

beforeEach(() => {
    // reset mocks
    for (const mock of [
        debug,
        info,
        warning,
        endGroup,
        getCurrentJobs,
        getInput,
        getOutput,
        setFailed,
        setOutput,
        sleep,
        startGroup
    ]) {
        mock.asMock().mockReset();
    }
    for (const input of ["some-gh-token", "build", "false", "false", "false", "2000", "1", "false"]) {
        getInput.asMock().mockReturnValueOnce(input);
    }
    const miscellaneous = jest.requireActual("../lib/miscellaneous");
    sleep.asMock().mockImplementation((_: number, controller: AbortController, label?: string) => {
        if (label === "action-timeout") {
            // don't time out from test
            return miscellaneous.sleep(10 * 60 * 1000, controller);
        }
        // reduce sleep time for delay between job status check for test
        return miscellaneous.sleep(1, controller);
    });
    valuesFrom.asMock().mockImplementation(miscellaneous.valuesFrom);
    duration.asMock().mockImplementationOnce(miscellaneous.duration);
});

describe("wait-for-jobs", () => {
    test("ends successfully on all job completion", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce(successfulJobs);
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).not.toHaveBeenCalled();
    });

    test("ends successfully on all job completion with prefix", async () => {
        getInput.asMock().mockReset();
        for (const input of ["some-gh-token", "bui", "true", "false", "false", "2000", "1", "false"]) {
            getInput.asMock().mockReturnValueOnce(input);
        }
        getCurrentJobs.asMock().mockResolvedValueOnce(successfulJobs);
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).not.toHaveBeenCalled();
    });

    test("ends successfully on all job completion with suffix", async () => {
        getInput.asMock().mockReset();
        for (const input of ["some-gh-token", "ild", "false", "true", "false", "2000", "1", "false"]) {
            getInput.asMock().mockReturnValueOnce(input);
        }
        getCurrentJobs.asMock().mockResolvedValueOnce(successfulJobs);
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).not.toHaveBeenCalled();
    });

    test("wait for multiple jobs with same suffix", async () => {
        getInput.asMock().mockReset();
        for (const input of ["some-gh-token", "ild", "false", "true", "false", "2000", "1", "false"]) {
            getInput.asMock().mockReturnValueOnce(input);
        }
        getCurrentJobs.asMock().mockResolvedValueOnce(inProgressJobs2);
        const nextResponse = JSON.parse(JSON.stringify(inProgressJobs2));
        nextResponse.jobs = nextResponse.jobs.map((job: Job) => {
            job.status = "completed";
            job.conclusion = "success";
            return job;
        });
        getCurrentJobs.asMock().mockResolvedValueOnce(nextResponse);
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(getCurrentJobs).toHaveBeenCalledTimes(2);
        expect(info).toHaveBeenCalledWith(`dependency: "ild", lastJob to finish: "Next to next build"`);
        expect(setFailed).not.toHaveBeenCalled();
    });

    test("ends successfully after 2nd try", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce(inProgressJobs);
        getCurrentJobs.asMock().mockResolvedValueOnce(successfulJobs);
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(getCurrentJobs).toHaveBeenCalledTimes(2);
        expect(sleep).toHaveBeenCalledTimes(2);
        expect(setFailed).not.toHaveBeenCalled();
    });

    test("wait for waiting jobs", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce(waitingJobs);
        getCurrentJobs.asMock().mockResolvedValueOnce(successfulJobs);
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(getCurrentJobs).toHaveBeenCalledTimes(2);
        expect(sleep).toHaveBeenCalledTimes(2);
        expect(setFailed).not.toHaveBeenCalled();
    });

    test("wait for pending jobs", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce(pendingJobs);
        getCurrentJobs.asMock().mockResolvedValueOnce(successfulJobs);
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(getCurrentJobs).toHaveBeenCalledTimes(2);
        expect(sleep).toHaveBeenCalledTimes(2);
        expect(setFailed).not.toHaveBeenCalled();
    });

    test("setFailed on error", async () => {
        getCurrentJobs.asMock().mockImplementationOnce(() => {
            throw new Error("unexpected status from api.github.com: 404");
        });
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).toHaveBeenCalledWith("unexpected status from api.github.com: 404");
    });

    test("setFailed on timeout", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce(inProgressJobs);
        sleep.asMock().mockReset();
        sleep.asMock().mockImplementation((_: number, controller: AbortController, label?: string) => {
            const miscellaneous = jest.requireActual("../lib/miscellaneous");
            if (label === "action-timeout") {
                // time out from test
                return miscellaneous.sleep(5, controller);
            }
            // increase sleep time for delay between job status check for test
            return miscellaneous.sleep(10 * 60 * 1000, controller);
        });
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(sleep).toHaveBeenCalledWith(expect.anything(), expect.anything(), "wait-for-jobs");
        expect(setFailed).toHaveBeenCalledWith("error: jobs [build] did not complete in 1 minutes");
    });

    test("warning if no job found for dependency", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce({
            total_count: 1,
            jobs: []
        });
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(warning).toHaveBeenCalledWith('⚠️ no job found for "build" in run');
    });

    test("handle non error rejected promise", async () => {
        getCurrentJobs.asMock().mockImplementationOnce(() => {
            throw 404;
        });
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).toHaveBeenCalledWith("404");
    });

    test("handle unknown status", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce({
            jobs: [{ name: "build", status: "gollum" }]
        });
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).toHaveBeenCalledWith('error: unknown status "gollum" of job "build"');
    });

    test("handle unknown conclusion", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce({
            jobs: [{ name: "build", status: "completed", conclusion: "gollum" }]
        });
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).toHaveBeenCalledWith('error: unknown conclusion "gollum" of job "build"');
    });

    test("handle failure conclusion", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce({
            jobs: [{ name: "build", status: "completed", conclusion: "failure" }]
        });
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).toHaveBeenCalledWith('error: job "build" failed');
    });

    test("handle skipped conclusion", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce({
            jobs: [{ name: "build", status: "completed", conclusion: "skipped" }]
        });
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).toHaveBeenCalledWith('error: job dependency "build" skipped but ignore-skipped not set');
    });

    test("handle skipped conclusion with ignore-skipped", async () => {
        getInput.asMock().mockReset();
        for (const input of ["some-gh-token", "build", "false", "false", "true", "2000", "1", "false"]) {
            getInput.asMock().mockReturnValueOnce(input);
        }
        getCurrentJobs.asMock().mockResolvedValueOnce({
            jobs: [{ name: "build", status: "completed", conclusion: "skipped" }]
        });

        getCurrentJobs.asMock().mockResolvedValueOnce({
            jobs: [{ name: "build", status: "completed", conclusion: "success" }]
        });
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(info).toHaveBeenCalledWith('ignoring skipped job "build" 😒');
    });

    test("handle cancelled conclusion", async () => {
        getCurrentJobs.asMock().mockResolvedValueOnce({
            jobs: [{ name: "build", status: "completed", conclusion: "cancelled" }]
        });
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).toHaveBeenCalledWith('error: job dependency "build" got cancelled');
    });

    test("handle jobs with outputs", async () => {
        getInput.asMock().mockReturnValueOnce("output1.json");
        getOutput.asMock().mockResolvedValueOnce({ out1: "some-value", out2: { some: "some-value2" } });
        getCurrentJobs.asMock().mockResolvedValueOnce(successfulJobs);
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setOutput).toHaveBeenCalledWith("outputs", `{"out1":"some-value","out2":{"some":"some-value2"}}`);
    });

    test("warn on multiple outputs with same key", async () => {
        getInput.asMock().mockReturnValueOnce("output1.json,output2.json");
        getOutput.asMock().mockResolvedValueOnce({ out1: "some-value", out2: { some: "some-value2" } });
        getOutput.asMock().mockResolvedValueOnce({ out1: "other-value" });
        getCurrentJobs.asMock().mockResolvedValueOnce(successfulJobs);
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(warning).toHaveBeenCalledWith("overwriting previously set outputs.out1 with output from output2.json");
        expect(setOutput).toHaveBeenCalledWith("outputs", `{"out1":"other-value","out2":{"some":"some-value2"}}`);
    });

    test("handle error fetching job output", async () => {
        getInput.asMock().mockReturnValueOnce("output1.json");
        getOutput.asMock().mockImplementationOnce(() => {
            throw new Error("error fetching job output");
        });
        getCurrentJobs.asMock().mockResolvedValueOnce(successfulJobs);
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(setFailed).toHaveBeenCalledWith("error fetching job output");
    });

    test("handle ttl greater than 15 minutes", async () => {
        getInput.asMock().mockReset();
        for (const input of ["some-gh-token", "build", "false", "false", "true", "2000", "16", "false"]) {
            getInput.asMock().mockReturnValueOnce(input);
        }
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(sleep).toHaveBeenCalledWith(15 * 60 * 1000, expect.anything(), "action-timeout");
        expect(warning).toHaveBeenCalledWith(
            "Overwriting ttl to 15 minutes. If depdencies requires more than 15 minutes to finish perhaps the dependee jobs should not prestart"
        );
    });

    test("handle ttl greater than 15 minutes and no-max-ttl", async () => {
        getInput.asMock().mockReset();
        for (const input of ["some-gh-token", "build", "false", "false", "true", "2000", "16", "true"]) {
            getInput.asMock().mockReturnValueOnce(input);
        }
        await expect(new WaitForJobs().start()).resolves.toBeUndefined();
        expect(sleep).toHaveBeenCalledWith(16 * 60 * 1000, expect.anything(), "action-timeout");
    });
});
