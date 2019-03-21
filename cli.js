#!/usr/bin/env node

const program = require('commander');
const fs = require('fs');
const os = require('os');
const exec = require('child_process').exec;
const chalk = require("chalk")
const {prompt} = require('inquirer')
const {questions} = require('./questions')
const logSymbols = require('log-symbols')
const ora = require('ora')
const figlet = require('figlet')

program.version('0.0.1').description('A simple utility to bootstrap your next express server')


program.command('init <dirname>').alias('i').description('create a new directory and install required packages').action((dirname) => {
    console.log(figlet.textSync('Rest-Easy'))
    if (fs.existsSync(dirname)) {
        console.log(chalk.red('Error, selected destination already exists'))
        return; 
    }
    fs.mkdirSync(dirname);
    exec(`cd ${dirname} && npm init --yes`, (error) => {
        // if (fs.existsSync(`./${dirname}`)) {
        //     package = require(`./${dirname}/package.json`)
        // } else {
        //     package = require(`${dirname}/package.json`)
        // }
        // console.log(package)
        prompt(questions).then(responses => {
            if (responses.cors) {
                exec(`cd ${dirname} && npm i cors`)
            }
            if (responses.debug) {
                exec(`cd ${dirname} && npm i morgan`)
            }
                let installSpinner = ora('Installing required packages').start()
                exec(`cd ${dirname} && npm i express body-parser`, (error) => {
                    installSpinner.stopAndPersist({text:'Packages installed', symbol:logSymbols.success});
                    let writingSpinner = ora("Writing your new server's configuration").start()
                    fs.writeFileSync(`${dirname}/app.js`, "const express = require('express')\nconst bodyParser = require('body-parser')\n")
                    if (responses.cors)
                        fs.appendFileSync(`${dirname}/app.js`, "const cors = require('cors')\n")
                    if (responses.debug)
                        fs.appendFileSync(`${dirname}/app.js`, "const morgan = require('morgan')\n")
                    fs.appendFileSync(`${dirname}/app.js`, "\nlet app = express()\n")
                    if (responses.parsing.indexOf("json") > -1) {
                        fs.appendFileSync(`${dirname}/app.js`, "app.use(bodyParser.json())\n")
                    }
                    if (responses.parsing.indexOf("urlEncoded") > -1) {
                        fs.appendFileSync(`${dirname}/app.js`, "app.use(bodyParser.urlencoded({extended:true}))\n")
                    }
                    if (responses.debug) {
                        fs.appendFileSync(`${dirname}/app.js`, "app.use(morgan('dev'))")
                    }
                    fs.appendFileSync(`${dirname}/app.js`, "\n\napp.listen(4000, () => console.log('listening on port 4000'))")
                    writingSpinner.stopAndPersist({text:'Files written', symbol:logSymbols.success})
                    console.log("Everything is set up")
                    console.log(`cd ${dirname}`)
                    console.log('node app.js')
                    console.log("enjoy")
                })
        })
    });
    
})

program.parse(process.argv)