
let inquirer = require('inquirer')

module.exports = {
    questions: [
        {
            type:'confirm',
            message:'Want to enable cors?',
            name:'cors'
        },
        {
            type:'checkbox',
            message:'Configure BodyParser for ...',
            name:'parsing',
            choices:['json', 'urlEncoded']
        }
    ]
}