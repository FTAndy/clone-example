import 'dotenv/config'
import nodeFetch from 'node-fetch'

async function fetchWithRetry(url: string, options = {}, retryCount = 3) {
  for (let i = 0; i < retryCount; i++) {
    try {
      const response = await nodeFetch(url, options);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      return response; // or response.text() if that's expected
    } catch (error) {
      console.error(`Attempt ${i + 1} failed with error: ${(error as Error).message}`);
      if (i === retryCount - 1) throw error; // If last attempt, throw error
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait for 1 second before retrying
    }
  }
}

const limitedGenres = [
  'Blue', 
  'Improvisational', 
  'Political', 
  'Satirical', 
  'Deadpan', 
  'Cringe', 
  'Dark', 
  'Surreal', 
  'Anecdotal', 
  'One-liner', 
  'Slapstick', 
  'Situational', 
  'Absurdist', 
  'Clean', 
  'Shock', 
  'Nerd', 
  'Cultural', 
  'Storytelling', 
  'Impressionist', 
  'Sardonic', 
  'Parodic', 
  'Self-deprecating'
]

const TIMEOUT = 1 * 60 * 1000

const wikiPrompt = `
  You are a Wikipedia content creator specializing in the stand-up comedy field. Your job is to create content of Wikipedia style for stand-up comedians. Here are some restrictions for you.
  1. Your creative style must be interesting, storytelling, and easy to understand to attract people who want get to know about standup comedy. 
  2. The first part should be "the reason why you should love the comedian"
  3. The second part should be the reverse career time of the figure
  4. The third part should be all  the important accomplishments and rewards of that figure
  5. The fourth part contains what topic the comedian regularly talks about in their comedy
  6. The content should be created in bulletpoints.
  7. The content should be informative and factual.
  8. The whole wiki content should return in HTML and CSS format
  9. (IMPORTANT!) The output only contain HTML and CSS ONLY
  10. CSS style should apply Google Material style.
  11. The HTML only contains content that is in the body tag and excludes BODY tag, HEAD tag, and HTML tag.
  12. Use proper Wikipedia article markup for HTML. 
  13. Include relevant external links
  14. (IMPORTANT!) The output must not start with phrases like "Sure, let's...", "Here is", "Here's", and other paragraph header or footer at every start and end
  15. (IMPORTANT!) The output must start with HTML tag "div"
  16. (IMPORTANT!) The output must not start with <html> tag
  17. (IMPORTANT!) The CSS content should be wrap in style tag
  In the following conversation, I will input some standup comedian names for you.
`

async function createGPTClient() {
  const importDynamic = new Function('modulePath', 'return import(modulePath)')
  const { ChatGPTAPI } = await importDynamic('chatgpt')
  const api = new ChatGPTAPI({
    apiBaseUrl: 'https://api.openai-hk.com/v1',
    apiKey: process.env.OPENAI_API_KEY || '',
    completionParams: {
      model: 'gpt-4-1106-preview',
      temperature: 0.5,
    },
    // fetch: (url: string, options = {}) => {
    //   const defaultOptions = {
    //     agent,
    //   };

    //   const mergedOptions = {
    //     ...defaultOptions,
    //     ...options,
    //   };

    //   return fetchWithRetry(url, mergedOptions);
    // },
  })
  return api
}

function trimUselessWikiContent(content: string) {
  return content
  .replaceAll('```html', '')
  .replaceAll('```css', '')
  .replaceAll('```', '')
}

// warning: AI can not detect the latest
// export async function isAShowStarredbyComedian({
//   showName,
//   comedianName
// }: {
//   showName: string,
//   comedianName: string
// }) {
//   try {
//     const api = await createGPTClient()

//     const conversation = await api.sendMessage(`Is the show "${showName}"  staring by standup comedian ${comedianName}? Yes or No?`, {
//       timeoutMs: TIMEOUT,
//       // onProgress: (partialResponse: any) => console.log(partialResponse.text)
//     })
  
//     const answer = conversation.text
  
//     console.log(answer.includes('Yes'), showName, comedianName)
  
//     return answer.includes('Yes') ? true : false    
//   } catch (error) {
//     return true
//   }
// }

export class AIContentGenerator {

  public wikiContentCreater: any = null
  public apiClient:any = null

  constructor() {

  }

  get inited () {
    return Boolean(this.wikiContentCreater)
  }

  async init() {
    const api = await createGPTClient()
    this.apiClient = api

    // Retry
    let times = new Array(3)
    let conversation

    for (const _ of times) {
      conversation = await api.sendMessage(wikiPrompt, {
        timeoutMs: TIMEOUT,
        // onProgress: (partialResponse: any) => console.log(partialResponse.text)
      })
      if ((conversation.text as string).includes('apologize') 
      ||  (conversation.text as string).includes(`I'm sorry`)
      || (conversation.text as string).includes(`I'm unable`)
      || (conversation.text as string).includes('unable')
      || (conversation.text as string).includes('However,')
      || (conversation.text as string).includes('but')
      ) {
        console.log('apologize', conversation.text)      
      } else {
        console.log('Create figure successfully')
        break
      }
    }

    console.log('Successful! Openai: ', conversation.text)
    this.wikiContentCreater = conversation
  }

  async getWikiContent(comedianName: string) {
    const wikiContent = await this.apiClient.sendMessage(comedianName, {
      parentMessageId: this.wikiContentCreater.id,
      timeoutMs: TIMEOUT * 3,
      // onProgress: (partialResponse: any) => console.log(partialResponse.text)
    })
    return trimUselessWikiContent(wikiContent.text)
  }

  async getOtherContent(comedianName: string) {
    const brief = await this.apiClient.sendMessage(`
      Conclude for me on why ${comedianName} is a great comedian, keep it concise, do not conclude in bulletpoint
    `, {
      timeoutMs: TIMEOUT * 2,
    })
  
    console.log('Openai Successful brief!',)
  
    const tags = await this.apiClient.sendMessage(
      `Categorize genres of standup comedian ${comedianName} with tags into the format ['xx','yy',....'zz'] limited to 5. 
      The output should not has any conversational content just containing the require content.
      The tags should be limited in these genres ${limitedGenres}
      `
    , {
      timeoutMs: TIMEOUT * 2,
    })
  
    const tagsArray = new Function(`return ${tags.text}`)
  
    const realTagArray = tagsArray()

    return {
      brief: brief.text,
      tags: realTagArray
    }
  }

  async getAllContent(comedianName: string) {
    if (!this.inited) {
      await this.init()
    }

    const wikiContent = await this.getWikiContent(comedianName)
    const otherContent = await this.getOtherContent(comedianName)
    return {
      wikiDetail: wikiContent,
      ...otherContent
    }
  }
}

export const AIGenerator = new AIContentGenerator()