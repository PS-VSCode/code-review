'use strict';

const vscode = require('vscode');
const git = require('./git');
const path = require('path');

const QuickPickDiffItem = function (diffItem) {
	this.name = diffItem.name;
	this.sha = diffItem.sha;
	this.msg = diffItem.msg;

	this.label = diffItem.name;
	this.description = diffItem.sha + ' (' + diffItem.msg + ')';
};

const gitLookupForBranch = branch => {
	// Assuming we will either get back an internally defined branch/diff obj, or a simple branch name/sha
	if (branch.hasOwnProperty('name')) {
		return branch.name;
	} else if (branch.hasOwnProperty('sha')) {
		return branch.sha;
	} else {
		return branch;
	}
};
exports.gitLookupForBranch = gitLookupForBranch;

const chooseBranch = () => git.branchList()
	.then(branchList => {
		let defaultBranch = branchList.length ? branchList[0].name : 'master';

		return vscode.window.showQuickPick(
			branchList.map(item => new QuickPickDiffItem(item)), {
				placeHolder: defaultBranch
			}
		);
	},
	() => null);

const reviewSeparateBranches = () => {
	chooseBranch()
		.then(
		baseBranch => {
			chooseBranch()
				.then(
				patchBranch => {
					reviewBranches(baseBranch, patchBranch);
				},
				() => null
				);
		},
		() => null
		);
};

const reviewAgainstCurrentBranch = () => {
	git.currentBranch()
		.then(
		currentBranch => {
			chooseBranch()
				.then(
				selectedBranch => {
					reviewBranches(currentBranch, selectedBranch);
				},
				() => null
				);
		},
		error => vscode.window.showInformationMessage(error)
		);
};

function handleDiffs(targetBranch, baseFileName, patchTempFileName, stateFlag, deletedFileName) {
	//if (!baseFileName || !patchTempFileName) return;
	console.log(targetBranch, baseFileName, patchTempFileName);
	let baseFilePath = vscode.Uri.file(path.join(vscode.workspace.rootPath, baseFileName));
	let patchTempFilePath = vscode.Uri.file(patchTempFileName);
	if (stateFlag === git.CONFLICT) {
		console.log(targetBranch, baseFileName, patchTempFileName, stateFlag, deletedFileName);
		console.log('conflict set');
		return Promise.resolve();
	} else if (stateFlag === git.NEW) {
		console.log("New?", stateFlag);
		return vscode.commands.executeCommand('vscode.diff', patchTempFilePath, baseFilePath, `(${targetBranch})[NEW]⟷${baseFileName}`)
			.then(() => {
				console.log("Called at:", baseFileName);
				return vscode.commands.executeCommand('workbench.action.keepEditor', vscode.window.activeTextEditor);
			});
	} else if (stateFlag === git.DELETED) {
		console.log("Deleted?", stateFlag);
		return Promise.resolve();
	} else {
		console.log("Modified?", stateFlag);
		return vscode.commands.executeCommand('vscode.diff', patchTempFilePath, baseFilePath, `(${targetBranch})⟷${baseFileName}`)
			.then(() => {
				console.log("Called at:", baseFileName);
				return vscode.commands.executeCommand('workbench.action.keepEditor', vscode.window.activeTextEditor);
			});
	}
}

const reviewBranches = (baseBranch, patchBranch) => {
	let baseBranchLookup = gitLookupForBranch(baseBranch);
	let patchBranchLookup = gitLookupForBranch(patchBranch);
	let resultsPromise = git.diffState(baseBranchLookup, patchBranchLookup);
	const handler = r => {
		r.unshift(baseBranchLookup);
		return () => handleDiffs.apply(0, r);
	};
	resultsPromise.then(results => results.reduce((p, r) => p.then(handler(r)), Promise.resolve()));
};

function activate(context) {
	git.setGitRepoBase(vscode.workspace.rootPath);

	let reviewDisposable = vscode.commands.registerCommand('ps-vscode.review', reviewSeparateBranches);
	let currentReviewDisposable = vscode.commands.registerCommand('ps-vscode.reviewCurrent', reviewAgainstCurrentBranch);

	context.subscriptions.push(reviewDisposable);
	context.subscriptions.push(currentReviewDisposable);
}
exports.activate = activate;

function deactivate() { }
exports.deactivate = deactivate;