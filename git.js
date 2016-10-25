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

exports.CONFILCT = 1;
exports.MODIFIED = 2;
exports.NEW = 3;
exports.DELETED = 4;

let gitPath = 'git';
let gitRepoBase = null;
const gitRun = cmdArgs => {
	return new Promise((resolve, reject) => {
		const subProc = cp.spawn(gitPath, cmdArgs, {
			cwd: gitRepoBase || process.cwd(),
			env: process.env
		});
		let data = [],
			err = [];
		subProc.stdout.on('data', d => data.push(d));
		subProc.stderr.on('data', d => err.push(d));
		subProc.on('exit', () => {
			if (!data.length) {
				if (err.length) reject(Buffer.concat(err)
					.toString());
				else resolve('');
			} else resolve(Buffer.concat(data)
				.toString());
		});
	});
};

exports.setGitPath = newPath => gitPath = newPath;
exports.setGitRepoBase = newBase => gitRepoBase = newBase;

exports.currentBranch = () => {
	return gitRun(['rev-parse', '--abbrev-ref', 'HEAD'])
		.then(result => result.trim());
};

const fileStatusList = () => gitRun(['status', '-s', '--porcelain'])
	.then(modifiedString => {
		const matcher = /\s*([^\s]+)\s+(.+)/y;
		let match = matcher.exec(modifiedString);
		let files = {};
		while (match) {
			files[match[2].trim()] = match[1].trim();
			match = matcher.exec(modifiedString);
		}
		return files;
	});


const tmpFile = (branch, file) => {
	return gitRun(['show', `${branch}:${file}`])
		.then(fileContent => {
			return new Promise((resolve, reject) =>
				fs.mkdtemp(path.join(os.tmpdir(), 'vscode'), (err, folder) => {
					if (err) return reject(err.message);
					let fName = path.join(folder, file.replace(/[\\\/]/g, '!'));
					fs.writeFile(fName, fileContent, err => {
						if (err) return reject(err.message);
						resolve(fName);
					});
				}));
		});
};
const blankFile = () => {
	return new Promise((resolve, reject) =>
		fs.mkdtemp(path.join(os.tmpdir(), 'vscode'), (err, folder) => {
			if (err) return reject(err.message);
			let fName = path.join(folder, 'null');
			fs.writeFile(fName, "", err => {
				if (err) return reject(err.message);
				resolve(fName);
			});
		}));
};

function dump(fr) {
	return function(n) {
		console.log(fr, "::", n);
		return n;
	};
}


exports.diffState = (reviewBranch, targetBranch) => {
	reviewBranch = reviewBranch.trim();
	targetBranch = targetBranch.trim();

	return gitRun(['branch'])
		.then(resultString => {
			const matcher = /[\s\*]*(.+)/y;
			let match = matcher.exec(resultString);
			let result = [];
			let returnBranch = "";
			while (match) {
				result.push(match[1].trim());
				match = matcher.exec(resultString);
			}
			let outputbranch = 'vscodeReview_';
			while (result.includes(outputbranch)) {
				outputbranch += 'x';
			}
			// move to the target
			return gitRun(['checkout', targetBranch])
				.then(dump('checkout'), dump('checkout F'))
				// create a junk branch
				.then(() => gitRun(['checkout', '-b', outputbranch])) // returns data on stderr
				.then(dump('checkout -b'), dump('checkout -b F'))
				// run the intended merge
				.then(() => gitRun(['merge', '--no-ff', '--no-commit', reviewBranch])
					// .then(dump('merge into new'), dump('merge into new F'))
					// get the status, aborting if it failed
					.then(fileStatusList,
						failure => {
							return fileStatusList()
								.then(list => gitRun(['merge', '--abort'])
									.then(dump('merge abort'), dump('merge abort F'))
									.then(dump('merge --abort'))
									.then(() => list));
						})
					// clear the changes
					.then(files => gitRun(['reset', '--hard', 'HEAD~1'])
						.then(dump('reset'), dump('reset F'))
						// return to the reviewBranch
						.then(() => gitRun(['checkout', reviewBranch])
							.then(dump('reset'), dump('reset F'))
							// drop the junk branch
							.then(() => gitRun(['branch', '-D', outputbranch]))
							.then(() => {
								let rtnPromises = [];
								let count = 0;
								// we now have the required file list
								for (let file in files) {
									count++;
									console.log("file:", file);
									switch (files[file][0]) {
										case 'U': // conflict
											rtnPromises.push(Promise.resolve([file, null, exports.CONFILCT]));
											break;
										case 'M': // modified
											rtnPromises.push(tmpFile(targetBranch, file)
												.then(tmp => [file, tmp, exports.MODIFIED]));
											break;
										case 'A': // added
										case 'C': // copied
											rtnPromises.push(
												blankFile()
												.then(tmp => [file, tmp, exports.NEW]));
											break;
										case 'D': // deleted
											rtnPromises.push(
												tmpFile(targetBranch, file)
												.then(tmp => blankFile()
													.then(blnk => [blnk, tmp, exports.DELETED, file])));
											break;
										case 'R': // renamed (deleted+added)
											// there must be more info here.
											console.log("Rename: ", file);
											// tmpFile(targetBranch, file)
											//	.then(tmp => cb(file, tmp));
											break;
										default:
											break;
									}
								}
								return Promise.all(rtnPromises);
							}))));
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
					name: match[1].trim(),
					sha: match[2].trim(),
					msg: match[3].trim()
				});
				match = matcher.exec(resultString);
			}
			return result;
		});
};