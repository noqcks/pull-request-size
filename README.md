# Pull Request Size

Pull Request Size is a GitHub App that applies 'size/\*' labels to Pull Requests based on the total lines of code changed (additions and deletions).


<img width="767" alt="screen shot 2018-11-01 at 10 42 27 am" src="https://user-images.githubusercontent.com/4740147/47858607-d7e05f80-ddc2-11e8-97d9-247033cc9a12.png">

## Sizing

| Name | Description |
| ---- | ----------- |
| <a id="size/XS" href="#size/XS">`size/XS`</a> | Denotes a PR that changes 0-9 lines. |
| <a id="size/S" href="#size/S">`size/S`</a> | Denotes a PR that changes 10-29 lines. |
| <a id="size/M" href="#size/M">`size/M`</a> | Denotes a PR that changes 30-99 lines. |
| <a id="size/L" href="#size/L">`size/L`</a> | Denotes a PR that changes 100-499 lines. |
| <a id="size/XL" href="#size/XL">`size/XL`</a> | Denotes a PR that changes 500-999 lines. |
| <a id="size/XXL" href="#size/XXL">`size/XXL`</a> | Denotes a PR that changes 1000+ lines. |

## Setup

```sh
# Install dependencies
npm install

# Run the bot
npm start
```

## License

[MIT](LICENSE) © 2018 Benji Visser <benny@noqcks.io>
