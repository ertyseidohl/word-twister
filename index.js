(function() {
	var express = require('express');
	var bodyParser = require('body-parser');
	var parody = require('./parody/parody.js');
	var fs = require('fs');

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

	app.get('/loggg', function(req, res) {
		fs.writeFile('./log.log', 'loggg\n', function(err) {
			if (err) {
				return res.send("err");
			}
			fs.readFile('./log.log', function(err, str) {
				if (err) {
					return res.send("nope");
				}
				res.send(str);
			});
		});
	});

	app.listen(port, function() {
		console.log('Express server listening on port ' + port);
	});
})();
