'use strict';

var vscode = require('vscode');
var myExtension = require('../extension');
var expect = require('chai')
	.expect;

describe('#gitLookupForBranch', function() {
	let branchObject = 'branch';

	it('pulls out a sha key from an object', () => {
		let sha = 'a1b2c3d4e5';
		let branchObject = {
			sha: sha
		};

		expect(myExtension.gitLookupForBranch(branchObject))
			.to.eql(sha);
	});

	it('uses the branchObject itself is it does not have a sha key', () => {
		expect(myExtension.gitLookupForBranch(branchObject))
			.to.eql(branchObject);
	})
});