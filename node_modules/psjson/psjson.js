var exec = require('child_process').exec;
var util = require('util');

// convert ps command output to json
function toJson(output) {
  var ret = {};
  ret.headers = null;
  ret.rows = [];

  var lines = output.split('\n');
  for (var i=0; i<lines.length; i++){
    if (lines[i] === '') continue;
    var cols = lines[i].trim().split(/\s+/);    
    if (!ret.headers) {
      ret.headers = cols;
    } else {
      var row = {};
      for (var j=0; j<ret.headers.length; j++) {
        var header = ret.headers[j];
        row[header] = j === (ret.headers.length -1) ? cols.splice(j, cols.length).join(' ') : cols[j];
      }
      ret.rows.push(row);
    }
  }

  return ret;  
};

// main 'ps' function, cmd is expected to 'ps <args>', defaults to 'ps -eaf'
function ps(cmd, callback) {
  if (typeof cmd === 'function') {
    callback = cmd;
    cmd = undefined;
  }
  cmd = cmd ? cmd : 'ps -eaf';
  exec(cmd, function(err, stdout, stderr) {
    if(err) return callback("Error running command: " + cmd + " - " + err + " stderr: " + stderr);
    var js = toJson(stdout);
    return callback(undefined, js);     
  });
};

exports.ps = ps;

if(!module.parent) {
  ps(function (err, data) {
    if(err) console.error(err);
    console.log(JSON.stringify(data));
  });
}

