const NAME = 'large-diff';
const COLOR = 'cc1a70';
const tooLargeBoundary = 500;

/**
 * tell you if `lineCount` is large than boundary
 *
 * @param lineCount The number of lines in the Pull Request.
 */
const isMoreThanBoundary = (lineCount) => lineCount > tooLargeBoundary;

const ensureLabelExists = async (context) => {
	try {
		return await context.github.issues.getLabel(context.repo({
			name: NAME,
		}));
	} catch (e) {
		return context.github.issues.createLabel(context.repo({
			name: NAME,
			color: COLOR,
			description: `This PR is more than ${tooLargeBoundary} lines`,
		}));
	}
};

/**
 * add the label
 */
const add = async (context) => {
	const params = Object.assign({}, context.issue(), {labels: [NAME]});

	await ensureLabelExists(context);
	await context.github.issues.addLabels(params);
};

/**
 * remove the label
 */
const remove = async (context) => {
	await context.github.issues.removeLabel(context.issue({
		name: NAME,
	}));
};

module.exports = {
	NAME,
	COLOR,
	isMoreThanBoundary,
	add,
	remove,
};
