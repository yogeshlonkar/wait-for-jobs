import { afterEach, beforeEach, describe, expect, test, vi } from "vitest";
import "@octokit/rest";

import jobsResponse from "./__fixtures__/jobs.json";
import { getCurrentJobs } from "./jobs.js";

const listJobsForWorkflowRunAttempt = vi.fn();
const paginate = vi.fn();
const octokit = vi.fn();

vi.mock("@octokit/rest", () => ({
    Octokit: {
        plugin: () =>
            vi.fn().mockImplementation(function () {
                return {
                    paginate,
                    actions: {
                        listJobsForWorkflowRunAttempt
                    }
                };
            })
    }
}));

beforeEach(() => {
    listJobsForWorkflowRunAttempt.mockClear();
    paginate.mockClear();
    process.env.GITHUB_REPOSITORY = "yogeshlonkar/wait-for-job";
    process.env.GITHUB_RUN_ID = "10";
    process.env.GITHUB_RUN_ATTEMPT = "1";
    process.env.GITHUB_API_URL = "https://api.github.com";
});

afterEach(() => {
    delete process.env["GITHUB_REPOSITORY"];
    delete process.env["GITHUB_RUN_ID"];
    delete process.env["GITHUB_RUN_ATTEMPT"];
});

describe("getCurrentJobs", () => {
    test("returns Run", async () => {
        paginate.mockResolvedValue(jobsResponse.data.jobs);
        await expect(getCurrentJobs("some-auth")).resolves.toEqual(jobsResponse.data);
        expect(paginate).toHaveBeenCalledWith(listJobsForWorkflowRunAttempt, {
            attempt_number: 1,
            owner: "yogeshlonkar",
            repo: "wait-for-job",
            run_id: 10
        });
    });

    test("uses Octokit with token and baseUrl", async () => {
        getCurrentJobs("some-auth-2");
        expect(octokit).not.toHaveBeenCalledWith({
            auth: "some-auth-2",
            baseUrl: "https://api.github.com"
        });
    });
});
