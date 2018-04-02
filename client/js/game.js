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

var color = function(piece) {
    if (piece === Piece.RED) {
        return 'rgb(232, 60, 64)';
    } else if (piece === Piece.BLUE) {
        return 'rgb(35, 142, 177)';
    } else if (piece === Piece.NEUTRAL) {
        return 'rgb(216, 204, 152)';
    } else if (piece === Piece.ASSASSIN){
        return 'rgb(71, 69, 64)';
    } else {
        return 'white';
    }
}

var breakUpLongWord = function(ctx, word) {
	var subWords = [];
	var times = Math.ceil(ctx.measureText(word).width / CARD_WIDTH);
	var subWordLength = Math.ceil(word.length / times);
	for (var i = 1; i <= times; i++) {
		if (i != times) {
			subWords.push(word.substring((i - 1) * subWordLength, i * subWordLength) + "-");
		} else {
			subWords.push(word.substring((i - 1) * subWordLength, word.length));
		}
	}
	return subWords;
}

var breakUpPhrase = function(ctx, word) {
	var subWords = [];
	var words = word.split(" ");
	if (ctx.measureText(word).width > CARD_WIDTH || words.length > 1) {
		var subphrase = "";
		for (var i = 0; i < words.length; i++) {
			var subWord = words[i];
			if (ctx.measureText(subWord).width > CARD_WIDTH) {
				if (subphrase !== "") {
					subWords.push(subphrase);
					subphrase = "";
				}
				var broken = breakUpLongWord(ctx, subWord);
				for (var brokenWord of broken) {
					subWords.push(brokenWord);
				}
			} else {
				if (ctx.measureText(subphrase + subWord + " ").width > CARD_WIDTH) {
					subWords.push(subphrase);
					subphrase = "";
					i--;
				} else {
					subphrase += subWord + " ";
				}
			}
		}
		if (subphrase !== "") {
			subWords.push(subphrase);
		}
	} else {
		subWords.push(word);
	}
	return subWords;
}

var ctx = document.getElementById('ctx').getContext('2d');
var ctxGameId = document.getElementById('ctx-gameId').getContext('2d');
ctx.font = FONT_SIZE + 'px ' + FONT_STYLE;
ctxGameId.font = (FONT_SIZE + 10) + 'px ' + FONT_STYLE;
var getFontHeight = function() {
	return ctx.measureText('M').width;
}
var socket = io();
var spyMaster = false;
var drawBoard = function(board, spyMaster) {
	ctx.clearRect(0, 0, WIDTH, HEIGHT);
	ctxGameId.fillStyle = 'black';
	ctxGameId.fillText('Game ID: ' + board.gameId, WIDTH / 2 - ctxGameId.measureText('Game Id: ' + board.gameId).width / 2, HEIGHT * 0.05, );
	for (var r = 0; r < SIDE; r++) {
		for (var c = 0; c < SIDE; c++) {
			ctx.fillStyle = 'black';
			ctx.strokeRect(IN_BETWEEN + (CARD_WIDTH + IN_BETWEEN) * c, IN_BETWEEN + (CARD_HEIGHT + IN_BETWEEN) * r, CARD_WIDTH, CARD_HEIGHT);
			var cover;
			if (spyMaster) {
				cover = board.answer[r][c];
			} else {
				cover = board.covered[r][c];
			}
			ctx.fillStyle = color(cover);
			ctx.fillRect(IN_BETWEEN + (CARD_WIDTH + IN_BETWEEN) * c, IN_BETWEEN + (CARD_HEIGHT + IN_BETWEEN) * r, CARD_WIDTH, CARD_HEIGHT);
			ctx.fillStyle = 'black';
			var word = board.words[r][c];
			var subWords = breakUpPhrase(ctx, word);
			var times = subWords.length;
			while (getFontHeight() * times > CARD_HEIGHT) {
				var oldFontSize = parseInt(ctx.font.substring(0, ctx.font.indexOf('px ')));
				ctx.font = (oldFontSize - 1) + ctx.font.substring(ctx.font.indexOf('px '), ctx.font.length);
				subWords = breakUpPhrase(ctx, word);
				times = subWords.length;	
			}
			var count = 0;
			for (var i = -(times / 2) + 1; i <= times / 2; i++) {
				var y = IN_BETWEEN + (CARD_HEIGHT + IN_BETWEEN) * r + CARD_HEIGHT / 2 + i * getFontHeight();
				ctx.fillText(subWords[count], IN_BETWEEN + (CARD_WIDTH + IN_BETWEEN) * c + CARD_WIDTH / 2 - ctx.measureText(subWords[count]).width / 2, y);
				count++;
			}
		}
	}
}
socket.on('update', function(data) {
	var board = data;
	drawBoard(board, false);
});

socket.on('showSpyMaster', function(data) {
	var board = data;
	drawBoard(board, true);
	spyMaster = true;
});

document.getElementById('ctx').addEventListener('click', function(event) {
	if (!spyMaster) {
		var x = event.clientX - CANVAS_SIDE_PADDING;
		var y = event.clientY - CANVAS_SIDE_PADDING;

	    socket.emit('click', [x, y]);
	}
}, false);

var hostGame = document.getElementById('hostGame');
var gameId = document.getElementById('gameId');
var joinPlayer = document.getElementById('joinPlayer');
var joinSpyMaster = document.getElementById('joinSpyMaster');
var menuDiv = document.getElementById('menuDiv');
var gameDiv = document.getElementById('gameDiv');

hostGame.onclick = function() {
	socket.emit('host');
};

joinPlayer.onclick = function() {
	socket.emit('joinPlayer', gameId.value);
};

joinSpyMaster.onclick = function() {
	socket.emit('joinSpyMaster', gameId.value);
}

socket.on('menuResponse', function() {
	menuDiv.style.display = 'none';
	gameDiv.style.display = 'inline-block';
});

socket.on('badMenuResponse', function() {
	alert('Invalid Game ID');
});

socket.on('badSpyMasterMenuResponse', function() {
	alert('There are already 2 spymasters.');
});

var h = document.getElementById("H");
h.onclick = function() {
	alert("NO");
};