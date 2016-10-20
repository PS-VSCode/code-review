'use strict';

/* global suite, test */

//
// Note: This example test is leveraging the Mocha test framework.
// Please refer to their documentation on https://mochajs.org/ for help.
//

// The module 'assert' provides assertion methods from node
var assert = require('assert');
var expect = require('chai')
	.expect;

// You can import and use all API from the 'vscode' module
// as well as import your extension to test it
var vscode = require('vscode');
var myExtension = require('../extension');

describe('#gitLookupForBranch(branch)', function() {
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