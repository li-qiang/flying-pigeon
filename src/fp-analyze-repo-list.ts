import {send} from './redis-stream-sender';

send("github", "type", "ANALYZE_ALL_REPO_COMMIT");
