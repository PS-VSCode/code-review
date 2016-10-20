'use strict';

const vscode = require('vscode');
const git = require('./git');

const QuickPickDiffItem = function(diffItem) {
	this.name = diffItem.name;
	this.sha = diffItem.sha;
	this.msg = diffItem.msg;

	this.label = diffItem.name;
	this.description = diffItem.sha + ' (' + diffItem.msg + ')';
};

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
							reviewBranches(selectedBranch, currentBranch);
						},
						() => null
					);
			},
			() => vscode.window.showInformationMessage('Cannot determine current branch')
		);
};

const reviewBranches = (baseBranch, patchBranch) => {
	console.log(baseBranch);
	console.log(patchBranch);
	let comparisonMessage = 'comparing ' + baseBranch.name + ' with ' + patchBranch.name;
	vscode.window.showInformationMessage(comparisonMessage);
};

function activate(context) {
	git.setGitRepoBase(vscode.workspace.rootPath);

	let reviewDisposable = vscode.commands.registerCommand('ps-vscode.review', reviewSeparateBranches);
	let currentReviewDisposable = vscode.commands.registerCommand('ps-vscode.reviewCurrent', reviewAgainstCurrentBranch);

	context.subscriptions.push(reviewDisposable);
	context.subscriptions.push(currentReviewDisposable);
}
exports.activate = activate;

function deactivate() {}
exports.deactivate = deactivate;