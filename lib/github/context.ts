export class Context {
    tempDir: string;
    runId: number;
    runAttempt: number;
    apiUrl: string;

    get repo(): { owner: string; repo: string } {
        if (process.env.GITHUB_REPOSITORY) {
            const [owner, repo] = process.env.GITHUB_REPOSITORY.split("/");
            return { owner, repo };
        }
        throw new Error("context.repo requires a GITHUB_REPOSITORY environment variable like 'owner/repo'");
    }

    constructor() {
        this.tempDir = process.env.RUNNER_TEMP as string;
        this.runId = parseInt(process.env.GITHUB_RUN_ID as string, 10);
        this.runAttempt = parseInt(process.env.GITHUB_RUN_ATTEMPT as string, 10);
        this.apiUrl = process.env.GITHUB_API_URL ?? "https://api.github.com";
    }
}
