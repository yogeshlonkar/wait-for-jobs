import "@octokit/rest";

import jobsResponse from "./__fixtures__/jobs.json";
import { getCurrentJobs } from "./jobs";

const listJobsForWorkflowRunAttempt = jest.fn();

jest.mock("@octokit/rest", () => ({
    Octokit: jest.fn().mockImplementation(() => ({
        actions: {
            listJobsForWorkflowRunAttempt
        }
    }))
}));

beforeEach(() => {
    listJobsForWorkflowRunAttempt.mockClear();
    process.env.GITHUB_REPOSITORY = "yogeshlonkar/wait-for-job";
    process.env.GITHUB_RUN_ID = "10";
    process.env.GITHUB_RUN_ATTEMPT = "1";
});

afterEach(() => {
    delete process.env["GITHUB_REPOSITORY"];
    delete process.env["GITHUB_RUN_ID"];
    delete process.env["GITHUB_RUN_ATTEMPT"];
});

describe("getCurrentJobs", () => {
    test("throws error on failed listJobsForWorkflowRunAttempt", async () => {
        listJobsForWorkflowRunAttempt.mockResolvedValue({
            status: 404
        });
        await expect(getCurrentJobs("some-auth")).rejects.toThrow(
            new Error(`unexpected status from api.github.com: 404`)
        );
    });

    test("returns Run", async () => {
        listJobsForWorkflowRunAttempt.mockResolvedValue(jobsResponse);
        await expect(getCurrentJobs("some-auth")).resolves.toEqual(jobsResponse.data);
        expect(listJobsForWorkflowRunAttempt).toBeCalledWith({
            attempt_number: 1,
            owner: "yogeshlonkar",
            repo: "wait-for-job",
            run_id: 10
        });
    });
});
