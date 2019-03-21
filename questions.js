
let inquirer = require('inquirer')

module.exports = {
    questions: [
        {
            type:'confirm',
            message:'Want to enable cors?',
            name:'cors'
        },
        {
            type:'confirm',
            message:'Want to enable logging using morgan?',
            name:'debug'
        },
        {
            type:'checkbox',
            message:'Configure BodyParser for ...',
            name:'parsing',
            choices:['json', 'urlEncoded']
        },
    ]
}