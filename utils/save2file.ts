import { toHHMMSS } from './toHHMMSS';
import { TProducts } from '../index';
import * as fs from 'fs';

const delimiter = '\t';
const endOfString = '\n';

export const save2file = (prefix: string, prod: TProducts, startAppTime: Date) => {
  let fileData =
    'id' +
    delimiter +
    'shopName' +
    delimiter +
    'shopAddress' +
    delimiter +
    'metro' +
    delimiter +
    'type' +
    delimiter +
    'subType' +
    delimiter +
    'idWine' +
    delimiter +
    'wine' +
    delimiter +
    'badge' +
    delimiter +
    'newPrice' +
    delimiter +
    'oldPrice' +
    endOfString;

  const shops = prod;
  const keys = Object.keys(shops) as unknown as number[];
  for (let i = 0; i < keys.length; i++) {
    if (shops[keys[i]].products.length !== 0) {
      const start = `${keys[i]}${delimiter}${shops[keys[i]].name}${delimiter}${shops[keys[i]].address}${delimiter}${shops[keys[i]].metro}${delimiter}`;
      // if (shops[keys[i]].products.length === 0) fileData = fileData + start + delimiter + delimiter + delimiter + delimiter + delimiter + endOfString;
      for (let j = 0; j < shops[keys[i]].products.length; j++) {
        fileData =
          fileData +
          start +
          `${shops[keys[i]].products[j].type.replace('&amp;', ' ')}${delimiter}${shops[keys[i]].products[j].subType.replace('&amp;', ' ')}${delimiter}${shops[keys[i]].products[j].id
          }${delimiter}${shops[keys[i]].products[j].name.replace('&amp;', ' ')}${delimiter}${shops[keys[i]].products[j].badge}${delimiter}${shops[keys[i]].products[j].newPrice
            .toString()
            .replace('.', ',')}${delimiter}${shops[keys[i]].products[j].oldPrice.toString().replace('.', ',')}${endOfString}`;
      }
    }
  }

  const fileName = `${prefix}_wineData${new Date().getTime()}.csv`;
  fs.writeFile(fileName, fileData.replace('&nbsp;', ''), function (err) {
    if (err) return console.log(err);
    console.log(`Смотри результат > ${fileName}`, `Общее время работы: ${toHHMMSS(new Date().getTime() - startAppTime.getTime())}`);
  });
};
