'use strict';

/* exports:

setGitPath("path/to/git")
setGitRepoBase("basedir")
branchList()
diffState("reviewBranch", "targetBranch", cb(reviewBranchFileName, targetBranchTempFilename, conflictFlag))
*/

const cp = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

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
	return gitRun(['rev-parse', '--abbrev-ref', 'HEAD']);
};

const fileStatusList = () => gitRun(['status', '-s', '--porcelain'])
	.then(modifiedString => {
		const matcher = /(.+)\s+(.*)/y;
		let match = matcher.exec(modifiedString);
		let files = {};
		while (match) {
			files[matcher[2]] = matcher[1];
			match = matcher.exec(modifiedString);
		}
		return files;
	});


const tmpFile = (branch, file) => {
	return gitRun(['show', `${branch}:${file}`])
		.then(fileContent => {
			return new Promise((resolve, reject) =>
				fs.mkdtemp(path.join(os.tmpdir(), 'vscode', (err, folder) => {
					if (err) return reject(err.message);
					let fName = path.join(folder, file);
					fs.writeFile(fName, err => {
						if (err) return reject(err.message);
						resolve(fName);
					});
				})));
		});
};


exports.diffState = (reviewBranch, targetBranch, cb) => {
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

			// move to the target
			return gitRun(['checkout', targetBranch])
				// create a junk branch
				.then(() => gitRun(['checkout', '-b', outputbranch]))
				// run the intended merge
				.then(() => gitRun(['merge', reviewBranch])
					// get the status, aborting if it failed
					.then(fileStatusList,
						failure => {
							const list = fileStatusList();
							return gitRun(['merge', '--abort'])
								.then(() => list);
						})
					// return to the reviewBranch
					.then(files => gitRun(['checkout', reviewBranch])
						// drop the junk branch
						.then(() => gitRun(['branch', '-D', outputbranch]))
						.then(() => {
							// we now have the required file list
							for (let file in files) {
								switch (files[file][0]) {
									case 'U': // conflict
										cb(file, null, true);
										break;
									case 'M': // modified
										tmpFile(targetBranch, file)
											.then(tmp => cb(file, tmp));
										break;
									case 'A': // added
									case 'C': // copied
										cb(file, null);
										break;
									case 'D': // deleted
										tmpFile(targetBranch, file)
											.then(tmp => cb(file, tmp));
										break;
									case 'R': // renamed (deleted+added)
										// there must be more info here.
										tmpFile(targetBranch, file)
											.then(tmp => cb(file, tmp));
										break;
									default:
										break;
								}
							}
						})));
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