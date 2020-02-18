const generated = require('@noqcks/generated');
const minimatch = require('minimatch');

const {
	NAME: LABEL_NAME,
	COLOR: LABEL_COLOR,
	isMoreThanBoundary,
	remove: removeLabel,
	add: addLabel,
} = require('./labels');

/**
 * getCustomGeneratedFiles will grab a list of file globs that determine
 * generated files from the repos .gitattributes.
 *
 * @param context The context of the PullRequest.
 * @param owner The owner of the repository.
 * @param repo The repository where the .gitattributes file is located.
 */
const getCustomGeneratedFiles = async (context, owner, repo) => {
	const path = '.gitattributes';

	let response;
	try {
		response = await context.github.repos.getContents({owner, repo, path});
	} catch (e) {
		return [];
	}

	const buff = new Buffer(response.data.content, 'base64');
	const lines = buff.toString('ascii').split('\n');

	return lines.reduce((accumulator, value) => {
		if (item.includes('linguist-generated=true') === false) {
			return accumulator;
		}

		return [
			...accumulator,
			value,
		];
	}, []);
};

/**
 * globMatch compares file name with file blobs to
 * see if a file is matched by a file glob expression.
 *
 * @param file The file to compare.
 * @param globs A list of file globs to match the file.
 */
const globMatch = (file, globs) => {
	for (let i = 0; i < globs.length; i++) {
		if (minimatch(file, globs[i])) {
			return true;
		}
	}

	return false;
};

/**
 * This is the main event loop that runs when a revelent Pull Request
 * action is triggered.
 */
module.exports = app => {
	app.on([
		'pull_request.opened',
		'pull_request.reopened',
		'pull_request.synchronized',
		'pull_request.edited',
	], async context => {
		const pullRequest = context.payload.pull_request;
		const { owner: { login: owner }, name: repo } = pullRequest.base.repo;
		const { number } = pullRequest;
		let { additions, deletions } = pullRequest;

		// get list of custom generated files as defined in .gitattributes
		const customGeneratedFiles = await getCustomGeneratedFiles(context, owner, repo);

		// list of files modified in the pull request
		const res = await context.github.pullRequests.listFiles({ owner, repo, number });

		// if files are generated, remove them from the additions/deletions total
		res.data.forEach((item) => {
			const g = new generated(item.filename, item.patch);

			if (globMatch(item.filename, customGeneratedFiles) || g.isGenerated()) {
				additions -= item.additions;
				deletions -= item.deletions;
			}
		})

		// check the size
		const shouldAddLabel = isMoreThanBoundary(additions + deletions);

		if (shouldAddLabel === false) {
			if (pullRequest.labels.includes(LABEL_NAME) === true) {
				removeLabel(context);
			}

			return;
		}

		/**
		 * should add the label and it already has
		 */
		if (pullRequest.labels.includes(LABEL_NAME) === true) {
			return;
		}

		await addLabel(context);

		return;
	})

	// we don't care about marketplace events
	app.on('marketplace_purchase', () => {});
};
