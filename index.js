(function() {
	var express = require('express');
	var bodyParser = require('body-parser');
	var parody = require('./parody/parody.js');

	var port = process.env.PORT || 8000;

	var app = express();

	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: true }));

	app.use(express.static('public'));

	app.post('/twist', function(req, res) {
		parody.createParody(
			req.body.original || "",
			req.body.numMatching || 2,
			function(parodyText) {
				res.send(parodyText);
			});
	});

	app.listen(port, function() {
		console.log('Express server listening on port ' + port);
	});
})();
