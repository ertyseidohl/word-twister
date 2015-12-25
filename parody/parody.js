;(function(module) {
	"use strict";

	var fs = require('fs');
	var readline = require('readline');
	var cmu = require('cmudict-to-sqlite');

	cmu = new cmu.CmudictDb('./node_modules/cmudict-to-sqlite/cmudict.0.7a.sqlite');

	var englishWords = {};
	var isWordlistReady = false;

	function log(text) {
		fs.appendFile("./log.log", text + "\n---\n", function(err) {
			if(err) {
				console.log(err);
			}
		});
	}

	readline.createInterface({
		input: fs.createReadStream('./scowl.txt'),
		terminal: false
	}).on('line', function(line) {
		if (line[0] !== '/') {
			englishWords[line.toLowerCase()] = true;
		}
	}).on('close', function() {
		isWordlistReady = true;
	});

	function getRhymeForWord(poemRef, callback, index, numMatching) {
		var word = poemRef[index];
		cmu.lookupWord(word, function(err, wordRows) {
			if (word == "\n") {
				callback("\n", index);
				return;
			}
			if (!(word.toLowerCase() in englishWords)) {
				callback(word, index);
				return;
			}
			if (wordRows.length === 0) {
				callback(word, index);
				return;
			}
			var wordProps = wordRows[0];
			var syllableCount = wordProps.code.split(' ').length;
			var rhymingPhoneme = getRhymingPhoneme(wordProps.code, numMatching);
			cmu.fuzzyLookupCode(rhymingPhoneme, function(err, rows) {
				var rhymingWords = rows.filter(function(row){
					return row.code.split(' ').length == syllableCount;
				}).filter(function(row) {
					return row.word.toLowerCase() in englishWords;
				}).map(function(row) {
					return row.word;
				});
				var chosenRhyme;
				if (!rhymingWords.length) {
					chosenRhyme = word;
				} else if (rhymingWords.length == 1) {
					chosenRhyme = rhymingWords[0];
				} else {
					var tries = 0;
					chosenRhyme = rhymingWords[Math.floor(Math.random() * rhymingWords.length)];
					while (
						tries < 3 &&
						chosenRhyme.toLowerCase() == word.toLowerCase()
					) {
						chosenRhyme = rhymingWords[Math.floor(Math.random() * rhymingWords.length)];
						tries ++;
					}
				}
				callback(chosenRhyme, index);
			});
		});
	}

	function getRhymingPhoneme(code, count) {
		var splitCode = code.split(' ');
		if (count > splitCode.length) {
			count = splitCode.length;
		}
		return "%" + splitCode.slice(-count).join(' ');
	}

	function close() {
		cmu.unload();
	}

	function createParody(poem, numMatching) {
		var originalPoem = poem.replace(/\n/g, ' \n ').split(' ').filter(function(word){
			return word == "\n" || word.trim();
		});
		var newPoem = [];
		for (var i = 0; i < originalPoem.length; i++) {
			getRhymeForWord(
				originalPoem,
				function(chosenRhyme, index) {
					newPoem[index] = chosenRhyme;
				},
				i,
				numMatching
			);
		}
		return {
			newPoem: newPoem,
			poemLength: originalPoem.length
		};
	}

	function whenComplete(newPoemObj, callback, count) {
		var i;
		if (newPoemObj.newPoem.length < newPoemObj.poemLength &&
			count < 100
		) {
			setTimeout(function() {
				whenComplete(newPoemObj, callback, count + 1);
			}, 100);
			return;
		}
		if (count >= 100) {
			callback("Request timed out.");
			log("Request timed out!");
		} else {
			callback(newPoemObj.newPoem);
		}
	}

	module.exports.createParody = function(input, numMatching, callback) {
		log(input);
		if (!isWordlistReady) {
			callback("Waiting on wordlist to load. Please try again soon.");
		}
		var newPoemObj = createParody(input, numMatching);
		whenComplete(newPoemObj, function(result) {
			callback(result.join(' ').toLowerCase());
		}, 0);
	}

})(module);
