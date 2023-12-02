import {crawlerGithubForGPT} from "repo-crawler-for-gpt"


crawlerGithubForGPT({
  githubRepoUrl: 'https://github.com/BuilderIO/gpt-crawler',
  branch: 'main',
  // or
  tag: 'v1.0.0'
})