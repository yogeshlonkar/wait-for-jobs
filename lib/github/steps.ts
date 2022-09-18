export interface Step {
    /**
     * @description The phase of the lifecycle that the job is currently in.
     * @example queued
     * @enum {string}
     */
    status: "queued" | "in_progress" | "completed";
    /**
     * @description The outcome of the job.
     * @example success
     */
    conclusion: string | null;
    /**
     * @description The name of the job.
     * @example test-coverage
     */
    name: string;
    /** @example 1 */
    number: number;
    /**
     * Format: date-time
     * @description The time that the step started, in ISO 8601 format.
     * @example 2019-08-08T08:00:00-07:00
     */
    started_at?: string | null;
    /**
     * Format: date-time
     * @description The time that the job finished, in ISO 8601 format.
     * @example 2019-08-08T08:00:00-07:00
     */
    completed_at?: string | null;
}
