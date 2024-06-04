import { info } from "@actions/core";

import WaitForJobs from "./WaitForJobs.js";

new WaitForJobs().start().then(() => info(``));
