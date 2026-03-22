import { Context as GhContext } from "@actions/github/lib/context.js";

export class Context extends GhContext {
    tempDir: string;
    constructor() {
        super();
        this.tempDir = process.env.RUNNER_TEMP as string;
    }
}
