import { defineCloudflareConfig } from "@opennextjs/cloudflare";

// Foundation config: no incremental cache override wired yet.
// A later agent can add R2-backed incremental caching, see
// https://opennext.js.org/cloudflare/caching
export default defineCloudflareConfig();
