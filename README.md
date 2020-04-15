# Pull Request Size

[![Build Status](https://travis-ci.org/noqcks/pull-request-size.svg?branch=master)](https://travis-ci.org/noqcks/pull-request-size) | [![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Pull Request Size is a GitHub App that applies `size/*` labels to Pull Requests based on the total lines of code changed (additions and deletions).

<img width="767" alt="screen shot 2018-11-01 at 10 42 27 am" src="https://user-images.githubusercontent.com/4740147/47858607-d7e05f80-ddc2-11e8-97d9-247033cc9a12.png">

Configure Pull Request Size for your organization on the [GitHub app page](https://github.com/apps/pull-request-size).

## Sizing

| Name | Description |
| ---- | ----------- |
| <a id="size/XS" href="#size/XS">`size/XS`</a> | Denotes a PR that changes 0-9 lines. |
| <a id="size/S" href="#size/S">`size/S`</a> | Denotes a PR that changes 10-29 lines. |
| <a id="size/M" href="#size/M">`size/M`</a> | Denotes a PR that changes 30-99 lines. |
| <a id="size/L" href="#size/L">`size/L`</a> | Denotes a PR that changes 100-499 lines. |
| <a id="size/XL" href="#size/XL">`size/XL`</a> | Denotes a PR that changes 500-999 lines. |
| <a id="size/XXL" href="#size/XXL">`size/XXL`</a> | Denotes a PR that changes 1000+ lines. |

Pull Request Size calculates the size of a PR as

```
total additions + total deletions - (all generated¹ file additions/deletions)
```

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

## License

[MIT](LICENSE) © 2018 Benji Visser <benny@noqcks.io>

## TODO

