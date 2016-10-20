'use strict';

var vscode = require('vscode');
var myExtension = require('../git');
var expect = require('chai')
	.expect;

describe('#currentBranch', function() {
	context('when inside of a git repository', () => {
		it('should return the name of the current git branch');
	});

	context('when not inside of a git repository', () => {
		it('should fail with an error');
	});
});