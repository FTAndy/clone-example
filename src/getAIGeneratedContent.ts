import 'dotenv/config'
import nodeFetch from 'node-fetch'
import { HttpsProxyAgent } from 'https-proxy-agent';

const agent = new HttpsProxyAgent('http://127.0.0.1:7890');

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
  9. Do not use phrases like "Sure, let's..." at every start of your output
  10. CSS style should apply Google Material style.
  11. The HTML only contains HTML content that in the body tag and does not include body tag.
  12. Use proper Wikipedia article markup for HTML. 
  13. Include relevant external links
  In the following conversation, I will input some standup comedian names for you.
`

export default async function getAIGeneratedContent(comedianName: string) {
  const importDynamic = new Function('modulePath', 'return import(modulePath)')
  const { ChatGPTAPI } = await importDynamic('chatgpt')
  // const nodeFetch = await importDynamic('node-fetch')
  const api = new ChatGPTAPI({
    apiKey: process.env.OPENAI_API_KEY || '',
    fetch: (url: string, options = {}) => {
      const defaultOptions = {
        agent,
      };

      const mergedOptions = {
        ...defaultOptions,
        ...options,
      };

      return nodeFetch(url, mergedOptions);
    },
  })

  // Retry
  let times = new Array(3)
  let conversation

  for (const _ of times) {
    conversation = await api.sendMessage(wikiPrompt)
    if ((conversation.text as string).includes('apologize') 
    ||  (conversation.text as string).includes(`I'm sorry`)
    || (conversation.text as string).includes(`I'm unable`)
    ) {
      console.log('apologize', conversation.text)      
    } else {
      break
    }
  }
  
  console.log('openai: ', conversation.text)

  const wikiContent = await api.sendMessage(comedianName, {
    parentMessageId: conversation.id
  })

  const brief = await api.sendMessage(`Conclude for me on why ${comedianName} is a great comedian, keep it concise`)

  const tags = await api.sendMessage(`Categorize styles of standup comedian ${comedianName} with concise tags into the format ['xx','yy',....'zz']. The output should not has any conversational content just containing the require content`)

  return {
    wikiDetail: wikiContent.text,
    brief: brief.text,
    tags: tags.text
  }
}