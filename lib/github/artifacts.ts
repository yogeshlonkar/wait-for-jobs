import { create } from "@actions/artifact";
import { debug } from "@actions/core";
import fs from "fs";
import { resolve } from "path";
import { promisify } from "util";

import { Context } from "./context";

/**
 * Get output from JSON artifact file
 *
 * @param artifactName JSON file containing outputs
 * @returns output
 */
export async function getOutput(artifactName: string): Promise<Record<string, unknown>> {
    const { tempDir } = new Context();
    const resolvedPath = resolve(tempDir, artifactName);
    debug(`Storing output in ${resolvedPath}`);
    const artifactClient = create();
    // download outputs.json artifact
    const downloadOptions = { createArtifactFolder: false };
    debug(`Downloading download ${artifactName}`);
    const downloadResponse = await artifactClient.downloadArtifact(artifactName, resolvedPath, downloadOptions);
    debug(`Artifact ${downloadResponse.artifactName} was downloaded to ${downloadResponse.downloadPath}`);
    const readFile = promisify(fs.readFile);
    const data = await readFile(downloadResponse.downloadPath);
    return JSON.parse(data.toString());
}
