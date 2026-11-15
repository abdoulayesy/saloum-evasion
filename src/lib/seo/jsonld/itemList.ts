import type { ItemList } from 'schema-dts';

// ItemList des pages de liste, des univers et du hub des expériences.
export const buildItemList = (pageUrl: string, itemUrls: readonly string[]): ItemList => ({
  '@type': 'ItemList',
  '@id': `${pageUrl}#list`,
  numberOfItems: itemUrls.length,
  itemListElement: itemUrls.map((url, index) => ({
    '@type': 'ListItem',
    position: index + 1,
    url,
  })),
});
