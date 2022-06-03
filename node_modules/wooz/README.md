# Wooz

A CLI application that allows you to automate your usual tasks!


## Table of Contents

1.  [Documentation](#documentation)
    1.  [Requirements](#requirements)
    2.  [Installation](#installation)
    3.  [How to use it?](#usage)
    4.  [How it works?](#howitworks)
    5.  [wooz.config.json](#wooz-config-json)
    6.  [wooz.tasks.json](#wooz-tasks-json)
    7.  [Commands](#commands)
    8.  [Questions](#questions)


2.  [Support](#support)
3.  [License](#license)


## [Documentation](#documentation)

<a name="documentation"></a>

### Requirements

<a name="requirements"></a>

1. First, make sure you have the latest version of [Node.js](https://nodejs.org) installed.
2. Wooz relies on [git](https://git-scm.com) and [quasar](https://quasar-framework.org) to run some tasks that depend on them, so make sure these tools are installed if you are planning to use these kinds of tasks, otherwise just ignore them!
3. **Tested only with git repositories that uses HTTP(S) URLs for their remote(not tested with SSH URLs).**

### Installation

<a name="installation"></a>

Run:

```shell
npm install wooz -g
```


### How to use it?

<a name="usage"></a>

Go to an empty folder that you have permissions to write into it and run: 

```shell
wooz run
```

### How it works

<a name="howitworks"></a>

Wooz needs two files in the directory that you run it within it, these files are `wooz.config.json` and `wooz.tasks.json`, so when you run it for the first time it will ask you to create these configurations and tasks files then it will be able to continue.

Simply you can consider Wooz as a webhooks interface on your server it will listen for a **POST** requests with the action that you specify and will run the tasks that you want.

When you run Wooz it will listen on the port that you specified to it, for example say you have a bitbucket repository and you want whenever you make a commit the code gets updated and build and deployed on your server, you can create a webhook in the repository settings on bitbucket with the following URL for example https://webhooks.yourdomain.com/the-action

Then Wooz will do the rest!

Of course, Wooz will work on localhost like for example `http://localhost:3131` and if you want it to be accessible from outside of your server you must create some kind of proxy, you can read [this article](https://www.digitalocean.com/community/tutorials/how-to-set-up-a-node-js-application-for-production-on-ubuntu-16-04) (please note that the example in this article uses an old version of Node.js) that talks about this.

> Note: Wooz only listens for the POST requests.


### wooz.config.json

<a name="wooz-config-json"></a>

Wooz uses this file to save its configurations, here is a sample of this file:

```json
{
	"port": 3131
}
```

You can create this file manually by using any text editor or you can let Wooz generates it for you, here is what every configuration means(currently Wooz has just one configuration option!):

- **port**: (Number) The port that Wooz will use so you can access it using this port like for example: `http://localhost:3131`

### wooz.tasks.json

<a name="wooz-tasks-json"></a>

Wooz uses this file to save the tasks, here is a sample of this file:

```json
[
	{
		"action": "RunQuasarSSR",
		"type": "QuasarSSR",
		"path": "/home/mohammed/MyTmp/11/quasar",
		"copyDistTo": "/home/mohammed/MyTmp/11/prod/ssr-dist-copy"
	},
	{
		"action": "RunQuasarPwa",
		"type": "QuasarPwa",
		"path": "/home/mohammed/MyTmp/11/quasar",
		"copyDistTo": "/home/mohammed/MyTmp/11/prod/pwa-dist-copy"
	},
	{
		"action": "RunHTML",
		"type": "HTML",
		"path": "/home/mohammed/MyTmp/11/html",
		"copyDistTo": "/home/mohammed/MyTmp/11/prod/html-copy",
		"exclude": ".git,node_modules"
	},
	{
		"action": "RunRepository",
		"type": "repository",
		"path": "/home/mohammed/MyTmp/11/repository"
	},
	{
		"action": "RunWebpack",
		"type": "webpack",
		"path": "/home/mohammed/MyTmp/11/webpack",
		"buildFolder": "build",
		"copyDistTo": "/home/mohammed/MyTmp/11/prod/dist-copy"
	},
	{
		"action": "RunNextJS",
		"type": "NextJS",
		"path": "/home/mohammed/MyTmp/11/NextJS"
	},
	{
		"action": "SomeTasks",
		"type": "custom",
		"subTasks": [
			{
				"type": "command",
				"command": "rm -rf deleteme",
				"path": "/home/mohammed/MyTmp/11/custom"
			},
			{
				"type": "command",
				"command": "git clone https://github.com/MohammedAl-Mahdawi/nosbackup.git",
				"path": "/home/mohammed/MyTmp/11/custom"
			}
		]
	}
]
```

You can create this file manually using any text editor or you can let Wooz generate it for you.

The tasks are self-explained, you can have as many tasks as you want, here is an explanation for these tasks:

- **QuasarSSR**: Wooz will do the following using this type of task:

    1. Run git to update the repository at the `path` that you specified and it will force the pull request so it will **ERASE** any local changes.
    2. Run `npm install` if Wooz found any changes in the `package.json` file.
    3. Run Quasar SSR PWA build.
    4. Copy `ssr-mat` to the path that you specified in `copyDistTo`.

- **QuasarPwa**: Wooz will do the following using this type of task:

    1. Run git to update the repository at the `path` that you specified and it will force the pull request so it will **ERASE** any local changes.
    2. Run `npm install` if Wooz found any changes in the `package.json` file.
    3. Run Quasar PWA build.
    4. Copy `pwa-mat` to the path that you specified in `copyDistTo`.

- **webpack**: Wooz will do the following using this type of task:

    1. Run git to update the repository at the `path` that you specified and it will force the pull request so it will **ERASE** any local changes.
    2. Run `npm install` if Wooz found any changes in the `package.json` file.
    3. Run `npm run build`.
    4. Copy the `buildFolder`(if no buildFolder specified then the buildFolder will be `dist`) to the path that you specified in `copyDistTo`.

- **NextJS**: Wooz will do the following using this type of task:

    1. Run git to update the repository at the `path` that you specified and it will force the pull request so it will **ERASE** any local changes.
    2. Run `npm install` if Wooz found any changes in the `package.json` file.
    3. Run `npm run build`.

- **HTML**: Wooz will do the following using this type of task:

    1. Run git to update the repository at the `path` that you specified and it will force the pull request so it will **ERASE** any local changes.
    2. Run `npm install` if it found `package.json` file and found any changes in the `package.json` file.
    3. Copy the folder content to the path that you specified in `copyDistTo` and exclude the folders that you specified in the `exclude` option(comma separated folder names).

- **repository**: Wooz will do the following using this type of task:

    1. Run git to update the repository at the `path` that you specified and it will force the pull request so it will **ERASE** any local changes.
    2. Run `npm install` if Wooz found any changes in the `package.json` file.

- **custom**: This is where you can construct your tasks, the `custom` task allows you to create sub-tasks, currently it only allows you to run command(s) sequentially, the command will run in the same order that they appear in it in the `wooz.tasks.json`, so in the above example the command `rm -rf deleteme` will run and finished then the command `git clone https://github.com/MohammedAl-Mahdawi/nosbackup.git` run.


### Commands

<a name="commands"></a>

```shell
  Usage: wooz [options] [command]

  CLI app to automate your usual tasks!

  Options:

    -V, --version     output the version number
    -h, --help        output usage information

  Commands:

    configurations|c  Reset the configurations
    tasks|t           Reset tasks
    run|r             Run, using the existing configurations and tasks, or create them if they do not exist.

```

For example, you can run:

```shell
wooz r
```
or
```shell
wooz run
```
To run Wooz and create the configurations and tasks files if they do not exist.


To create/recreate the configurations file run:

```shell
wooz c
```
or
```shell
wooz configurations
```

To create/recreate the tasks file run:

```shell
wooz t
```
or
```shell
wooz tasks
```

To get help run:

```
wooz -h
```
or
```
wooz --help
```

### Questions

<a name="questions"></a>

**How to daemonized, monitor and keep Wooz alive forever.**

There are a lot of tools, however, you can use [PM2](https://github.com/Unitech/PM2/) to achieve that.
1. First install PM2 by running `npm install pm2 -g`
2. Create `ecosystem.config.js` file in the folder that you specified for Wooz(must have write permissions) with the following content:

    ```
    module.exports = {
    apps: [{
        name: 'Wooz',
        script: 'wooz',
        cwd: '/path/to/this/folder/',
        args: 'r'
    }]
    };
    ```
    **Please replace `/path/to/this/folder/` with your folder path.**

3. Run `pm2 start ecosystem.config.js` in the same folder.
4. To stop and delete the process(undo the above step) you can run `pm2 delete Wooz`

## Support

<a name="support"></a>

This app built to run on Linux PCs/servers, so it may or may not work on your PC, please only report an issue if you run a Linux based operating system, unfortunately, I will not be able to test and reproduce the issue in order to fix it on the other platforms.

You are welcome to contribute code and provide pull requests for Wooz, also please feel free to suggest or request any features or enhancements.

## License

<a name="license"></a>

Copyright (c) 2018 [Mohammed Al-Mahdawi](https://al-mahdawi.com/)
Licensed under the **MIT** license.