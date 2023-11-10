import 'dotenv/config'
import { initBrowser, browser } from '../utils/initBrowser';
import {dbClient, initDB} from '../utils/mongo'
import { CarwlerTask } from '../types'
import crawlerWithImdbProfile from './crawlerWithImdbProfile'
import {maxLimitedAsync} from '../utils/maxLimitedAsync'
import { TaskStatus } from '../types/index'

// TODO: specific list to crawl
const FILTER_NAME = [
  `Patrice O'Neal`,
  `Lenny Bruce`,
  `Dick Gregory`,
  `Barry Crimmins`,
  `Steven Wright`,
  `Garry Shandling`,
  `Dennis Miller`,
  `Paul Mooney`,
  `Zach Galifianakis`,
  `Tommy Johnagin`,
  `Paul F. Tompkins`,
  `Jon Dore`,
  `Nick Swardson`,
  `Brian Posehn`,
  `Eddie Pepitone`,
  `Nick Thune`,
  `Dov Davidoff`,
  `Doug Benson`,
  `Ron Funches`,
  `Russell Brand`
]

type comedianInfo = {
  name: string
  profileLink: string
  imdbID: string
}

export default async function start(list: Array<string>): Promise<void>;
export default async function start(list: string): Promise<void>;
export default async function start(list: string | Array<string>){
  await initBrowser();

  let comedianList: Array<comedianInfo> = []

  if (Array.isArray(list)) {
    function createTask(comedianName: string) {
      return async (): Promise<comedianInfo> => {
        const ImdbPage = await browser.newPage();
        await ImdbPage.goto('https://www.imdb.com/', {
          timeout: 120 * 1000
        });

        await ImdbPage.waitForSelector('#suggestion-search')
        
        await ImdbPage.type('#suggestion-search', comedianName)

        await ImdbPage.evaluate(() => {
          const button = document.querySelector('#suggestion-search-button');
          button && (button as HTMLAnchorElement).click();
        });

        // await ImdbPage.click('#suggestion-search-button')

        await ImdbPage.waitForSelector('[data-testid="find-results-section-name"]')

        await ImdbPage.evaluate(() => {
          const button = document.querySelector('[data-testid="find-results-section-name"] .ipc-metadata-list-summary-item__t');
          button && (button as HTMLAnchorElement).click();
        });

        // await ImdbPage.click('.ipc-metadata-list-summary-item__t')

        await ImdbPage.waitForSelector('.ipc-page-content-container')

        const comedianInfo = await ImdbPage.evaluate(() => {
          return {
            profileLink: location.href,
            imdbID: (/https:\/\/www.imdb.com\/name\/(?:(.+))\?.+/.exec(location.href)?.[1] as string)
          }
        })
        await ImdbPage.close()
        return {
          name: comedianName,
          ...comedianInfo
        }
      }
    }

    comedianList = await maxLimitedAsync<comedianInfo>({
      max: 5,
      tasks: list.map(comedianName => createTask(comedianName))
    })

  } else if (typeof list === 'string') {
    const ListPage = await browser.newPage();

    await ListPage.goto(list);

    await ListPage.waitForSelector('.lister-list');

    comedianList = await ListPage.evaluate(() => {
      const element =  document.querySelectorAll('.lister-item-header a')
      if (element) {
        const aElements = Array.from(element)
        let result = aElements.map((a: any) => {
          return {
            name: a.innerText,
            profileLink: a.href,
            imdbID: (/https:\/\/www.imdb.com\/name\/(?:(.+))\?.+/.exec(a.href)?.[1] as string)
          }
        })
        return result || []
      } else {
        return []
      }
    })

    comedianList = comedianList
    .filter(s => {
      return !FILTER_NAME.includes(s.name)
    })
  }

  console.log(comedianList, 'comedianList')

  const Database = dbClient.db("standup-wiki");
  const CrawlerTask = Database.collection("crawlerTask");

  await initDB()

  for (const comedian of comedianList) {
    const existComedian = await CrawlerTask.findOne<CarwlerTask>({
      imdbID: comedian.imdbID
    })
    if (existComedian && existComedian.status === 1) {
      console.log(existComedian.name, ' skip!!!')
      continue
    }

    let needGenerateAIContent = TaskStatus.notStarted
    let needCrawlSpecialInfo = TaskStatus.notStarted

    if (existComedian) {
      needGenerateAIContent = existComedian.AIContentStatus
      needCrawlSpecialInfo = existComedian.specialStatus
    }

    console.log('start comedian', comedian.name, comedian.imdbID, comedian.profileLink)

    console.log('existComedian', existComedian)

    let now = Date.now()

    const success = await crawlerWithImdbProfile({
      imdbURL: comedian.profileLink,
      needGenerateAIContent,
      needCrawlSpecialInfo,
      eventSource: 'list'
    })

    console.log((Date.now() - now) / 60 / 1000, ' minutes')

    let whereOption = {
      name: comedian.name,
    }
    if (success) {
      console.log('success')
      // update
      await CrawlerTask.updateOne(whereOption,
      {
        $set: {
          name: comedian.name,
          specialStatus: 1,
          type: 'comedian',
          AIContentStatus: 1,
          imdbID: comedian.imdbID,
          status: 1
        }
      },
      { upsert: true }
      )
    } else {
      console.log('fail')
      await CrawlerTask.updateOne(whereOption,
      {
        $set: {
          name: comedian.name,
          specialStatus: 0,
          AIContentStatus: 0,
          type: 'comedian',
          imdbID: comedian.imdbID,
          status: 99 // fail
        }
      },
      { upsert: true }
      )
      // record message
    }
  }
  await dbClient.close()
  console.log('list done')
}
