#! /usr/local/bin/node

var sys = require('sys'),
    exec = require('child_process').exec;

function puts(error, stdout, stderr) {
  sys.puts(stdout);

  // Pop off the stashed files on complete.
  exec('git stash pop -q');
  if (error) {
    sys.puts('grunt failed, aborting commit.');
    process.exit(1);
  } else {
    process.exit(0);
  }
}

// Stash all non-indexed files,
// to ensure tests only run against prospective commit files.
exec('git stash -q --keep-index');

// run all default grunt tasks
exec('grunt', puts);
