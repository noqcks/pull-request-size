const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
const generated = require('@noqcks/generated');
const minimatch = require("minimatch")

const label = {
  XS: 'size/XS',
  S: 'size/S',
  M: 'size/M',
  L: 'size/L',
  XL: 'size/XL',
  XXL: 'size/XXL'
}

const colors = {
  'size/XS': '3CBF00',
  'size/S': '5D9801',
  'size/M': '7F7203',
  'size/L': 'A14C05',
  'size/XL': 'C32607',
  'size/XXL': 'E50009'
}

const sizes = {
  S: 10,
  M: 30,
  L: 100,
  Xl: 500,
  Xxl: 1000
}


/**
 * sizeLabel will return a string label that can be assigned to a
 * GitHub Pull Request. The label is determined by the lines of code
 * in the Pull Request.
 * @param lineCount The number of lines in the Pull Request.
 */
function sizeLabel (lineCount) {
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


/**
 * getCustomGeneratedFiles will grab a list of file globs that determine
 * generated files from the repos .gitattributes.
 * @param context The context of the PullRequest.
 * @param owner The owner of the repository.
 * @param repo The repository where the .gitattributes file is located.
 */
async function getCustomGeneratedFiles (context, owner, repo) {
  let files = []
  const path = ".gitattributes"

  let response;
  try {
    response = await context.github.repos.getContents({owner, repo, path})
  } catch (e) {
    return files
  }

  const buff = new Buffer(response.data.content, 'base64')
  const lines = buff.toString('ascii').split("\n")

  lines.forEach(function(item) {
    if (item.includes("linguist-generated=true")) {
      files.push(item.split(" ")[0])
    }
  })
  return files
}


/**
 * globMatch compares file name with file blobs to
 * see if a file is matched by a file glob expression.
 * @param file The file to compare.
 * @param globs A list of file globs to match the file.
 */
function globMatch (file, globs) {
  for (i=0; i < globs.length; i++) {
    if (minimatch(file, globs[i])) {
      return true
      break;
    }
  }
  return false
}

async function addLabel (context, name, color) {
  const params = Object.assign({}, context.issue(), {labels: [name]})

  await ensureLabelExists(context, name, color)
  await context.github.issues.addLabels(params)
}

async function ensureLabelExists (context, name, color) {
  try {
    return await context.github.issues.getLabel(context.repo({
      name: name
    }))
  } catch (e) {
    return context.github.issues.createLabel(context.repo({
      name: name,
      color: color
    }))
  }
}



/**
 * This is the main event loop that runs when a revelent Pull Request
 * action is triggered.
 */
module.exports = app => {
  app.on([
    'pull_request.opened',
    'pull_request.reopened',
    'pull_request.synchronize',
    'pull_request.edited'], async context => {

    const pullRequest = context.payload.pull_request;
    const {owner: {login: owner}, name: repo} = pullRequest.base.repo;
    const {number} = pullRequest;
    let {additions, deletions} = pullRequest;

    // get list of custom generated files as defined in .gitattributes
    const customGeneratedFiles = await getCustomGeneratedFiles(context, owner, repo)

    // list of files modified in the pull request
    const res = await context.github.pullRequests.listFiles({owner, repo, number})

    // if files are generated, remove them from the additions/deletions total
    res.data.forEach(function(item) {
      var g = new generated(item.filename, item.patch)
      if (globMatch(item.filename, customGeneratedFiles) || g.isGenerated()) {
        additions -= item.additions
        deletions -= item.deletions
      }
    })

    // calculate GitHub label
    var labelToAdd = sizeLabel(additions + deletions)

    // remove existing size/<size> label if it exists and is not labelToAdd
    pullRequest.labels.forEach(function(prLabel) {
      if(Object.values(label).includes(prLabel.name)) {
        if (prLabel.name != labelToAdd) {
          context.github.issues.removeLabel(context.issue({
            name: prLabel.name
          }))
        }
      }
    })

    // assign GitHub label
    return await addLabel(context, labelToAdd, colors[labelToAdd])
  })

  // we don't care about marketplace events
  app.on('marketplace_purchase', async context => {
    return
  })
}
