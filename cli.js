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

program.version('1.0.2').description('A simple utility to bootstrap your next express server')


program.command('init <dirname>').alias('i').description('create a new directory and install required packages').action((dirname) => {
    console.log(figlet.textSync('Express-Easy-Api'))
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
                    fs.appendFileSync(`${dirname}/app.js`, "\n\nmodule.exports=app")
                    fs.writeFileSync(`${dirname}/server.js`, "const app = require('./app.js')\n")
                    fs.appendFileSync(`${dirname}/server.js`, "const fs = require('fs')\n")
                    fs.appendFileSync(`${dirname}/server.js`, "if (fs.existsSync(\"./routes.json\")) {\nconst routes = require(\"./routes.json\")\nroutes.routes.map((route) => {\nlet routen = require(route.name)\napp.use(`/${route.url}`, routen)\n})\n}\n")
                    fs.appendFileSync(`${dirname}/server.js`, "\napp.listen(4000, () => console.log('listening'))")
                    writingSpinner.stopAndPersist({text:'Files written', symbol:logSymbols.success})
                    console.log("Everything is set up")
                    console.log(`cd ${dirname}`)
                    console.log('node server.js')
                    console.log("enjoy")
                })
        })
    });
    
})

program.command("addRoute <name> <url>").alias("a").description("Add a route named <name> mapped to the url /<url>").action((name, url) => {
    console.log("current dir is" + process.cwd())
    if (!fs.existsSync('./server.js') || !fs.existsSync("./app.js")) {
        console.log(chalk.red('Please use this command in a directory created with express-easy-api'))
        return;
    }
    if (fs.existsSync(`./routes/${name}.js`)) {
        console.log(chalk.red("Error: a file with this name already exists the routes directory"))
        return;
    }
    console.log(figlet.textSync('Express-Easy-Api'))
    let creationSpinner = ora("Creating necessary files").start();
    if (!fs.existsSync("./routes/"))
        fs.mkdirSync("routes")
    fs.writeFileSync(`./routes/${name}.js`, "let router = require('express').Router()\n")
    fs.appendFileSync(`./routes/${name}.js`, "\nrouter.get('/', (req, res)=>{\n//this should retrieve all data\nres.send('hello from " + name + "')})\n")
    fs.appendFileSync(`./routes/${name}.js`, "router.get('/:id', (req, res)=>{\n//this should retrieve one item with req.params.id\n})\n")
    fs.appendFileSync(`./routes/${name}.js`, "router.post('/', (req, res)=>{\n//this should handle data creation.\n//you can access post data using req.body\n})\n")
    fs.appendFileSync(`./routes/${name}.js`, "router.put('/:id', (req, res)=>{\n//this should update item with id set in req.params.id\n//data should be in req.body\n})\n")
    fs.appendFileSync(`./routes/${name}.js`, "router.delete('/:id', (req, res)=>{\n//this should delete the item with id set in req.params.id\n})")
    fs.appendFileSync(`./routes/${name}.js`, "\nmodule.exports = router")
    let routes;
    if (!fs.existsSync("./routes.json")) {
        fs.writeFileSync("./routes.json", "{\"routes\":[]}")
    }
    routes = require(`${process.cwd()}/routes.json`)
    routes.routes.push({
        "name":`./routes/${name}.js`,
        "url": url,
    })
    fs.writeFileSync(`${process.cwd()}/routes.json`, JSON.stringify(routes, null, 4))
    creationSpinner.stopAndPersist({text:"Files created", symbol:logSymbols.success})
})

program.parse(process.argv)