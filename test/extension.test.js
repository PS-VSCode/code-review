'use strict';

var vscode = require('vscode');
var review = require('../extension');
var expect = require('chai')
	.expect;

require('./surroundHooks');

describe('#gitLookupForBranch', function() {
	let branchObject = 'branch';

	it('pulls out a sha key from an object', function() {
		let sha = 'a1b2c3d4e5';
		let branchObject = {
			sha: sha
		};

		expect(review.gitLookupForBranch(branchObject))
			.to.eql(sha);
	});

	it('uses the branchObject itself is it does not have a sha key', function() {
		expect(review.gitLookupForBranch(branchObject))
			.to.eql(branchObject);
	});
});