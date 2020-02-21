# Too large pull request

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

_This repo is forked from [noqcks/pull-request-size](https://github.com/noqcks/pull-request-size)._

This is a GitHub App that applies "large diff" labels to Pull Requests those change more than 500 lines.

¹ A generated file is either one of the standard generated files as defined in [noqcks/generated](https://github.com/noqcks/generated/blob/master/lib/generated.js) or defined with `linguist-generated=true` in a `.gitattributes` file. See [Customizing how changed files appear on GitHub](https://help.github.com/articles/customizing-how-changed-files-appear-on-github/) for more information.

## Setup

This GitHub app runs on probot. It makes it very easy to create new GitHub apps.
If you want to run or develop pull-request-size just follow the commands
below. hit localhost:3000, and follow the probot instructions.

```sh
# Install dependencies
npm install

# Run the bot
npm start
```
