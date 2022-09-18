import { info } from "@actions/core";

import { Job } from "../lib/github";

export class Dependency {
    readonly name: string;
    readonly ignoreSkipped: boolean;
    readonly jobs: Job[];

    constructor(name: string, jobs: Job[], ignoreSkipped: boolean) {
        this.name = name;
        this.jobs = jobs;
        this.ignoreSkipped = ignoreSkipped;
    }

    /**
     * Checks all in jobs in this dependency are completed
     */
    completed = (): boolean => {
        return this.jobs.length === this.jobs.filter(this.isCompleted).length;
    };

    /**
     * Checks if job has completed status
     * - Prints info message on in_progress, queued status
     * - On unknown status will throw error
     *
     * @param job to check
     */
    private isCompleted = (job: Job): boolean => {
        const { name, status, steps } = job;
        const stepName = steps?.find(step => step.status === "in_progress")?.name ?? "🤷‍♂️";
        switch (status) {
            case "completed":
                return true;
            case "in_progress":
                info(`job "${name}" in progress ⌛ current step "${stepName}"`);
                return false;
            case "queued":
                info(`job "${name}" not started yet 👀`);
                return false;
            default:
                // this should never happen
                throw new Error(`error: unknown status "${status}" of job "${name}"`);
        }
    };

    /**
     * Checks all in jobs in this dependency are successful
     */
    successful = (): boolean => {
        return this.jobs.length === this.jobs.filter(this.isSuccess).length;
    };

    /**
     * Checks if job has success conclusion
     * - Returns true and prints info message on skipped and success conclusion
     * - On failure, skipped conclusion without ignoreSkipped will throw error
     * - On unknown conclusion will throw error
     *
     * @param job to check
     */
    private isSuccess = (job: Job): boolean => {
        const { name, conclusion } = job;
        switch (conclusion) {
            case "success":
                info(`job "${name}" completed with success ✅`);
                break;
            case "failure":
                throw new Error(`error: job "${name}" failed`);
            case "skipped":
                if (this.ignoreSkipped) {
                    info(`ignoring skipped job "${name}" 😒`);
                    break;
                }
                throw new Error(`error: job dependency "${name}" skipped but ignore-skipped not set`);
            case "cancelled":
                throw new Error(`error: job dependency "${name}" got cancelled`);
            default:
                // this should never happen
                throw new Error(`error: unknown conclusion "${conclusion}" of job "${name}"`);
        }
        return true;
    };
}
