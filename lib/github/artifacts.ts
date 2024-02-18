import artifactClient, { GetArtifactResponse, DownloadArtifactResponse } from "@actions/artifact";
import { debug } from "@actions/core";
import fs from "fs";
import { promisify } from "util";
import { resolve } from "path";

import { Context } from "./context";

/**
 * Get output from JSON artifact file
 *
 * @param artifactName JSON file containing outputs
 * @returns output
 */
export async function getOutput(artifactName: string): Promise<Record<string, unknown>> {
    const { tempDir } = new Context();
    debug(`Downloading download ${artifactName}`);
    const { artifact }: GetArtifactResponse = await artifactClient.getArtifact(artifactName);
    const { downloadPath }: DownloadArtifactResponse = await artifactClient.downloadArtifact(artifact.id);
    if (!downloadPath) {
        throw new Error(`Failed to download artifact ${artifactName}`);
    }
    debug(`Artifact ${artifactName} was downloaded to ${downloadPath}`);
    const readFile = promisify(fs.readFile);
    const data = await readFile(resolve(downloadPath, artifactName));
    return JSON.parse(data.toString());
}
