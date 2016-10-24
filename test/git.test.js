'use strict';

const vscode = require('vscode');
const git = require('../git');
const expect = require('chai')
	.expect;

require('./surroundHooks');

git.setGitRepoBase(vscode.workspace.rootPath);

describe('#currentBranch', function() {
	context('when inside of a git repository', function() {
		it('should return the name of the current git branch', function() {
			return git.currentBranch()
				.then(
					branch => expect(branch)
					.to.eql('master')
				);
		});
	});

	context('when not inside of a git repository', function() {
		it('should fail with an error');
	});
});