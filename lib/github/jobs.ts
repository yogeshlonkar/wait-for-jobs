import { debug } from "@actions/core";
import { components } from "@octokit/openapi-types/types.d";
import { Octokit } from "@octokit/rest";
import { retry } from "@octokit/plugin-retry";

import { Context } from "./context";

const MyOctokit = Octokit.plugin(retry);

/**
 * Jobs of perceptual run
 */
export interface Jobs {
    /**
     * total count of jobs in a run
     */
    total_count: number;
    /**
     * jobs with details in a run
     */
    jobs: components["schemas"]["job"][];
}

export type Job = components["schemas"]["job"];

/**
 * Get jobs for current run
 *
 * @param token to access https://api.github.com/repos/{owner}/{repo}/actions/runs/{run_id}/attempts/{attempt_number}/jobs
 * @returns current run details
 */
export async function getCurrentJobs(token: string): Promise<Jobs> {
    // prettier-ignore
    const { runId: run_id, runAttempt: attempt_number, repo: { owner, repo } } = new Context();
    // prettier-ignore
    const { actions: { listJobsForWorkflowRunAttempt } } = new MyOctokit({ auth: token });
    debug(`fetching jobs for /repos/${owner}/${repo}/actions/runs/${run_id}/attempts/${attempt_number}/jobs`);
    const { status, data } = await listJobsForWorkflowRunAttempt({
        attempt_number,
        owner,
        repo,
        run_id
    });
    if (status !== 200) {
        throw new Error(`unexpected status from api.github.com: ${status}`);
    }
    return data;
}
