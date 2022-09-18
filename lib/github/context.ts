import { Context as GhContext } from "@actions/github/lib/context";

export class Context extends GhContext {
    runAttempt: number;
    tempDir: string;
    constructor() {
        super();
        this.runAttempt = parseInt(process.env.GITHUB_RUN_ATTEMPT as string, 10);
        this.tempDir = process.env.RUNNER_TEMP as string;
    }
}
