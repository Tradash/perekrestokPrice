import { Dispatcher, request } from 'undici';

import { TContent, TPickup, TShops, TShopsProducts } from './types';
import { save2file } from './utils/save2file';
import { toHHMMSS } from './utils/toHHMMSS';
import { delay } from './utils/utils';
import { CTokens } from './CTokens';

const url01 = 'https://www.perekrestok.ru/cat/c/2/vino?tags=onlyDiscount&orderBy=discount&orderDirection=desc';
const url04 = 'https://www.perekrestok.ru/api/customer/1.4.1.0/catalog/product/grouped-feed';
const url05 = 'https://www.perekrestok.ru/api/customer/1.4.1.0/user/current';

const getBody = async (d: Dispatcher.ResponseData) => {
  let body = '';

  for await (const data of d.body) {
    body = body + data;
  }
  return body;
};

const limit = 1000;
const minBadge = -25;

const shopCoordinates = [
  { x: 55.58106168954288, y: 37.14664089895633 },
  { x: 55.66922349733111, y: 37.42606776913932 },
  { x: 55.74894239518392, y: 37.57055810027393 },
  { x: 55.7584708535492, y: 37.6319312194027 },
  { x: 55.817742378890586, y: 37.50861838978842 },
  { x: 55.84406942810619, y: 37.40182193171661 },
  { x: 55.88766961091961, y: 37.67153335396737 },
  { x: 55.73644408346405, y: 37.853621832257375 },
  { x: 55.60086886376545, y: 37.71722198964735 },
  { x: 55.666872483490536, y: 37.70594178187169 },
].sort((x, y) => x.y - y.y);

export type TProducts = { [key: number]: TShopsProducts };

const prod: TProducts = {};
const prodGroup = [2, 3];

const startAppTime = new Date();

const countTokens = 10;

let skipped = 0;

const start = async () => {
  console.log("генерация токенов...")
  const cToken = new CTokens(url01, countTokens);
  await cToken.generateTokens()
    console.log("Созданы токены...")
  const res = await request(url01, { method: 'GET' });
  const mCookie = decodeURIComponent((res.headers['set-cookie'] as string[])[0]);
  const s = mCookie.indexOf('accessToken');
  const e = mCookie.indexOf('refreshToken');
  const token = mCookie.slice(s + 14, e - 3);

  const h = {
    Authorization: `Bearer ${token}`,
  };

  for (let i = 0; i < shopCoordinates.length; i++) {
    const ostTime = (k: number, n: number) => {
      const l = 100 > limit ? limit : 100;
      const total = shopCoordinates.length * l;
      const ost = total - k * l - n - 1;
      const t = new Date().getTime() - startAppTime.getTime();
      return toHHMMSS((t / (total - ost)) * ost);
    };
    const url02 = `https://www.perekrestok.ru/api/customer/1.4.1.0/shop?orderBy=distance&orderDirection=asc&lat=${shopCoordinates[i].x}&lng=${shopCoordinates[i].y}&page=1&perPage=100`;
    const resp = await request(url02, {
      method: 'GET',
      headers: h,
    });
    const body = JSON.parse(await getBody(resp)) as TShops;
    const shops = body.content.items;
    // console.log(shops.length);
    for (let j = 0; j < shops.length && j < limit; j++) {
      const shop = shops[j];
      if (!prod[shop.id]) {
        prod[shop.id] = {
          name: shop.title,
          address: shop.address,
          metro: shop.metroStations.map((x) => x.name).join(','),
          products: [],
        };
      } else {
        // console.log("пропускаю магазин", shop.id)
        skipped++;
        continue;
      }
      // Делаем магазин активным
      const startProd = new Date().getTime();
      const url03 = `https://www.perekrestok.ru/api/customer/1.4.1.0/delivery/mode/pickup/${shop.id}`;
      const dd = await request(url03, {
        method: 'PUT',
        headers: await cToken.getTokens(j),
      });

      if (dd.statusCode !== 200) {
        console.log('Ошибка при установке магазина', dd.statusCode, await getBody(dd));
        process.exit(1);
      }

      await delay(6000 / countTokens);
      let count = 0;
      let isReadyShop = false;
      while (!isReadyShop) {
        const responseData = await request(url05, {
          method: 'GET',
          headers: await cToken.getTokens(j),
        });
        const p = JSON.parse(await getBody(responseData)) as TPickup;
        if (shop.id === p.content.deliveryMode.shop.id) {
          isReadyShop = true;
        } else {
          await delay(1000);
          count++;
          if (count % 10 === 0) {
            console.log('Количество повторов проверки магазина', count, shop.id, p.content.deliveryMode);
          }
        }
      }
      if (count > 0) {
        console.log('Количество повторов проверки магазина', count);
      }

      // await delay(3000 + 7000 * Math.random());
      // Получаем товары по группам

      for (let pg = 0; pg < prodGroup.length; pg++) {
        const respData = await request(url04, {
          method: 'POST',
          body: JSON.stringify({
            page: 1,
            perPage: 48,
            orderBy: 'discount',
            orderDirection: 'desc',
            filter: { category: prodGroup[pg] },
          }),
          headers: { ...(await cToken.getTokens(j)), ...{ 'content-type': 'application/json;charset=UTF-8' } },
        });

        const p = JSON.parse(await getBody(respData)) as TContent;
        for (let i = 0; i < p.content.items.length; i++) {
          for (let j = 0; j < p.content.items[i].products.length; j++) {
            const badge = Math.round((p.content.items[i].products[j].priceTag.price / p.content.items[i].products[j].priceTag.grossPrice - 1) * 100);
            if (badge <= minBadge) {
              prod[shop.id].products.push({
                type: p.content.items[i].group.key,
                subType: p.content.items[i].group.title,
                name: p.content.items[i].products[j].title,
                oldPrice: p.content.items[i].products[j].priceTag.grossPrice,
                newPrice: p.content.items[i].products[j].priceTag.price,
                badge: badge,
                id: p.content.items[i].products[j].id,
              });
            }
          }
        }
      }
      console.log(
        'Обработан магазин',
        i * 100 + j,
        Object.keys(prod).length,
        skipped,
        shop.id,
        shop.address,
        'Товаров добавлено:',
        prod[shop.id].products.length,
        'Время обработки магазина: ',
        toHHMMSS(new Date().getTime() - startProd),
        'Осталось времени: ',
        ostTime(i, j)
      );
      // await delay(250);
    }
  }

  save2file('final', prod, startAppTime);
};
/*
  const ps = body;

  console.log(ps.content.items[0].id, ps.content.items[0]);
  const ss = await request(`https://www.perekrestok.ru/api/customer/1.4.1.0/delivery/mode/pickup/${ps.content.items[0].id}`, {
    method: 'PUT',
    headers: h,
  });

  const alco = await request('https://www.perekrestok.ru/api/customer/1.4.1.0/catalog/product/grouped-feed', {
    method: 'POST',
    body: JSON.stringify({ page: 1, perPage: 48, orderBy: 'discount', orderDirection: 'desc', filter: { category: 2 } }),
    headers: { ...h, ...{ 'content-type': 'application/json;charset=UTF-8' } },
  });

  const alcoData = await getBody(alco);

  console.log(alcoData);

  // Выбор магазина
};
*/
start()
  .then(() => {
    console.log('Финишед...', Object.keys(prod).length);
  })
  .catch((e) => {
    console.log('Error', e);
    save2file('error', prod, startAppTime);
  });
