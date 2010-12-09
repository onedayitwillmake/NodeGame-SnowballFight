NodeGameKit = (typeof NodeGameKit === 'undefined') ? {} : NodeGameKit;
var onReady = function() {
	NodeGameKit.namespace = function(ns_string)
	{
		var parts = ns_string.split('.'),
			parent = NodeGameKit,
			i = 0;


		// strip redundant leading global
		if (parts[0] === "NodeGameKit") {
			parts = parts.slice(1);
		}

		var len = parts.length,
			aPackage = null;
		for (i = 0; i < len; i += 1) {
			var singlePart = parts[i];
			// create a property if it doesn't exist
			if (typeof parent[singlePart] === "undefined") {
			   parent[singlePart] = {};
			}
			parent = parent[singlePart];

		}
		return parent;
	};

	return NodeGameKit;	 
};

if (typeof window === 'undefined') {
	NodeGameKit = onReady();
} else {
	define(onReady);
}