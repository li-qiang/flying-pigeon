import {send} from './redis-stream-sender';
import process = require('process');

const [, , repo] = process.argv;

send('github', 'type', 'SYNC_REPO_COMMIT', 'repo', repo);
