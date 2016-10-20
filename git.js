'use strict';

exports.branchList = () => {
	return Promise.resolve([{
		name: "some_branch",
		msg: "a very interesting commit",
		sha: "a1b2c3d"
	}]);
};