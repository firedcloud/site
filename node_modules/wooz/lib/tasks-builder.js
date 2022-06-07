var inquirer = require('inquirer');
const { subTasksBuilder } = require('./subTasksBuilder')

var tasks = []
var isBeginning = true

var taskType = {
    type: 'list',
    name: 'taskType',
    message: 'Please choose the task type?',
    choices: ['QuasarSSR', 'QuasarPwa', 'HTML', 'repository', 'webpack', 'NextJS', 'custom']
};

var repositoryQuestions = [
    {
        type: 'input',
        name: 'action',
        message: 'Enter the action that will trigger this task ...'
    },
    {
        type: 'input',
        name: 'path',
        message: 'Enter path ...'
    }
];

var customQuestions = [
    {
        type: 'input',
        name: 'action',
        message: 'Enter the action that will trigger this task ...'
    }
];

var HTMLQuestions = [
    {
        type: 'input',
        name: 'action',
        message: 'Enter the action that will trigger this task ...'
    },
    {
        type: 'input',
        name: 'path',
        message: 'Enter the repository path ...'
    },
    {
        type: 'input',
        name: 'copyDistTo',
        message: 'Enter the path that you want to copy the dist folder to ...'
    },
    {
        type: 'input',
        name: 'exclude',
        message: 'Enter a comma separated list for the folders that you want to exclude(.git, node_modules) ...'
    }
];

var QuasarPwaQuestions = [
    {
        type: 'input',
        name: 'action',
        message: 'Enter the action that will trigger this task ...'
    },
    {
        type: 'input',
        name: 'path',
        message: 'Enter the repository path ...'
    },
    {
        type: 'input',
        name: 'copyDistTo',
        message: 'Enter the path that you want to copy the dist folder to ...'
    }
];

var QuasarSSRQuestions = [
    {
        type: 'input',
        name: 'action',
        message: 'Enter the action that will trigger this task ...'
    },
    {
        type: 'input',
        name: 'path',
        message: 'Enter the repository path ...'
    },
    {
        type: 'input',
        name: 'copyDistTo',
        message: 'Enter the path that you want to copy the dist folder to ...'
    }
];

var webpackQuestions = [
    {
        type: 'input',
        name: 'action',
        message: 'Enter the action that will trigger this task ...'
    },
    {
        type: 'input',
        name: 'path',
        message: 'Enter the repository path ...'
    },
    {
        type: 'input',
        name: 'buildFolder',
        message: 'Enter the build folder name ...'
    },
    {
        type: 'input',
        name: 'copyDistTo',
        message: 'Enter the path that you want to copy the dist folder to ...'
    }
];

var nextJSQuestions = [
    {
        type: 'input',
        name: 'action',
        message: 'Enter the action that will trigger this task ...'
    },
    {
        type: 'input',
        name: 'path',
        message: 'Enter the repository path ...'
    }
];

var askForAnotherTask = [
    {
        type: 'confirm',
        name: 'addAgain',
        message: 'Want to enter another task (just hit enter for YES)?',
        default: true
    }
];

function tasksBuilder() {
    return new Promise((resolve, reject) => {
        function addTask() {
            inquirer.prompt(taskType).then(answers => {
                switch (answers.taskType) {
                    case 'QuasarSSR':
                        inquirer.prompt(QuasarSSRQuestions).then(answers => {
                            tasks.push({
                                "action": answers.action,
                                "type": "QuasarSSR",
                                "path": answers.path,
                                "copyDistTo": answers.copyDistTo
                            })
                            addAnotherTask()
                        });
                        break;
                    case 'HTML':
                        inquirer.prompt(HTMLQuestions).then(answers => {
                            tasks.push({
                                "action": answers.action,
                                "type": "HTML",
                                "path": answers.path,
                                "copyDistTo": answers.copyDistTo,
                                "exclude": answers.exclude,
                            })
                            addAnotherTask()
                        });
                        break;
                    case 'repository':
                        inquirer.prompt(repositoryQuestions).then(answers => {
                            tasks.push({
                                "action": answers.action,
                                "type": "repository",
                                "path": answers.path
                            })
                            addAnotherTask()
                        });
                        break;
                    case 'webpack':
                        inquirer.prompt(webpackQuestions).then(answers => {
                            tasks.push({
                                "action": answers.action,
                                "type": "webpack",
                                "path": answers.path,
                                "buildFolder": answers.buildFolder,
                                "copyDistTo": answers.copyDistTo
                            })
                            addAnotherTask()
                        });
                        break;
                    case 'NextJS':
                        inquirer.prompt(nextJSQuestions).then(answers => {
                            tasks.push({
                                "action": answers.action,
                                "type": "NextJS",
                                "path": answers.path
                            })
                            addAnotherTask()
                        });
                        break;
                    case 'QuasarPwa':
                        inquirer.prompt(QuasarPwaQuestions).then(answers => {
                            tasks.push({
                                "action": answers.action,
                                "type": "QuasarPwa",
                                "path": answers.path,
                                "copyDistTo": answers.copyDistTo
                            })
                            addAnotherTask()
                        });
                        break;
                    case 'custom':
                        inquirer.prompt(customQuestions).then(
                            async answers => {
                            var subTasks = await subTasksBuilder()

                            tasks.push({
                                "action": answers.action,
                                "type": "custom",
                                "subTasks": subTasks
                            })

                            addAnotherTask()
                        });
                        break;
                }

            });
        }

        function addAnotherTask() {
            if (isBeginning) {
                addTask();
                isBeginning = false
            } else {
                inquirer.prompt(askForAnotherTask).then(answers => {
                    if (answers.addAgain) {
                        addTask();
                    } else {
                        resolve(tasks)
                    }
                });
            }
        }

        addAnotherTask()

    })
}

module.exports = {
    tasksBuilder
};