<p align="center">
	<a href="http://cjpatoilo.com/omfg"><img width="100%" src="http://cjpatoilo.com/omfg/images/thumbnail.jpg" alt="OMFG | The easy way to start open source projects."></a>
</p>

> The easy way to start open source projects.

[![Build Status](https://travis-ci.org/cjpatoilo/omfg.svg?branch=master)](https://travis-ci.org/cjpatoilo/omfg)
[![Dependencies Status](https://david-dm.org/cjpatoilo/omfg.svg)](https://travis-ci.org/cjpatoilo/omfg)
[![npm version](https://badge.fury.io/js/omfg.svg)](https://badge.fury.io/js/omfg)


## Why it's awesome?

OMFG is the easy way to start open source projects. Hope you enjoy!


## Install

```
$ npm install omfg
```


## Usage

```
$ omfg --help

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

```


## Contributing

Want to contribute? Follow these [recommendations](https://github.com/cjpatoilo/omfg/blob/master/.github/contributing.md).


## License

Designed with ♥ by [CJ Patoilo](https://cjpatoilo.com/). Licensed under the [MIT License](https://cjpatoilo.mit-license.org/).
