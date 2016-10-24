'use strict';

const fs = require('fs'),
	path = require('path');
before('make the test_repo a git repo', function(done) {
	fs.rename(path.join(__dirname, 'test_repo', '_git'), path.join(__dirname, 'test_repo', '.git'), done);
});

after('reset the test_repo so we can include it in this one', function(done) {
	fs.rename(path.join(__dirname, 'test_repo', '.git'), path.join(__dirname, 'test_repo', '_git'), done);
});