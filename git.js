'use strict';

const cp = require('child_process');
let gitPath = 'git';
let gitRepoBase = '';
const gitRun = cmdArgs => {
	return new Promise((resolve, reject) => {
		const subProc = cp.spawn(gitPath, cmdArgs, {

		})
	})
}

exports.setGitPath = newPath => gitPath = newPath;
exports.setGitRepoBase = newBase => gitRepoBase = newBase;

exports.branchList = () => {
	return Promise.resolve([{
		name: "some_branch",
		msg: "a very interesting commit",
		sha: "a1b2c3d"
	}]);
};