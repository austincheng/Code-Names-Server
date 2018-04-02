var express = require('express');
var fs = require('fs');
var path = require('path');
var app = express();
var serv = require('http').Server(app);

app.get('/', function(req, res) {
	res.sendFile(__dirname + '/client/index.html');
});
app.use('/client', express.static(__dirname + '/client'));

serv.listen(process.env.PORT || 3000);
console.log('Server started.');

var CARD_WIDTH = 200;
var CARD_HEIGHT = 100;
var IN_BETWEEN = 50;
var FONT_SIZE = 20;
var FONT_STYLE = 'Arial';
var BUTTON_WIDTH = 50;
var BUTTON_HEIGHT = 25;
var TIMING_PADDING = 50;
var CANVAS_SIDE_PADDING = 8;
var SIDE = 5;
var WIDTH = CARD_WIDTH * SIDE + IN_BETWEEN * (SIDE + 1);
var HEIGHT = CARD_HEIGHT * SIDE + IN_BETWEEN * (SIDE + 1) + BUTTON_HEIGHT;

var Piece = {
	RED: "red",
	BLUE: "blue",
	NEUTRAL: "neutral",
	ASSASSIN: "assassin",
	NONE: "none",
};

var opposite = function(piece) {
	if (piece === Piece.RED) {
		return Piece.BLUE;
	} else if (piece === Piece.BLUE) {
		return Piece.RED;
	}
}

var Board = function(words, answer, starter, gameId) {
	var self = {};
	self.words = words;
	self.answer = answer;
	self.starter = starter;
	self.turn = starter;
	self.gameId = gameId;
	self.numSpyMasters = 0;
	var covered = new Array(SIDE);
	for (var i = 0; i < covered.length; i++) {
		covered[i] = new Array(SIDE);
	}
	for (var r = 0; r < SIDE; r++) {
		for (var c = 0; c < SIDE; c++) {
			covered[r][c] = Piece.NONE;
		}
	}
	self.covered = covered;
	return self;
};

var allWords// = ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i', 'j', 'k', 'l', 'm', 'n', 'o', 'p', 'q', 'r', 's', 't', 'u', 'v', 'w', 'x', 'y', 'z'];
var readTextFile = function(file) {
    fs.readFile(file, 'utf8', function(err, data) {
    	if (err) {
    		throw err;
    	}
    	content = data;
    	allWords = content.split('\r\n');
    });
}
readTextFile(path.join(process.cwd(), '/client/wordSets/lineSeparated/standardWords.txt'));
/* Extremely Ghetto. */
setTimeout(function() {}, 2000)

var getRandomInt = function(max) {
	return Math.floor(Math.random() * max);
} 

var getWords = function() {
	var words = new Array(SIDE);
	for (var i = 0; i < words.length; i++) {
		words[i] = new Array(SIDE);
	}
	var used = [];
    for (var r = 0; r < SIDE; r++) {
        for (var c = 0; c < SIDE; c++) {
            var index = getRandomInt(allWords.length);
            while (used.includes(index)) {
                index = getRandomInt(allWords.length);
            }
            words[r][c] = allWords[index];
            used.push(index);
        }
    }
    return words;
}

var getAnswer = function() {
	var answer = new Array(SIDE);
	for (var i = 0; i < answer.length; i++) {
		answer[i] = new Array(SIDE);
	}
	var assassinRow = getRandomInt(SIDE);
	var assassinCol = getRandomInt(SIDE);
	answer[assassinRow][assassinCol] = Piece.ASSASSIN;

	for (var i = 0; i < 23 /*Only works for SIDE = 5 */; i++) {
		var row = getRandomInt(SIDE);
		var col = getRandomInt(SIDE);
		while (answer[row][col] !== undefined) {
			row = getRandomInt(SIDE);
        	col = getRandomInt(SIDE);
		}
		if (i % 3 === 0) {
			answer[row][col] = Piece.RED;
		} else if (i % 3 === 1) {
			answer[row][col] = Piece.BLUE;
		} else {
			answer[row][col] = Piece.NEUTRAL;
		}
	}

	var lastRow = 0;
	var lastCol = 0;
	var found = false;
	for (var r = 0; r < SIDE; r++) {
		for (var c = 0; c < SIDE; c++) {
			if (answer[r][c] === undefined) {
				lastRow = r;
				lastCol = c;
				found = true;
				break;
			}
		}
		if (found) {
			break;
		}
	}

	var coin = Math.random();
	var first = null;
	if (coin < 0.5) {
		answer[lastRow][lastCol] = Piece.RED;
		first = Piece.RED;
	} else {
		answer[lastRow][lastCol] = Piece.BLUE;
		first = Piece.BLUE;
	}

	return [answer, first];
}

SOCKET_LIST = {};
GAME_LIST = {};

var initBoard = function(id) {
	var words = getWords();
	var answer = getAnswer();
	var board = Board(getWords(), answer[0], answer[1], id);
	GAME_LIST[id] = board;
}

var io = require('socket.io')(serv, {});
io.sockets.on('connection', function(socket) {
	socket.id = Math.random();
	SOCKET_LIST[socket.id] = socket;

	socket.on('host', function() {
		var gameId = getRandomInt(9000) + 1000;
		while (gameId in GAME_LIST) {
			gameId = getRandomInt(9000) + 1000;
		}
		initBoard(gameId);
		socket.gameId = gameId;
		socket.emit('menuResponse');
	});

	socket.on('joinPlayer', function(data) {
		var gameId = data;
		if (!(gameId in GAME_LIST)) {
			socket.emit('badMenuResponse');
		} else {
			socket.gameId = gameId;
			socket.emit('menuResponse');
		}
	});

	socket.on('joinSpyMaster', function(data) {
		var gameId = data;
		if (!(gameId in GAME_LIST)) {
			socket.emit('badMenuResponse');
		} else if (GAME_LIST[gameId].numSpyMasters >= 2) {
			socket.emit('badSpyMasterMenuResponse');
		} 
		else {
			socket.gameId = gameId;
			socket.spyMaster = true;
			GAME_LIST[gameId].numSpyMasters++;
			socket.emit('menuResponse');
		}
	});

	socket.on('click', function(data) {
		var board = GAME_LIST[socket.gameId];
		var x = data[0];
		var y = data[1];
        var row = Math.floor(y / (IN_BETWEEN + CARD_HEIGHT));
        var col = Math.floor(x / (IN_BETWEEN + CARD_WIDTH));

		if ((IN_BETWEEN + CARD_HEIGHT) * row + IN_BETWEEN <= y) {
            if ((IN_BETWEEN + CARD_WIDTH) * col + IN_BETWEEN <= x) {
                if (board.covered[row][col] === Piece.NONE) {
                	board.covered[row][col] = board.answer[row][col];
                }
            }
        }
	});

	socket.on('disconnect', function() {
		delete SOCKET_LIST[socket.id];
	})
});

setInterval(function() {
	for (var i in SOCKET_LIST) {
		var socket = SOCKET_LIST[i];
		if (socket.gameId) {
			if (socket.spyMaster) {
				socket.emit('showSpyMaster', GAME_LIST[socket.gameId]);
			} else {
				socket.emit('update', GAME_LIST[socket.gameId]);
			}
		}
	}
}, 1000/25);