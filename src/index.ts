import Redis = require('ioredis');
import process = require('process')
import path = require('path')
import os = require('os')
import fs = require('fs')

const [, , ...args] = process.argv;

const homedir = os.homedir();

const content = args.join(" ");

const configContent = fs.readFileSync(path.join(homedir, '.flying-pigeon.json')).toString();

const config: { redisHost: string, redisPort: number, stream: string } = JSON.parse(configContent);

const redis = new Redis({
  host: config.redisHost,
  port: config.redisPort || 6379,
  maxRetriesPerRequest: 3,
});

console.log("Content: \x1B[33m%s\x1B[0m", content);

const encodedContent = Buffer.from(content).toString('base64');

redis
  .xadd(config.stream, "*", "type", "feedback", "content", encodedContent)
  .then(() => console.info("\x1B[32m%s\x1B[0m", "Upload success"))
  .catch(e => console.error("Error: \x1B[31m%s\x1B[0m", config, e))
  .finally(() => redis.disconnect());
