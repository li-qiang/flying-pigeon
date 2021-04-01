import Redis = require('ioredis');
import path = require('path')
import os = require('os')
import fs = require('fs')

const homedir = os.homedir();

const configContent = fs.readFileSync(path.join(homedir, '.flying-pigeon.json')).toString();

const config: { redisHost: string, redisPort: number, stream: string } = JSON.parse(configContent);

const redis = new Redis({
  host: config.redisHost,
  port: config.redisPort || 6379,
  maxRetriesPerRequest: 3,
});


export function send(stream: string, ...properties: (string | number)[]) {
  return redis
    .xadd("github", "*", ...properties)
    .then(() => console.info("\x1B[32m%s\x1B[0m", "Send success"))
    .catch(e => console.error("Error: \x1B[31m%s\x1B[0m", "send error", e))
    .finally(() => redis.disconnect());
}


