// read a file and return contents as a string
const fs = require('fs');
function read(f) {
  t = fs.readFileSync(f, 'utf8', (err,txt) => {
    if (err) throw err;
    console.log("file read. length of file = $(text.length)");
  });
  return t;
}

exports.StringFromFile = read;
