// import 'global-agent/bootstrap';
import {crawlerGithubForGPT} from "repo-crawler-for-gpt"


crawlerGithubForGPT({
  githubRepoUrl: 'https://github.com/FTAndy/gpt-comedian-digital-figure',
  branch: 'main',
  // or
  // tag: 'v1.0.0'
})