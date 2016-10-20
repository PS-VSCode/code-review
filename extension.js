'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
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

const compareBranches = (baseBranch, patchBranch) => {
	console.log(baseBranch);
	console.log(patchBranch);
	let comparisonMessage = 'comparing ' + baseBranch.name + ' with ' + patchBranch.name;
	vscode.window.showInformationMessage(comparisonMessage);
}

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {
	git.setGitRepoBase(vscode.workspace.rootPath);

	let reviewDisposable = vscode.commands.registerCommand('ps-vscode.review', function() {
		// The code you place here will be executed every time your command is executed

		chooseBranch()
			.then(
				baseBranch => {
					chooseBranch()
						.then(
							patchBranch => {
								compareBranches(baseBranch, patchBranch);
							},
							() => null
						);
				},
				() => null
			);
	});

	let currentReviewDisposable = vscode.commands.registerCommand('ps-vscode.reviewCurrent', function() {
		// The code you place here will be executed every time your command is executed
		git.currentBranch()
			.then(
				currentBranch => {
					chooseBranch()
						.then(
							selectedBranch => {
								compareBranches(selectedBranch, currentBranch);
							},
							() => null
						);
				},
				() => vscode.window.showInformationMessage('Cannot determine current branch')
			);
	});

	context.subscriptions.push(reviewDisposable);
	context.subscriptions.push(currentReviewDisposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;