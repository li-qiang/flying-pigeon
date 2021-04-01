"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var Redis = require("ioredis");
var process = require("process");
var path = require("path");
var os = require("os");
var fs = require("fs");
var _a = process.argv, args = _a.slice(2);
var homedir = os.homedir();
var content = args.join(" ");
var configContent = fs.readFileSync(path.join(homedir, '.flying-pigeon.json')).toString();
var config = JSON.parse(configContent);
var redis = new Redis({
    host: config.redisHost,
    port: config.redisPort || 6379,
    maxRetriesPerRequest: 3,
});
console.log("Content: \x1B[33m%s\x1B[0m", content);
var encodedContent = Buffer.from(content).toString('base64');
redis
    .xadd(config.stream, "*", "type", "feedback", "content", encodedContent)
    .then(function () { return console.info("\x1B[32m%s\x1B[0m", "Upload success"); })
    .catch(function (e) { return console.error("Error: \x1B[31m%s\x1B[0m", config, e); })
    .finally(function () { return redis.disconnect(); });
