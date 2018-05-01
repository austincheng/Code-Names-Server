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

var allWords = ["AFRICA", "AGENT", "AIR", "ALIEN", "ALPS", "AMAZON", "AMBULANCE", "AMERICA", "ANGEL", "ANTARCTICA", "APPLE", "ARM", "ATLANTIS", "AUSTRALIA", "AZTEC", "BACK", "BALL", "BAND", "BANK", "BAR", "BARK", "BAT", "BATTERY", "BEACH", "BEAR", "BEAT", "BED", "BEIJING", "BELL", "BELT", "BERLIN", "BERMUDA", "BERRY", "BILL", "BLOCK", "BOARD", "BOLT", "BOMB", "BOND", "BOOM", "BOOT", "BOTTLE", "BOW", "BOX", "BRIDGE", "BRUSH", "BUCK", "BUFFALO", "BUG", "BUGLE", "BUTTON", "CALF", "CANADA", "CAP", "CAPITAL", "CAR", "CARD", "CARROT", "CASINO", "CAST", "CAT", "CELL", "CENTAUR", "CENTER", "CHAIR", "CHANGE", "CHARGE", "CHECK", "CHEST", "CHICK", "CHINA", "CHOCOLATE", "CHURCH", "CIRCLE", "CLIFF", "CLOAK", "CLUB", "CODE", "COLD", "COMIC", "COMPOUND", "CONCERT", "CONDUCTOR", "CONTRACT", "COOK", "COPPER", "COTTON", "COURT", "COVER", "CRANE", "CRASH", "CRICKET", "CROSS", "CROWN", "CYCLE", "CZECH", "DANCE", "DATE", "DAY", "DEATH", "DECK", "DEGREE", "DIAMOND", "DICE", "DINOSAUR", "DISEASE", "DOCTOR", "DOG", "DRAFT", "DRAGON", "DRESS", "DRILL", "DROP", "DUCK", "DWARF", "EAGLE", "EGYPT", "EMBASSY", "ENGINE", "ENGLAND", "EUROPE", "EYE", "FACE", "FAIR", "FALL", "FAN", "FENCE", "FIELD", "FIGHTER", "FIGURE", "FILE", "FILM", "FIRE", "FISH", "FLUTE", "FLY", "FOOT", "FORCE", "FOREST", "FORK", "FRANCE", "GAME", "GAS", "GENIUS", "GERMANY", "GHOST", "GIANT", "GLASS", "GLOVE", "GOLD", "GRACE", "GRASS", "GREECE", "GREEN", "GROUND", "HAM", "HAND", "HAWK", "HEAD", "HEART", "HELICOPTER", "HIMALAYAS", "HOLE", "HOLLYWOOD", "HONEY", "HOOD", "HOOK", "HORN", "HORSE", "HORSESHOE", "HOSPITAL", "HOTEL", "ICE", "ICE CREAM", "INDIA", "IRON", "IVORY", "JACK", "JAM", "JET", "JUPITER", "KANGAROO", "KETCHUP", "KEY", "KID", "KING", "KIWI", "KNIFE", "KNIGHT", "LAB", "LAP", "LASER", "LAWYER", "LEAD", "LEMON", "LEPRECHAUN", "LIFE", "LIGHT", "LIMOUSINE", "LINE", "LINK", "LION", "LITTER", "LOCH NESS", "LOCK", "LOG", "LONDON", "LUCK", "MAIL", "MAMMOTH", "MAPLE", "MARBLE", "MARCH", "MASS", "MATCH", "MERCURY", "MEXICO", "MICROSCOPE", "MILLIONAIRE", "MINE", "MINT", "MISSILE", "MODEL", "MOLE", "MOON", "MOSCOW", "MOUNT", "MOUSE", "MOUTH", "MUG", "NAIL", "NEEDLE", "NET", "NEW YORK", "NIGHT", "NINJA", "NOTE", "NOVEL", "NURSE", "NUT", "OCTOPUS", "OIL", "OLIVE", "OLYMPUS", "OPERA", "ORANGE", "ORGAN", "PALM", "PAN", "PANTS", "PAPER", "PARACHUTE", "PARK", "PART", "PASS", "PASTE", "PENGUIN", "PHOENIX", "PIANO", "PIE", "PILOT", "PIN", "PIPE", "PIRATE", "PISTOL", "PIT", "PITCH", "PLANE", "PLASTIC", "PLATE", "PLATYPUS", "PLAY", "PLOT", "POINT", "POISON", "POLE", "POLICE", "POOL", "PORT", "POST", "POUND", "PRESS", "PRINCESS", "PUMPKIN", "PUPIL", "PYRAMID", "QUEEN", "RABBIT", "RACKET", "RAY", "REVOLUTION", "RING", "ROBIN", "ROBOT", "ROCK", "ROME", "ROOT", "ROSE", "ROULETTE", "ROUND", "ROW", "RULER", "SATELLITE", "SATURN", "SCALE", "SCHOOL", "SCIENTIST", "SCORPION", "SCREEN", "SCUBA DIVER", "SEAL", "SERVER", "SHADOW", "SHAKESPEARE", "SHARK", "SHIP", "SHOE", "SHOP", "SHOT", "SINK", "SKYSCRAPER", "SLIP", "SLUG", "SMUGGLER", "SNOW", "SNOWMAN", "SOCK", "SOLDIER", "SOUL", "SOUND", "SPACE", "SPELL", "SPIDER", "SPIKE", "SPINE", "SPOT", "SPRING", "SPY", "SQUARE", "STADIUM", "STAFF", "STAR", "STATE", "STICK", "STOCK", "STRAW", "STREAM", "STRIKE", "STRING", "SUB", "SUIT", "SUPERHERO", "SWING", "SWITCH", "TABLE", "TABLET", "TAG", "TAIL", "TAP", "TEACHER", "TELESCOPE", "TEMPLE", "THEATER", "THIEF", "THUMB", "TICK", "TIE", "TIME", "TOKYO", "TOOTH", "TORCH", "TOWER", "TRACK", "TRAIN", "TRIANGLE", "TRIP", "TRUNK", "TUBE", "TURKEY", "UNDERTAKER", "UNICORN", "VACUUM", "VAN", "VET", "WAKE", "WALL", "WAR", "WASHER", "WASHINGTON", "WATCH", "WATER", "WAVE", "WEB", "WELL", "WHALE", "WHIP", "WIND", "WITCH", "WORM", "YARD"];

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
	allWords = ["AFRICA", "AGENT", "AIR", "ALIEN", "ALPS", "AMAZON", "AMBULANCE", "AMERICA", "ANGEL", "ANTARCTICA", "APPLE", "ARM", "ATLANTIS", "AUSTRALIA", "AZTEC", "BACK", "BALL", "BAND", "BANK", "BAR", "BARK", "BAT", "BATTERY", "BEACH", "BEAR", "BEAT", "BED", "BEIJING", "BELL", "BELT", "BERLIN", "BERMUDA", "BERRY", "BILL", "BLOCK", "BOARD", "BOLT", "BOMB", "BOND", "BOOM", "BOOT", "BOTTLE", "BOW", "BOX", "BRIDGE", "BRUSH", "BUCK", "BUFFALO", "BUG", "BUGLE", "BUTTON", "CALF", "CANADA", "CAP", "CAPITAL", "CAR", "CARD", "CARROT", "CASINO", "CAST", "CAT", "CELL", "CENTAUR", "CENTER", "CHAIR", "CHANGE", "CHARGE", "CHECK", "CHEST", "CHICK", "CHINA", "CHOCOLATE", "CHURCH", "CIRCLE", "CLIFF", "CLOAK", "CLUB", "CODE", "COLD", "COMIC", "COMPOUND", "CONCERT", "CONDUCTOR", "CONTRACT", "COOK", "COPPER", "COTTON", "COURT", "COVER", "CRANE", "CRASH", "CRICKET", "CROSS", "CROWN", "CYCLE", "CZECH", "DANCE", "DATE", "DAY", "DEATH", "DECK", "DEGREE", "DIAMOND", "DICE", "DINOSAUR", "DISEASE", "DOCTOR", "DOG", "DRAFT", "DRAGON", "DRESS", "DRILL", "DROP", "DUCK", "DWARF", "EAGLE", "EGYPT", "EMBASSY", "ENGINE", "ENGLAND", "EUROPE", "EYE", "FACE", "FAIR", "FALL", "FAN", "FENCE", "FIELD", "FIGHTER", "FIGURE", "FILE", "FILM", "FIRE", "FISH", "FLUTE", "FLY", "FOOT", "FORCE", "FOREST", "FORK", "FRANCE", "GAME", "GAS", "GENIUS", "GERMANY", "GHOST", "GIANT", "GLASS", "GLOVE", "GOLD", "GRACE", "GRASS", "GREECE", "GREEN", "GROUND", "HAM", "HAND", "HAWK", "HEAD", "HEART", "HELICOPTER", "HIMALAYAS", "HOLE", "HOLLYWOOD", "HONEY", "HOOD", "HOOK", "HORN", "HORSE", "HORSESHOE", "HOSPITAL", "HOTEL", "ICE", "ICE CREAM", "INDIA", "IRON", "IVORY", "JACK", "JAM", "JET", "JUPITER", "KANGAROO", "KETCHUP", "KEY", "KID", "KING", "KIWI", "KNIFE", "KNIGHT", "LAB", "LAP", "LASER", "LAWYER", "LEAD", "LEMON", "LEPRECHAUN", "LIFE", "LIGHT", "LIMOUSINE", "LINE", "LINK", "LION", "LITTER", "LOCH NESS", "LOCK", "LOG", "LONDON", "LUCK", "MAIL", "MAMMOTH", "MAPLE", "MARBLE", "MARCH", "MASS", "MATCH", "MERCURY", "MEXICO", "MICROSCOPE", "MILLIONAIRE", "MINE", "MINT", "MISSILE", "MODEL", "MOLE", "MOON", "MOSCOW", "MOUNT", "MOUSE", "MOUTH", "MUG", "NAIL", "NEEDLE", "NET", "NEW YORK", "NIGHT", "NINJA", "NOTE", "NOVEL", "NURSE", "NUT", "OCTOPUS", "OIL", "OLIVE", "OLYMPUS", "OPERA", "ORANGE", "ORGAN", "PALM", "PAN", "PANTS", "PAPER", "PARACHUTE", "PARK", "PART", "PASS", "PASTE", "PENGUIN", "PHOENIX", "PIANO", "PIE", "PILOT", "PIN", "PIPE", "PIRATE", "PISTOL", "PIT", "PITCH", "PLANE", "PLASTIC", "PLATE", "PLATYPUS", "PLAY", "PLOT", "POINT", "POISON", "POLE", "POLICE", "POOL", "PORT", "POST", "POUND", "PRESS", "PRINCESS", "PUMPKIN", "PUPIL", "PYRAMID", "QUEEN", "RABBIT", "RACKET", "RAY", "REVOLUTION", "RING", "ROBIN", "ROBOT", "ROCK", "ROME", "ROOT", "ROSE", "ROULETTE", "ROUND", "ROW", "RULER", "SATELLITE", "SATURN", "SCALE", "SCHOOL", "SCIENTIST", "SCORPION", "SCREEN", "SCUBA DIVER", "SEAL", "SERVER", "SHADOW", "SHAKESPEARE", "SHARK", "SHIP", "SHOE", "SHOP", "SHOT", "SINK", "SKYSCRAPER", "SLIP", "SLUG", "SMUGGLER", "SNOW", "SNOWMAN", "SOCK", "SOLDIER", "SOUL", "SOUND", "SPACE", "SPELL", "SPIDER", "SPIKE", "SPINE", "SPOT", "SPRING", "SPY", "SQUARE", "STADIUM", "STAFF", "STAR", "STATE", "STICK", "STOCK", "STRAW", "STREAM", "STRIKE", "STRING", "SUB", "SUIT", "SUPERHERO", "SWING", "SWITCH", "TABLE", "TABLET", "TAG", "TAIL", "TAP", "TEACHER", "TELESCOPE", "TEMPLE", "THEATER", "THIEF", "THUMB", "TICK", "TIE", "TIME", "TOKYO", "TOOTH", "TORCH", "TOWER", "TRACK", "TRAIN", "TRIANGLE", "TRIP", "TRUNK", "TUBE", "TURKEY", "UNDERTAKER", "UNICORN", "VACUUM", "VAN", "VET", "WAKE", "WALL", "WAR", "WASHER", "WASHINGTON", "WATCH", "WATER", "WAVE", "WEB", "WELL", "WHALE", "WHIP", "WIND", "WITCH", "WORM", "YARD"];

	socket.on('words', function(data) {
		allWords = data;
	});

	socket.on('host', function() {
		if (allWords.length < 25) {
			socket.emit('badWords');
		} else {
			var gameId = getRandomInt(9000) + 1000;
			while (gameId in GAME_LIST) {
				gameId = getRandomInt(9000) + 1000;
			}
			initBoard(gameId);
			socket.gameId = gameId;
			socket.emit('menuResponse');
		}
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