import crawlerWithImdbProfile from './crawler/crawlerWithImdbProfile';


// eslint-disable-next-line no-console

crawlerWithImdbProfile({
  imdbURL: 'https://www.imdb.com/name/nm0152638/',
  needCrawlSpecialInfo: 0,
  needGenerateAIContent: 0
});
