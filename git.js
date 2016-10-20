'use strict';

/* exports:

setGitPath
setGitRepoBase
branchList
*/

const cp = require('child_process');
let gitPath = 'git';
let gitRepoBase = null;
const gitRun = cmdArgs => {
	return new Promise((resolve, reject) => {
		
		console.log("calling git", cmdArgs, gitRepoBase || process.cwd(), process.pwd)
		const subProc = cp.spawn(gitPath, cmdArgs, {
			cwd: gitRepoBase || process.cwd(),
			env: process.env
		});
		let data = [];
		subProc.stdout.on('data', 
		d => 
		{
			console.log("data", d.toString());
			data.push(d)
		});
		subProc.stderr.on('data', d =>console.log("error:", d.toString()));
		subProc.on('error', e => console.log(e))
		subProc.on('exit', () => resolve(Buffer.concat(data)
			.toString()));
	});
}

exports.setGitPath = newPath => gitPath = newPath;
exports.setGitRepoBase = newBase => gitRepoBase = newBase;

exports.currentBranch = () => {
	return Promise.resolve({
		name: "master",
		msg: "master branch",
		sha: "pooppooooooopoo"
	});
}

exports.branchList = () => {
	return gitRun(['branch', '-v', '--sort=-committerdate'])
		.then(resultString => {
			const matcher = /[\s\*]*(.+?)\s*([a-fA-F0-9]*)\s*(.*)/y;
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
		})
};