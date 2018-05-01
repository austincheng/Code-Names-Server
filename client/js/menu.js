var allWords = [];
var socket = io()
function commaFileSelect(evt) {
	allWords = [];
	var files = evt.target.files;

	var output = [];
	for (var i = 0, f; f = files[i]; i++) {
		output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ')', '</li>');
		var reader = new FileReader();
		reader.onload = function(e) {
			var item = e.target.result;
			var words = item.split(',')
			for (var i = 0; i < words.length; i++) {
				words[i] = removeSpaces(words[i]);
				words[i] = words[i].toUpperCase();
			}
			allWords = allWords.concat(words);
			socket.emit('words', allWords);
		};
		reader.readAsText(f);
	}
	document.getElementById('commaList').innerHTML = '<ul>' + output.join('') + '</ul>';
}

document.getElementById('commaFiles').addEventListener('change', commaFileSelect, false);

function lineFileSelect(evt) {
	allWords = [];
	var files = evt.target.files;

	var output = [];
	for (var i = 0, f; f = files[i]; i++) {
		output.push('<li><strong>', escape(f.name), '</strong> (', f.type || 'n/a', ')', '</li>');
		var reader = new FileReader();
		reader.onload = function(e) {
			var item = e.target.result;
			var words = item.split('\n')
			for (var i = 0; i < words.length; i++) {
				words[i] = removeSpaces(words[i]);
				words[i] = words[i].toUpperCase();
			}
			allWords = allWords.concat(words);
			socket.emit('words', allWords);
		};
		reader.readAsText(f);
	}
	document.getElementById('lineList').innerHTML = '<ul>' + output.join('') + '</ul>';
}

document.getElementById('lineFiles').addEventListener('change', lineFileSelect, false);

function removeSpaces(string) {
    while(string.indexOf(' ') === 0) {
        string = string.substr(1);
    }
    while(string[string.length - 1] === ' ') {
        string = string.substr(0, string.length - 1);
    }
    return string;
}