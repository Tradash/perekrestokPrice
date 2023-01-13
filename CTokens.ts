import { request } from 'undici';
import { delay } from './utils/utils';

export class CTokens {
  count: number;
  tokens: string[];
  token: string;
  url: string;
  constructor(url: string, count: number) {
    this.url = url;
    this.count = count;
    this.tokens = [];
    this.token = '';
  }

  async generateTokens() {
    for (let i = 0; i < this.count + 1; i++) {
      let ok = false;
      let counter = 10;
      while (!ok && counter !== 0) {
        counter--;
        try {
          const res = await request(this.url, { method: 'GET' });
          // console.log(res.statusCode, res.headers['set-cookie'])
          if (!res.headers['set-cookie']) {
            continue;
          }
          const mCookie = decodeURIComponent((res.headers['set-cookie'] as string[])[0]);
          const s = mCookie.indexOf('accessToken');
          const e = mCookie.indexOf('refreshToken');
          if (i < this.count) {
            this.tokens.push(mCookie.slice(s + 14, e - 3));
          } else {
            this.token = mCookie.slice(s + 14, e - 3);
          }

          console.log('Создан токен....+', i + 1, 'количество попыток:', 10 - counter);
          ok = true;
        } catch (e) {
          console.log('Ошибка при получении токена', e, 'Ждем 5 сек перед следующей попыткой');
          await delay(5000);
        }
      }

      if (counter === 0) {
        console.error('Не удалось получить токен доступа. Работа остановлена ');
        process.exit(1);
      }

      if (i < this.count - 1) {
        await delay(1000);
      }
    }
  }

  async getTokens(i: number) {
    return {
      Authorization: `Bearer ${this.tokens[i % this.count]}`,
    };
  }

  getSystemTokens() {
    return this.token;
  }
}
