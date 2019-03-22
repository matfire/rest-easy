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

program.version('1.1.1').description('A simple utility to bootstrap your next express server')


program.command('init <dirname>').alias('i').description('create a new directory and install required packages').action(async(dirname) => {
    console.log(figlet.textSync('Express-Easy-Api'))
    if (fs.existsSync(dirname)) {
        console.log(chalk.red('Error, selected destination already exists'))
        return; 
    }
    fs.mkdirSync(dirname);
    exec(`cd ${dirname} && npm init --yes`, async(error) => {
        // if (fs.existsSync(`./${dirname}`)) {
        //     package = require(`./${dirname}/package.json`)
        // } else {
        //     package = require(`${dirname}/package.json`)
        // }
        // console.log(package)
        let responses = await prompt(questions)
        //prompt(questions).then(responses => {
            if (responses.cors) {
                await exec(`cd ${dirname} && npm i cors`)
            }
            if (responses.debug) {
                await exec(`cd ${dirname} && npm i morgan`)
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
                        fs.appendFileSync(`${dirname}/app.js`, "app.use(morgan('dev'))\n")
                    }
                    if (responses.cors) {
                        fs.appendFileSync(`${dirname}/app.js`, "app.use(cors())")
                    }
                    fs.appendFileSync(`${dirname}/app.js`, "\n\nmodule.exports=app")
                    fs.writeFileSync(`${dirname}/server.js`, "const app = require('./app.js')\n")
                    fs.appendFileSync(`${dirname}/server.js`, "const fs = require('fs')\n")
                    fs.appendFileSync(`${dirname}/server.js`, "if (fs.existsSync(\"./config.json\")) {\n\tconst config = require(\"./config.json\")\n\tconfig.routes.map((route) => {\n\t\tlet routen = require(route.name)\n\t\tapp.use(`/${route.url}`, routen)\n\t})\n}\n")
                    fs.appendFileSync(`${dirname}/server.js`, "\napp.listen(4000, () => console.log('listening'))")
                    writingSpinner.stopAndPersist({text:'Files written', symbol:logSymbols.success})
                    console.log("Everything is set up")
                    console.log(`cd ${dirname}`)
                    console.log('node server.js')
                    console.log("enjoy")
                })
        //})
    });
    
})

program.command("addRoute <name> <url>").alias("a").description("Add a route named <name> mapped to the url /<url>").action((name, url) => {
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
    fs.appendFileSync(`./routes/${name}.js`, "\nrouter.get('/', (req, res)=>{\n\t//this should retrieve all data\n\tres.send('hello from " + name + "')})\n")
    fs.appendFileSync(`./routes/${name}.js`, "router.get('/:id', (req, res)=>{\n\t//this should retrieve one item with req.params.id\n})\n")
    fs.appendFileSync(`./routes/${name}.js`, "router.post('/', (req, res)=>{\n\t//this should handle data creation.\n\t//you can access post data using req.body\n})\n")
    fs.appendFileSync(`./routes/${name}.js`, "router.put('/:id', (req, res)=>{\n\t//this should update item with id set in req.params.id\n\t//data should be in req.body\n})\n")
    fs.appendFileSync(`./routes/${name}.js`, "router.delete('/:id', (req, res)=>{\n\t//this should delete the item with id set in req.params.id\n})")
    fs.appendFileSync(`./routes/${name}.js`, "\nmodule.exports = router")
    let routes;
    if (!fs.existsSync("./config.json")) {
        fs.writeFileSync("./config.json", "{\"routes\":[]}")
    }
    routes = require(`${process.cwd()}/config.json`)
    routes.routes.push({
        "name":`./routes/${name}.js`,
        "url": url,
    })
    fs.writeFileSync(`${process.cwd()}/config.json`, JSON.stringify(routes, null, 4))
    creationSpinner.stopAndPersist({text:"Files created", symbol:logSymbols.success})
})

program.command("addAuth").alias("t").description("Add basic authentication using json web tokens").action(async() => {
    console.log(figlet.textSync('Express-Easy-Api'))
    if (!fs.existsSync('./server.js') || !fs.existsSync("./app.js")) {
        console.log(chalk.red('Please use this command in a directory created with express-easy-api'))
        return;
    }
    if (fs.existsSync(`./routes/auth.js`)) {
        console.log(chalk.red("Error: auth routes seem to already have been setup"))
        return;
    }
    if (!fs.existsSync("./routes/"))
        fs.mkdirSync("routes")
    if (!fs.existsSync("./config.json"))
        fs.writeFileSync("./config.json", "{\"routes\":[]}")
    let creationSpinner = ora("Installing packages").start()
    await exec("npm i jsonwebtoken bcrypt")
    creationSpinner.stopAndPersist({text:"Packages installed", symbol:logSymbols.success})
    let routesSpinner = ora("Writing routes").start()
    fs.writeFileSync("./routes/auth.js", "let router = require('express').Router()\n")
    fs.appendFileSync("./routes/auth.js", "let jwt = require('jwt')\n")
    fs.appendFileSync("./routes/auth.js", "let bcrypt=require('bcrypt')")
    fs.appendFileSync("./routes/auth.js", "\n router.post('/register', (req, res)=>{\n\tlet {email, password} = req.body //retrieve email and password from post\n\tpassword=bcrypt.hasSync(password, 12) //hash password to store it in db\n})")
    routesSpinner.stopAndPersist({text:"Routes written", symbol:logSymbols.success})
})

program.parse(process.argv)