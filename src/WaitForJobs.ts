import { debug, endGroup, getInput, info, setFailed, setOutput, startGroup, warning } from "@actions/core";

import { getCurrentJobs, getOutput, Job } from "../lib/github";
import { duration, sleep, valuesFrom } from "../lib/miscellaneous";
import { compareDates } from "../lib/miscellaneous/dates";
import { Dependency } from "./Dependency";

enum INPUTS {
    GH_TOKEN = "gh-token",
    IGNORE_SKIPPED = "ignore-skipped",
    INTERVAL = "interval",
    JOBS = "jobs",
    PREFIX = "prefix",
    SUFFIX = "suffix",
    TTL = "ttl",
    OUTPUTS_FROM = "outputs-from"
}

class Summary {
    readonly name: string;
    readonly lastJob: Job;
    constructor(name: string, lastJob: Job) {
        this.name = name;
        this.lastJob = lastJob;
    }

    toString(): string {
        return `dependency: "${this.name}", lastJob to finish: "${this.lastJob.name}"`;
    }
}

export default class WaitForJobs {
    private readonly asPrefix: boolean;
    private readonly asSuffix: boolean;
    private readonly ignoreSkipped: boolean;
    private readonly interval: number;
    private readonly jobNames: Array<string>;
    private readonly outputFiles = new Array<string>();
    private readonly startedAt = new Date();
    private readonly summaries = new Array<Summary>();
    private readonly taskCtrl = new AbortController();
    private readonly timeoutCtrl = new AbortController();
    private readonly token: string;
    private readonly ttl: number;

    constructor() {
        this.token = getInput(INPUTS.GH_TOKEN, { required: true });
        this.jobNames = valuesFrom(getInput(INPUTS.JOBS, { required: true }));
        this.asPrefix = getInput(INPUTS.PREFIX) === "true";
        this.asSuffix = getInput(INPUTS.SUFFIX) === "true";
        this.ignoreSkipped = getInput(INPUTS.IGNORE_SKIPPED) === "true";
        this.interval = parseInt(getInput(INPUTS.INTERVAL), 10);
        this.ttl = parseInt(getInput(INPUTS.TTL), 10);
        if (this.ttl > 15) {
            warning(
                "Overwriting ttl to 15 minutes. If depdencies requires more than 15 minutes to finish perhaps the dependee jobs should not prestart"
            );
            this.ttl = 15;
        }
        const outputs = getInput(INPUTS.OUTPUTS_FROM);
        if (outputs && outputs.trim()) {
            this.outputFiles = valuesFrom(outputs);
        }
    }

    /**
     * current pending jobNames that were provided in input
     */
    get pending(): string {
        return `[${this.jobNames.join(", ")}]`;
    }

    get withPrefixOrSuffix(): string {
        return this.asSuffix
            ? "with suffix"
            : (this.asPrefix ? "with prefix" : "");
    }

    /**
     * Returns {@link Dependency} for given name
     *
     * @param name of dependency
     * @param jobs to search for dependency in
     */
    private toCheck = (name: string, jobs: Job[]): Dependency => {
        const js = jobs.filter(job => (this.asSuffix && job.name.endsWith(name)) ||
                                      (this.asPrefix && job.name.startsWith(name)) ||
                                       job.name === name);
        return new Dependency(name, js, this.ignoreSkipped);
    };

    /**
     * Returns false for {@link Dependency} with no jobs
     *
     * @param dependency to check
     */
    private empty = (dependency: Dependency): boolean => {
        if (dependency.jobs.length == 0) {
            warning(`⚠️ no job found for "${dependency.name}" in run`);
        }
        return dependency.jobs.length > 0;
    };

    /**
     * Wait for jobs based on inputs
     */
    private wait = async () => {
        const { interval, token, withPrefixOrSuffix: withPrefixOrSuffix, taskCtrl, pending, summaries } = this;
        const { setOutputs } = this;
        startGroup(`checking status of jobs: ${pending} ${withPrefixOrSuffix}`);
        for (;;) {
            const { total_count, jobs } = await getCurrentJobs(token);
            debug(`current run jobs: ${total_count}`);
            const fullFilled = this.jobNames
                .map(name => this.toCheck(name, jobs))
                .filter(this.empty)
                .filter(d => d.completed())
                .filter(d => d.successful());
            for (const dependency of fullFilled) {
                const name = this.jobNames.remove(dependency.name);
                const lastJob = dependency.jobs.sort((a, b) => compareDates(a.completed_at, b.completed_at, true))[0];
                summaries.push(new Summary(name, lastJob));
            }
            if (this.jobNames.isEmpty()) {
                break;
            }
            // not using destructured pending because it will change ever run
            info(`waiting for jobs ${this.pending}`);
            await sleep(interval, taskCtrl, "wait-for-jobs");
        }
        await setOutputs();
        endGroup();
    };

    /**
     * Set outputs from output files
     */
    private setOutputs = async () => {
        const outputs = {} as Record<string, unknown>;
        info("getting job outputs");
        for (const outputFile of this.outputFiles) {
            const jobOutputs = await getOutput(outputFile);
            for (const [name, value] of Object.entries(jobOutputs)) {
                if (name in outputs) {
                    warning(`overwriting previously set outputs.${name} with output from ${outputFile}`);
                }
                outputs[name] = value;
            }
        }
        if (!this.outputFiles.isEmpty()) {
            setOutput("outputs", JSON.stringify(outputs));
        } else {
            debug("no outputs to fetch");
        }
    };

    /**
     * Timeout execution after {@link ttl}
     */
    private timeout = async () => {
        await sleep(this.ttl * 60 * 1000, this.timeoutCtrl, "action-timeout");
        throw new Error(`error: jobs ${this.pending} did not complete in ${this.ttl} minutes`);
    };

    private cleanup = () => {
        this.taskCtrl.abort();
        this.timeoutCtrl.abort();
        endGroup();
    };

    /**
     * handle rejection from {@link Promise.race}
     *
     * @param reason The rejection reason
     */
    private onRejected = (reason: unknown) => {
        this.cleanup();
        if (reason instanceof Error) {
            setFailed(reason.message);
        } else {
            setFailed(`${reason}`);
        }
    };

    /**
     * Start waiting for jobs to complete
     */
    public start = async (): Promise<void> => {
        const { timeout, wait, cleanup, onRejected, summaries } = this;
        await Promise.race([timeout(), wait()]).then(cleanup, onRejected);
        summaries.forEach(summary => info(summary.toString()));
        info(`took ${duration(this.startedAt)}, all job dependencies completed with success 🎉`);
    };
}
