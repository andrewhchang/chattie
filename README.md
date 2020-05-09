# Chattie

Chattie is a Node.js web app written in Typescript that monitors a "Google Hangouts Meet" meeting via a headless chrome instance to monitor meeting participants integrates with a Slack workspace to automatically notify a channel of choice when a user enters the meeting.

## Requirements
  - Node.js
  - NVM
  - Yarn
  - An existing Slack app/bot that has been installed in your Slack workspace.

## Setup Instructions
  - Clone repo
  - Run `nvm use`
  - Run `yarn install`
  - Input environment variables following `.env-example`
  - Modify pre-written slack message to your desired message.
  - `yarn run start` to begin listening to the meeting
