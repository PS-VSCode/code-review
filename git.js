'use strict';

/* exports:

setGitPath("path/to/git")
setGitRepoBase("basedir")
branchList()
diffState("reviewBranch", "targetBranch")
*/

const cp = require('child_process');
let gitPath = 'git';
let gitRepoBase = null;
const gitRun = cmdArgs => {
	return new Promise((resolve, reject) => {

		const subProc = cp.spawn(gitPath, cmdArgs, {
			cwd: gitRepoBase || process.cwd(),
			env: process.env
		});
		let data = [];
		let err = [];
		subProc.stdout.on('data', d => data.push(d));
		subProc.stderr.on('data', d => err.push(d));
		subProc.on('exit', () => {
			if (!data.length) {
				if (err.length) reject(Buffer.concat(err)
					.toString());
			} else resolve(Buffer.concat(data)
				.toString());
		});
	});
};

exports.setGitPath = newPath => gitPath = newPath;
exports.setGitRepoBase = newBase => gitRepoBase = newBase;

exports.currentBranch = () => {
	return gitRun(['branch'])
		.then(resultString => {
			const matcher = /\s*\*\s+(.+?)/y;
			let match = matcher.exec(resultString);
			if (!match) throw "No current branch found";
			return {
				name: match[1],
				sha: match[2],
				msg: match[3]
			};
		});
};

exports.diffState = (reviewBranch, targetBranch) => {
	return gitRun(['branch'])
		.then(resultString => {
			const matcher = /[\s\*]+(.+?)/y;
			let match = matcher.exec(resultString);
			let result = [];
			while (match) {
				result.push(match[1]);
				match = matcher.exec(resultString);
			}
			let outputbranch = '.vscodeReview';
			while (result.includes(outputbranch)) {
				outputbranch += 'x';
			}

			return gitRun(['checkout', targetBranch])
				.then(() => gitRun(['checkout', '-b', outputbranch]))
				.then(() => gitRun(['diff', '--name-status', targetBranch, reviewBranch]))
				.then(modifiedList => gitRun(['merge', reviewBranch])
					.then(() => ['a', 'b']));
		});
};

exports.branchList = () => {
	return gitRun(['branch', '-v', '--sort=-committerdate'])
		.then(resultString => {
			const matcher = /[\s\*]+(.+?)\s+([a-fA-F0-9]+)\s+(.*)/y;
			let match = matcher.exec(resultString);
			let result = [];
			while (match) {
				result.push({
					name: match[1],
					sha: match[2],
					msg: match[3]
				});
				match = matcher.exec(resultString);
			}
			return result;
		});
};