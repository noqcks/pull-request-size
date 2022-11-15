# Pull Request Size <img src="static/logo.png" alt="drawing" width="30"/>

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT) [![Sentry](https://img.shields.io/badge/sentry-enabled-green)](https://sentry.io) [![Build Status](https://github.com/noqcks/pull-request-size/workflows/Test/badge.svg)](https://github.com/noqcks/pull-request-size/actions) [![codecov](https://codecov.io/gh/noqcks/pull-request-size/branch/master/graph/badge.svg?token=qw3AMD6G8H)](https://codecov.io/gh/noqcks/pull-request-size) [![Dependabot](https://badgen.net/badge/Dependabot/enabled/green?icon=dependabot)](https://dependabot.com/)

Pull Request Size is a GitHub App that applies `size/*` labels to Pull Requests based on the total lines of code changed (additions and deletions).

<img width="767" alt="screen shot 2018-11-01 at 10 42 27 am" src="https://user-images.githubusercontent.com/4740147/47858607-d7e05f80-ddc2-11e8-97d9-247033cc9a12.png">


## Install

👉 **Install via [GitHub marketplace](https://github.com/apps/pull-request-size)** 🌟

_This app is free to use for personal and public organization repos. There is a paid plan for
use with private organization repos._
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

¹ A generated file is either one of the standard generated files as defined in [noqcks/generated](https://github.com/noqcks/generated/blob/master/lib/generated.js) or defined with `linguist-generated=true` in a `.gitattributes` file.


## Configuration

This app requires no configuration out of the box. However, you can exclude certain files
from being counted towards a PR's size, and you can add custom labels in Github.
### Excluding Files

If you have files that you would not like to be included in the calculation for a Pull Request's size, you can modify the `.gitattributes` file with the flag `linguist-generated=true` on your file or file pattern.

For example to mark all `.meta` files as generated, add this line to `.gitattributes`

```
*.meta linguist-generated=true
```

A `.gitattributes` file uses the same rules for matching as `.gitignore` files. See [GitHub documenation](https://docs.github.com/en/github/administering-a-repository/managing-repository-settings/customizing-how-changed-files-appear-on-github) on the linguist-generated flag for more info.


### Custom Labels

You can set custom label names and colors by checking in the file `.github/labels.yml` to every repository you'd like to customize

```
XS:
  name: size/XS
  lines: 0
  color: 3CBF00
S:
  name: size/S
  lines: 10
  color: 5D9801
M:
  name: size/M
  lines: 30
  color: 7F7203
L:
  name: size/L
  lines: 100
  color: A14C05
XL:
  name: size/XL
  lines: 500
  color: C32607
XXL:
  name: size/XXL
  lines: 1000
  color: E50009
```

## Feedback, suggestions and bug reports

Please create an issue here: https://github.com/noqcks/pull-request-size/issues

## License

[MIT](LICENSE) © 2022 Benji Visser <benji@093b.org>

