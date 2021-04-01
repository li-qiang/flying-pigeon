import {send} from './redis-stream-sender';

send("github", "type", "SYNC_REPO_LIST");
