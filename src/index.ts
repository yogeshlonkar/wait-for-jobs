import { info } from "@actions/core";

import WaitForJobs from "./WaitForJobs";

new WaitForJobs().start().then(() => info(``));
