var onReady = function() {
	// Get utils or define
	var utils = NodeGameKit.namespace('NodeGameKit.utils');
	utils.SomeHelperClass = function() {
		 console.log("HelloWorld");
	};
};

if (typeof window === 'undefined') {
	require('js/NodeGameKit');
	onReady();
} else {
	define(['NodeGameKit'], onReady);
}