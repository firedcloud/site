const fs = require('fs');
var spawn = require('child_process').spawn;
var crypto = require('crypto');
var moment = require('moment');

function npmRunBuild(obj) {
    return new Promise((resolve, reject) => {
        console.log('Start npmRunBuild')

        var webpack = spawn('npm', [
            'run',
            'build',
        ], { cwd: obj.path });

        webpack.on('exit', function () {
            console.log('npmRunBuild For ' + obj.action + ' Completed!')
            resolve()
        })
            .on('error', function (err) {
                console.log(err)
                reject(err)
            });
    })
}

function npmInstall(obj) {
    return new Promise((resolve, reject) => {
        console.log('Start npmInstall')

        var quasar = spawn('npm', [
            'install'
        ], { cwd: obj.path });

        quasar.on('exit', function () {
            console.log('npmInstall For ' + obj.action + ' Completed!')
            resolve()
        })
            .on('error', function (err) {
                console.log(err)
                reject(err)
            });
    })
}

function getFileMd5(file) {
    return new Promise((resolve, reject) => {
        console.log('Start getFileMd5')

        fs.createReadStream(file).
            pipe(crypto.createHash('md5').setEncoding('hex')).
            on('error', err => {
                console.log(err)
                reject(err)
            }).
            on('finish', function () {
                console.log('getFileMd5 For ' + file + ' Completed!')
                resolve(this.read())//the hash
            })
    })
}

function runQuasarPwaBuild(obj) {
    return new Promise((resolve, reject) => {
        console.log('Start runQuasarPwaBuild')

        var quasar = spawn('quasar', [
            'build',
            '-m',
            'pwa',
        ], { cwd: obj.path });

        quasar.on('exit', function () {
            console.log('runQuasarPwaBuild For ' + obj.action + ' Completed!')
            resolve()
        })
            .on('error', function (err) {
                console.log(err)
                reject(err)
            });
    })
}

function runQuasarSsrPwaBuild(obj) {
    return new Promise((resolve, reject) => {
        console.log('Start runQuasarSsrPwaBuild')

        var quasar = spawn('quasar', [
            'build',
            '-m',
            'ssr',
        ], { cwd: obj.path });

        quasar.on('exit', function () {
            console.log('runQuasarSsrPwaBuild For ' + obj.action + ' Completed!')
            resolve()
        })
            .on('error', function (err) {
                console.log(err)
                reject(err)
            });
    })
}

function gitPull(obj) {
    return new Promise((resolve, reject) => {
        console.log('Start gitPull')

        var gitP = spawn('git', [
            'pull',
        ], { cwd: obj.path });

        gitP.on('exit', function () {
            console.log('gitPull For ' + obj.action + ' Completed!')
            resolve()
        })
            .on('error', function (err) {
                console.log(err)
                reject(err)
            });
    })
}

function gitForcePull(obj) {
    return new Promise((resolve, reject) => {
        console.log('Start gitForcePull')

        var gitFetch = spawn('git', [
            'fetch',
            '--all'
        ], { cwd: obj.path });

        gitFetch.on('exit', function () {
            var gitReset = spawn('git', [
                'reset',
                '--hard',
                'origin/master'
            ], { cwd: obj.path });

            gitReset.on('exit', function () {
                console.log('gitForcePull For ' + obj.action + ' Completed!')
                resolve()
            })
                .on('error', function (err) {
                    console.log(err)
                    reject(err)
                });

        })
            .on('error', function (err) {
                console.log(err)
                reject(err)
            });
    })
}

function gitPullWithHardReset(obj) {
    return new Promise((resolve, reject) => {
        console.log('Start gitPullWithHardReset')

        var gitReset = spawn('git', [
            'reset',
            '--hard',
            'origin/master'
        ], { cwd: obj.path });

        gitReset.on('exit', function () {
            var gitPull = spawn('git', [
                'pull'
            ], { cwd: obj.path });

            gitPull.on('exit', function () {
                console.log('gitPullWithHardReset For ' + obj.action + ' Completed!')
                resolve()
            })
                .on('error', function (err) {
                    console.log(err)
                    reject(err)
                });

        })
            .on('error', function (err) {
                console.log(err)
                reject(err)
            });
    })
}

function sequentialIterationWithPromises(tasks, cb = null) {
    let promise = tasks.reduce((prev, task) => {
        return prev.then(() => {
            return task();
        });
    }, Promise.resolve());

    promise.then(() => {
        //All tasks completed
        if (cb instanceof Function) {
            cb()
        }
    });
}

function handleCommandSubTask(subTask) {
    return new Promise((resolve, reject) => {
        console.log('Start running command: ' + subTask.command)

        //Convert the string to command in subTask.command
        let cmdAsArray = subTask.command.split(" ").map(i => i.trim())

        //Return the first element from cmdAsArray and remove it from the array itself
        let command = cmdAsArray.shift();

        //run the spawn
        var excCmd = spawn(command, cmdAsArray, { cwd: subTask.path });

        excCmd.on('exit', function () {
            console.log('Command ' + subTask.command + ' executed!')
            resolve()
        })
            .on('error', function (err) {
                console.log(err)
                reject()
            });
    });
}

function runSubTasks(mainTask) {
    return new Promise((resolve, reject) => {
        console.log('Start subTasks')

        var subTasksPromises = mainTask.subTasks.map(t => {
            switch (t.type) {
                case 'command':
                    return handleCommandSubTask.bind(null, t)
                    break;
            }
        })

        sequentialIterationWithPromises(subTasksPromises, () => {
            console.log('SubTasks process for ' + mainTask.action + ' completed at: ' + moment().format('YYYY-MM-DD-HHmm'))
            resolve()
        })
    });
}

module.exports = {
    npmRunBuild,
    runQuasarPwaBuild,
    runQuasarSsrPwaBuild,
    gitPull,
    gitForcePull,
    gitPullWithHardReset,
    getFileMd5,
    runSubTasks,
    npmInstall,
    sequentialIterationWithPromises
};