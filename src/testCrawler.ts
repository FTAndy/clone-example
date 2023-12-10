// import 'global-agent/bootstrap';
import {crawlerGithubForGPT} from "repo-crawler-for-gpt"


crawlerGithubForGPT({
  githubRepoUrl: 'https://github.com/mathiasbynens/dotfiles',
  branch: 'main',
  // or
  // tag: 'v1.0.0'
})