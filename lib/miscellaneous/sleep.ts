import { debug } from "@actions/core";
import { setTimeout } from "timers/promises";

/**
 * Sleep for given milliseconds
 *
 * @param time in milliseconds to sleep for
 * @param controller to abort timeout
 * @param label for the sleep
 */
export const sleep = async (time: number, controller: AbortController, label?: string) => {
    await setTimeout(time, undefined, { signal: controller.signal });
    if (label) {
        debug(`${label} done`);
    }
};
