import { request } from 'undici';
import {delay} from "./utils/utils";

export class CTokens {
  count: number;
  tokens: string[];
  url: string;
  constructor(url: string, count: number) {
    this.url = url;
    this.count = count;
    this.tokens = [];
  }

  async generateTokens() {
    for (let i = 0; i < this.count; i++) {
      const res = await request(this.url, { method: 'GET' });
      const mCookie = decodeURIComponent((res.headers['set-cookie'] as string[])[0]);
      const s = mCookie.indexOf('accessToken');
      const e = mCookie.indexOf('refreshToken');
      this.tokens.push(mCookie.slice(s + 14, e - 3));
      if (i<this.count-1) {
          await delay(1000)
      }
    }
  }

  async getTokens(i: number) {
    return {
      Authorization: `Bearer ${this.tokens[i % this.count]}`,
    };
  }
}
