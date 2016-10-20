'use strict';

// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
var vscode = require('vscode');
var git = require('./git');

const chooseBranch = () => git.branchList()
		.then(branchList => {
				var defaultBranch = branchList.length ? branchList[0].name : 'master';

				return vscode.window.showQuickPick(
						branchList.map(item => item.name), {
							placeHolder: defaultBranch
						}
					)
					.then(selectedBranchName => branchList.find(branch => branch.name === selectedBranchName));
			},
			() => null);

// this method is called when your extension is activated
// your extension is activated the very first time the command is executed
function activate(context) {

	// The command has been defined in the package.json file
	// Now provide the implementation of the command with  registerCommand
	// The commandId parameter must match the command field in package.json
	var disposable = vscode.commands.registerCommand('ps-vscode.review', function() {
		// The code you place here will be executed every time your command is executed

		chooseBranch()
			.then(
				selectedBranch => {
					vscode.window.showInformationMessage(selectedBranch.name);
				},
				() => null
			);
	});

	context.subscriptions.push(disposable);
}
exports.activate = activate;

// this method is called when your extension is deactivated
function deactivate() {}
exports.deactivate = deactivate;