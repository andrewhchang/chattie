# Chattie

Chattie is a Node.js web app that monitors a "Google Hangouts Meet" meeting via Puppeteer to scrape the meeting data and trigger a Slack api belonging to a bot of your choice.

## Requirements
  - Node.js
  - NVM
  - Yarn

## Setup Instructions
  - Clone repo
  - Run `nvm use`
  - Run `yarn install`
  - Input environment variables following `.env-example`
  - `yarn run start` to begin listening