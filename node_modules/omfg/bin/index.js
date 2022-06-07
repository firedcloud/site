#!/usr/bin/env node

/**
 * Module dependencies
 */
const https = require('https');
const child = require('child_process');
const fs = require('fs');
const omfg = require('commander');
const colors = require('colors');
const version = require('./../package.json').version;


/**
 * Helpers
 */

 // GET
const Request = (url, file) => {

	// Normalize hostname and pathname
	let path = url.split('/');
	let hostname = path[0];
	path.shift();
	path = `/${path.join('/')}`;

	// Request, response and create file
	https.get({ hostname: hostname, path: path }, (response) => {
		return response.on('data', (response) => {
			return fs.writeFile(`${repository}/${file}`, response);
		});
	});
}


/**
 * App
 */
omfg
	.version(version)
	.usage('<directory> [<options>]')
	.option('-h, --help', 'Display help information')
	.option('-v, --version', 'Output OMFG version')
	.option('-l, --license <opt>', 'Set license')
	.option('-i, --ignore <opt>', 'Set .gitignore')
	.option('-c, --ci <opt>', 'Set continue')
	.option('--no-template', 'Disallow .github templates')
	.option('--no-editor', 'Disallow .editorconfig')
	.option('--no-readme', 'Disallow readme.md')
	.option('--no-license', 'Disallow readme.md')
	.option('--no-ignore', 'Disallow readme.md')
	.parse(process.argv);


/**
 * Statements
 */
if (process.argv[0].match(/node/i)) var repository = process.argv[2];
else var repository = process.argv[1];
const source = 'raw.githubusercontent.com/cjpatoilo/omfg/master/src';
const info = `
  Usage:

    $ omfg <directory> [<options>]

  Options:

    -h, --help              Display help information
    -v, --version           Output OMFG version
    -l, --license           Set license
    -i, --ignore            Set .gitignore
    -c, --ci                Set continue
    --no-template           Disallow .github templates
    --no-editor             Disallow .editorconfig
    --no-readme             Disallow readme.md
    --no-license            Disallow readme.md
    --no-ignore             Disallow readme.md

  Examples:

    $ omfg myApp
    $ omfg sample --ignore android
    $ omfg www --license apache-2.0

  Default when no arguments:

    $ omfg <directory> --license mit --ignore node --ci travis
`;


/**
 * Help information
 */
if (!omfg.help) {
	console.log(info);
	return;
}


/**
 * Without any parameters
 */
if (!process.argv.slice(2).length) {
	console.log(info.red);
	return;
}


/**
 * Without directory
 */
if (repository.indexOf('--') !== -1) {
	console.log(`\n[ERROR] Set the directory name:\n\n   $ omfg <directory> [<options>]\n`.red);
	return;
}


/**
 * Create directory
 */
if (repository) {
	child.exec(`mkdir ${repository}`);
}



/**
 * Create readme.md
 */
if (repository) {
	let url = `${source}/readme/readme`;
	let file = `readme.md`;
	Request(url, file);
}


/**
 * Create license
 */
if (typeof omfg.license === 'string') {
	let url = `${source}/licenses/${omfg.license}`;
	let file = `license`;
	Request(url, file);
}
else {
	let url = `${source}/licenses/mit`;
	let file = `license`;
	Request(url, file);
}


/**
 * Create .gitignore
 */
if (typeof omfg.ignore === 'string') {
	let url = `www.gitignore.io/api/${omfg.ignore}`;
	let file = `.gitignore`;
	Request(url, file);
}
else {
	let url = `www.gitignore.io/api/node`;
	let file = `.gitignore`;
	Request(url, file);
}


/**
 * Create .travis.yml
 */
if (omfg.ci) {
	let url = `${source}/ci/${omfg.ci}`;
	let file = `.${omfg.ci}.yml`;
	Request(url, file);
}
else {
	let url = `${source}/ci/travis`;
	let file = `.travis.yml`;
	Request(url, file);
}


/**
 * Create GitHub Template
 */
if (omfg.template) {
	let url = `${repository}/.github`;
	child.exec(`mkdir ${url}`)
	child.exec(`touch ${url}/contributing ${url}/issue_template ${url}/pull_request_template`)
}


/**
 * Create .editorconfig
 */
if (omfg.editor) {
	let url = `${source}/misc/editorconfig`;
	let file = `.editorconfig`;
	Request(url, file);
}
