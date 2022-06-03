var inquirer = require('inquirer');

var subTasks = []
var isBeginning = true

var customTaskType = {
    type: 'list',
    name: 'customTaskType',
    message: 'Please choose the sub task type?',
    choices: [
        'command',
        // 'npmInstall',
        // 'gitForcePull',
        // 'npmRunBuild',
        // 'runQuasarPwaBuild',
        // 'runQuasarSsrPwaBuild'
    ]
};

var commandQuestions = [
    {
        type: 'input',
        name: 'command',
        message: 'Enter the command that you want to run ...'
    },
    {
        type: 'input',
        name: 'path',
        message: 'Enter the path that this command will run in ...'
    }
];

var askForAnotherSubCustomTask = [
    {
        type: 'confirm',
        name: 'addAgain',
        message: 'Want to enter another sub task task (just hit enter for YES)?',
        default: true
    }
];

function subTasksBuilder() {
    return new Promise((resolve, reject) => {
        function addTask() {
            inquirer.prompt(customTaskType).then(answers => {
                switch (answers.customTaskType) {
                    case 'command':
                        inquirer.prompt(commandQuestions).then(answers => {
                            subTasks.push({
                                "type": "command",
                                "command": answers.command,
                                "path": answers.path
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
                inquirer.prompt(askForAnotherSubCustomTask).then(answers => {
                    if (answers.addAgain) {
                        addTask();
                    } else {
                        resolve(subTasks)
                    }
                });
            }
        }

        addAnotherTask()

    })
}

module.exports = {
    subTasksBuilder
};