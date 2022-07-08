const Sentry = require('@sentry/node');
Sentry.init({ dsn: process.env.SENTRY_DSN });
const generated = require('@noqcks/generated');
const minimatch = require("minimatch")

const labels = {
  XS: {
    name: 'size/XS',
    lines: 0,
    color: '3CBF00',
  },
  S: {
    name: 'size/S',
    lines: 10,
    color: '5D9801',
  },
  M: {
    name: 'size/M',
    lines: 30,
    color: '7F7203',
  },
  L: {
    name: 'size/L',
    lines: 100,
    color: 'A14C05',
  },
  XL: {
    name: 'size/XL',
    lines: 500,
    color: 'C32607',
  },
  XXL: {
    name: 'size/XXL',
    lines: 1000,
    color: 'E50009',
  }
}

/**
 * sizeLabel will return a string label that can be assigned to a
 * GitHub Pull Request. The label is determined by the lines of code
 * in the Pull Request.
 * @param lineCount The number of lines in the Pull Request.
 * @param l The label object
 */
function sizeLabel (lineCount, l) {
  if (lineCount < l.S.lines) {
    return [l.XS.color, l.XS.name]
  } else if (lineCount < l.M.lines) {
    return [l.S.color, l.S.name]
  } else if (lineCount < l.L.lines) {
    return [l.M.color, l.M.name]
  } else if (lineCount < l.XL.lines) {
    return [l.L.color, l.L.name]
  } else if (lineCount < l.XXL.lines) {
    return [l.XL.color, l.XL.name]
  }
  return [l.XXL.color, l.XXL.name]
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
    response = await context.octokit.repos.getContent({owner, repo, path})
  } catch (e) {
    return files
  }

  const buff = Buffer.from(response.data.content, 'base64')
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
  await context.octokit.issues.addLabels(params)
}

async function ensureLabelExists (context, name, color) {
  try {
    return await context.octokit.issues.getLabel(context.repo({
      name: name
    }))
  } catch (e) {
    return context.octokit.issues.createLabel(context.repo({
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
    const number = pullRequest.number;
    const {owner: {login: owner}, name: repo} = pullRequest.base.repo;
    let {additions, deletions} = pullRequest;

    // get list of custom generated files as defined in .gitattributes
    const customGeneratedFiles = await getCustomGeneratedFiles(context, owner, repo)
    const customLabels = await context.config('labels.yml', labels)

    // list of files modified in the pull request
    const res = await context.octokit.pulls.listFiles({
      owner: owner,
      repo: repo,
      pull_number: number,
    })

    // if files are generated, remove them from the additions/deletions total
    res.data.forEach(function(item) {
      let g = new generated(item.filename, item.patch)
      if (globMatch(item.filename, customGeneratedFiles) || g.isGenerated()) {
        additions -= item.additions
        deletions -= item.deletions
      }
    })

    // calculate GitHub label
    let [labelColor, label] = sizeLabel(additions + deletions, customLabels)

    // remove existing size/<size> label if it exists and is not labelToAdd
    pullRequest.labels.forEach(function(prLabel) {
      label_names = Object.keys(customLabels).map(key => customLabels[key]["name"])
      if(label_names.includes(prLabel.name)) {
        if (prLabel.name != label) {
          context.octokit.issues.removeLabel(context.issue({
            name: prLabel.name
          }))
        }
      }
    })

    // assign GitHub label
    return await addLabel(context, label, labelColor)
  })

  // we don't care about marketplace events
  app.on('marketplace_purchase', async context => {
    return
  })
}
