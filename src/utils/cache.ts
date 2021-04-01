import flatCache = require('flat-cache');
import {cacheFile} from "./config";

const fileCache = flatCache.load(cacheFile);

type CacheValue<T> = {
  expiredAt: number;
  value: T;
};

const get = (key: string) => {
  const cacheValue: CacheValue<any> = fileCache.getKey(key);
  if (cacheValue === undefined || Date.now() > cacheValue.expiredAt) {
    return undefined;
  }
  return cacheValue.value;
}

const set = (key: string, value: any, ttl: number) => {
  const cacheValue: CacheValue<any> = {
    expiredAt: Date.now() + ttl,
    value,
  };
  fileCache.setKey(key, cacheValue);
  fileCache.save(true);
}

export const cache = {

  async getOrInit<T>(key: string, ttl: number, builder: () => Promise<T> | T) {
    const value = get(key);
    if (value === undefined) {
      const value = await builder();
      set(key, value, ttl);
      return value;
    }
    return value;
  },

  get,

  set
};