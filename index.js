const label = {
  XS: 'size/XS',
  S: 'size/S',
  M: 'size/M',
  L: 'size/L',
  XL: 'size/XL',
  XXL: 'size/XXL'
}

const sizes = {
  S: 10,
  M: 30,
  L: 100,
  Xl: 500,
  Xxl: 1000
}

function size (lineCount) {
  if (lineCount < sizes.S) {
    return label.XS
  } else if (lineCount < sizes.M) {
    return label.S
  } else if (lineCount < sizes.L) {
    return label.M
  } else if (lineCount < sizes.Xl) {
    return label.L
  } else if (lineCount < sizes.Xxl) {
    return label.XL
  }

  return label.XXL
}

module.exports = app => {
  app.on(['pull_request.opened', 'pull_request.reopened', 'pull_request.synchronized', 'pull_request.edited'], async context => {
    var pullRequest = context.payload.pull_request

    var ghLabel = size(pullRequest.additions + pullRequest.deletions)

    return context.github.issues.addLabels(context.issue({
      labels: [ghLabel]
    }))
  })
}
