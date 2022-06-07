const express = require('express');
const fse = require('fs-extra');
const bodyParser = require('body-parser');
const fs = require('fs');
var copy = require('recursive-copy');
var util = require('util');

var {
    npmRunBuild,
    runQuasarPwaBuild,
    runQuasarSsrPwaBuild,
    gitForcePull,
    getFileMd5,
    runSubTasks,
    npmInstall
} = require('./helpers');

function start() {
    const port = NosConfig.port

    var app = express();
    app.use(bodyParser.json());

    app.post('/:action', async function (req, res) {
        try {
            /**
             * Start log to the file
             * https://stackoverflow.com/a/33898010/3263601
             */
            var logFile = fs.createWriteStream('log.txt', { flags: 'w' });

            var logStdout = process.stdout;

            console.log = function () {
                logFile.write(util.format.apply(null, arguments) + '\n');
                logStdout.write(util.format.apply(null, arguments) + '\n');
            }
            console.error = console.log;
            /**
             * End log to the file
             */

            const task = NosTasks.find(x => x.action === req.params.action);

            if (task) {
                res.end();
                switch (task.type) {
                    case 'webpack':
                        console.log('Start webpack job!');
                        //First get the package.json file hash in order to check later if it will be updated or no
                        var beforeUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                        await gitForcePull(task)

                        var afterUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                        if (beforeUpdatePackageJsonHash !== afterUpdatePackageJsonHash) {
                            await npmInstall(task)
                        }

                        await npmRunBuild(task)

                        var buildFolder = task.buildFolder ? task.path + '/' + task.buildFolder : task.path + '/dist'

                        await fse.copy(buildFolder, task.copyDistTo)
                        console.log('End webpack job!');
                        break;
                    case 'NextJS':
                        console.log('Start NextJS job!');
                        //First get the package.json file hash in order to check later if it will be updated or no
                        var beforeUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                        await gitForcePull(task)

                        var afterUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                        if (beforeUpdatePackageJsonHash !== afterUpdatePackageJsonHash) {
                            await npmInstall(task)
                        }

                        await npmRunBuild(task)

                        console.log('End NextJS job!');
                        break;
                    case 'QuasarPwa':
                        console.log('Start QuasarPwa job!');

                        var beforeUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                        await gitForcePull(task)

                        var afterUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                        if (beforeUpdatePackageJsonHash !== afterUpdatePackageJsonHash) {
                            await npmInstall(task)
                        }
                        await runQuasarPwaBuild(task)
                        await fse.copy(task.path + '/dist/pwa-mat', task.copyDistTo)
                        console.log('End QuasarPwa job!');
                        break;
                    case 'QuasarSSR':
                        console.log('Start QuasarSSR job!');

                        var beforeUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                        await gitForcePull(task)

                        var afterUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                        if (beforeUpdatePackageJsonHash !== afterUpdatePackageJsonHash) {
                            await npmInstall(task)
                        }
                        await runQuasarSsrPwaBuild(task)

                        await fse.copy(task.path + '/dist/ssr-mat', task.copyDistTo)

                        if (beforeUpdatePackageJsonHash !== afterUpdatePackageJsonHash) {
                            let obj = { path: task.copyDistTo, action: `${task.action}-SSR` }

                            await npmInstall(obj)
                        }

                        console.log('End QuasarSSR job!');
                        break;
                    case 'HTML':
                        console.log('Start HTML job!');

                        var exists = await fse.pathExists(`${task.path}/package.json`)

                        if (exists) {
                            var beforeUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                            await gitForcePull(task)

                            var afterUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                            if (beforeUpdatePackageJsonHash !== afterUpdatePackageJsonHash) {
                                await npmInstall(task)
                            }
                        } else {
                            await gitForcePull(task)
                        }

                        await copy(task.path, task.copyDistTo, {
                            filter: function (path) {
                                return task.exclude.split(",").map(i => i.trim()).every(i => !path.includes(i))
                            },
                            overwrite: true,
                            dot: true
                        })
                        console.log('End HTML job!');
                        break;
                    case 'repository':
                        console.log('Start repository job!');
                        var beforeUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                        await gitForcePull(task)

                        var afterUpdatePackageJsonHash = await getFileMd5(`${task.path}/package.json`)

                        if (beforeUpdatePackageJsonHash !== afterUpdatePackageJsonHash) {
                            await npmInstall(task)
                        }
                        console.log('End repository job!');
                        break;
                    case 'custom':
                        console.log('Start custom job for action: ' + task.action);

                        await runSubTasks(task)

                        console.log('End custom job for action: ' + task.action);
                        break;
                }
            } else {
                res.status(404).send(); 
            }
            console.log('End all!');
        } catch (e) {
            res.status(500).send();
        }
    });

    app.listen(port, () => {
        console.log(`Started up at port ${port}`);
    });

}

module.exports = {
    start
};
