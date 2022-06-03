var inquirer = require('inquirer');

var configQuestions = [
    {
        type: 'input',
        name: 'port',
        default: 3131,
        message: 'Enter the port number ...',
        filter: Number
    }
];

function configBuilder() {
    return new Promise((resolve, reject) => {
        inquirer.prompt(configQuestions).then(answers => {
            resolve(answers)
        });
        
    })
}

module.exports = {
    configBuilder
};