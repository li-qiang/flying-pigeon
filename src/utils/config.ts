import os = require('os');
import fs = require('fs');
import path = require('path');


export type Config = {
  redisHost: string,
  redisPort: number,
  stream: string,

  codeReview: {
    idBoard: string
    idOrganization: string,
  },

  trello: {
    key: string,
    token: string
  }
};


const homedir = os.homedir();

const configContent = fs.readFileSync(path.join(homedir, '.flying-pigeon.json')).toString();

export const config: Config = JSON.parse(configContent);

export const cacheFile = path.join(os.tmpdir(), 'fp');


