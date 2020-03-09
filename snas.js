#!/usr/bin/env node
/*!
**  SNAS -- Simple Node Application Server
**  Copyright (c) 2020 Dr. Ralf S. Engelschall <rse@engelschall.com>
**
**  Permission is hereby granted, free of charge, to any person obtaining
**  a copy of this software and associated documentation files (the
**  "Software"), to deal in the Software without restriction, including
**  without limitation the rights to use, copy, modify, merge, publish,
**  distribute, sublicense, and/or sell copies of the Software, and to
**  permit persons to whom the Software is furnished to do so, subject to
**  the following conditions:
**
**  The above copyright notice and this permission notice shall be included
**  in all copies or substantial portions of the Software.
**
**  THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
**  EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
**  MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT.
**  IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY
**  CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT,
**  TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE
**  SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
*/

/*  own package information  */
const my          = require("./package.json")

/*  internal requirements  */
const path        = require("path")
const fs          = require("fs")

/*  external requirements  */
const UN          = require("update-notifier")
const yargs       = require("yargs")
const which       = require("which")
const mkdirp      = require("mkdirp")
const nunjucks    = require("nunjucks")
const chokidar    = require("chokidar")
const execa       = require("execa")
const apachemd5   = require("apache-md5")
const byline      = require("byline")
const moment      = require("moment")

;(async () => {
    /*  automatic update notification (with 2 days check interval)  */
    const notifier = UN({ pkg: my, updateCheckInterval: 1000 * 60 * 60 * 24 * 2 })
    notifier.notify()

    /*  command-line option parsing  */
    const argv = yargs()
        /* eslint indent: off */
        .parserConfiguration({
            "duplicate-arguments-array": true,
            "set-placeholder-key":       true,
            "flatten-duplicate-arrays":  true,
            "camel-case-expansion":      true,
            "strip-aliased":             false,
            "dot-notation":              false,
            "halt-at-non-option":        true
        })
        .usage("Usage: snas " +
            "[-h|--help] " +
            "[-V|--version] " +
            "[-u|--ingress-url <url>] " +
            "[-a|--ingress-addr <addr>] " +
            "[-p|--ingress-port <port>] " +
            "[-A|--service-addr <addr>] " +
            "[-P|--service-port <port>] " +
            "[-d|--service-directory <directory>] " +
            "[-t|--service-admin-token <token>]"
        )
        .option("h", {
            alias:    "help",
            type:     "boolean",
            describe: "show program help information",
            default:  false
        })
        .option("V", {
            alias:    "version",
            type:     "boolean",
            describe: "show program version information",
            default:  false
        })
        .option("u", {
            alias:    "ingress-url",
            type:     "string",
            describe: "ingress fully-qualified URL to listen for HTTP requests",
            nargs:    1,
            default:  "http://localhost"
        })
        .option("a", {
            alias:    "ingress-addr",
            type:     "string",
            describe: "ingress address to listen for HTTP requests",
            nargs:    1,
            default:  "127.0.0.1"
        })
        .option("p", {
            alias:    "ingress-port",
            type:     "number",
            describe: "ingress port number to listen for HTTP requests",
            nargs:    1,
            default:  9000
        })
        .option("A", {
            alias:    "service-addr",
            type:     "string",
            describe: "service address to listen for HTTP requests",
            nargs:    1,
            default:  "127.0.0.1"
        })
        .option("P", {
            alias:    "service-port",
            type:     "number",
            describe: "service port (base) to listen for HTTP requests",
            nargs:    1,
            default:  9001
        })
        .option("d", {
            alias:    "service-directory",
            type:     "string",
            describe: "service directory for storing services",
            nargs:    1,
            default:  "."
        })
        .option("i", {
            alias:    "initialize",
            type:     "boolean",
            describe: "initialize service directory with hello service",
            default:  false
        })
        .option("t", {
            alias:    "service-admin-token",
            type:     "string",
            describe: "service admin token/password for DAV access to the files",
            nargs:    1,
            default:  "admin"
        })
        .version(false)
        .strict(true)
        .showHelpOnFail(true)
        .demand(0)
        .parse(process.argv.slice(2))

    /*  short-circuit processing of "-V" command-line option  */
    if (argv.version) {
        process.stderr.write(`${my.name} ${my.version} <${my.homepage}>\n`)
        process.stderr.write(`${my.description}\n`)
        process.stderr.write(`Copyright (c) 2020 ${my.author.name} <${my.author.url}>\n`)
        process.stderr.write(`Licensed under ${my.license} <http://spdx.org/licenses/${my.license}.html>\n`)
        process.exit(0)
    }

    /*  ensure that the required programs are in PATH  */
    await which("supervisord")
    await which("nginx")
    await which("node")
    await which("npm")

    /*  provide logging  */
    const log = (msg) => {
        const timestamp = moment().format("YYYY-DD-MM hh:ss:mm.SS")
        process.stderr.write(`[${timestamp}] ${msg}\n`)
    }

    /*  prepare run-time directories  */
    const existsFile = async (file) => {
        return fs.promises.access(file, fs.constants.F_OK)
            .then(() => true).catch(() => false)
    }
    const ensureDir = async (dir) => {
        const exists = await existsFile(dir)
        if (!exists)
            await mkdirp(dir)
    }
    const etcdir = path.join(argv.serviceDirectory, "etc")
    const libdir = path.join(argv.serviceDirectory, "lib")
    const vardir = path.join(argv.serviceDirectory, "var")
    await ensureDir(etcdir)
    await ensureDir(libdir)
    await ensureDir(vardir)

    /*  optionally create a sample "hello" service  */
    if (argv.initialize) {
        await ensureDir(path.join(libdir, "hello"))
        await fs.promises.copyFile(path.join(__dirname, "snas-hello-package.json"), path.join(libdir, "hello/package.json"))
        await fs.promises.copyFile(path.join(__dirname, "snas-hello-service.js"),   path.join(libdir, "hello/service.js"))
    }

    /*  create NGINX password file  */
    const pw = apachemd5("admin")
    const txt = `admin:${pw}\n`
    await fs.promises.writeFile(path.join(etcdir, "nginx.passwd"), txt, { encoding: "utf8" })

    /*  render run-time configuration files (with nunjucks templating)  */
    const renderFile = async (fileOutput, fileInput, context = {}) => {
        const input = await fs.promises.readFile(fileInput, { encoding: "utf8" })
        const env = nunjucks.configure(fileInput, {
            autoescape:       true,
            throwOnUndefined: false,
            trimBlocks:       true,
            lstripBlocks:     true,
            watch:            false,
            noCache:          true
        })
        const output = env.renderString(input, context)
        await fs.promises.writeFile(fileOutput, output, { encoding: "utf8" })
    }

    /*  the internal state  */
    let supervisord = null
    const services  = {}

    /*  update the run-time configuration files  */
    const updateConfigs = async () => {
        /*  assembly information for nunjucks template directives  */
        const context = {
            global: {
                ingressUrl:  argv.ingressUrl,
                ingressAddr: argv.ingressAddr,
                ingressPort: argv.ingressPort,
                etcdir,
                libdir,
                vardir
            },
            services: []
        }
        for (const name of Object.keys(services)) {
            const pkg = require(`${libdir}/${name}/package.json`)
            if (pkg.main === undefined) {
                log(`snas: [warning]: service "${name}" is missing "main" entry in its "package.json" file -- skipping service`)
                continue
            }
            context.services.push({
                name,
                main: pkg.main,
                url:  `${argv.ingressUrl}/${name}/`,
                addr: argv.serviceAddr,
                port: services[name].port
            })
        }

        /*  generate configuration files  */
        log("snas: [info]: update run-time configuration files")
        renderFile(path.join(etcdir, "supervisord.conf"), path.join(__dirname, "snas-supervisord.conf"), context)
        renderFile(path.join(etcdir, "nginx.conf"),       path.join(__dirname, "snas-nginx.conf"),       context)

        const runDaemon = () => {
            log("snas: [info]: running supervisord daemon")
            const proc = execa("supervisord", [ "-c", path.join(etcdir, "supervisord.conf") ], {
                stdio: [ "ignore", "pipe", "pipe" ],
                all: true
            })
            const output = byline.createStream(proc.all)
            output.on("data", (line) => {
                line = line.toString()
                line = line.replace(/^time=".+?" level=(\S+) /, "supervisord: [$1]: ")
                log(line)
            })
            return proc
        }
        const runControl = (...args) => {
            log(`snas: [info]: sending supervisord control command: ${args.join(" ")}`)
            const proc = execa("supervisord", [ "-c", path.join(etcdir, "supervisord.conf"), "ctl", ...args ], {
                stdio: [ "ignore", "pipe", "pipe" ],
                all: true
            })
            const output = byline.createStream(proc.all)
            output.on("data", (line) => {
                log(`supervisord(ctl): [output]: ${line.toString()}\n`)
            })
            return proc
        }
        const runNPM = (name) => {
            log(`snas: [info]: running NPM for service "${name}"`)
            const proc = execa("sh", [
                "-c",
                `cd ${libdir}/${name} && ` +
                "rm -rf node_modules && " +
                "npm " +
                " --userconfig .npmrc" +
                " --globalconfig .npmrc" +
                " --cache .npm/cache" +
                " --color false" +
                " --spin false" +
                " --save false" +
                " install" +
                " --production " +
                " 1>&2"
            ], {
                stdio: [ "ignore", "pipe", "pipe" ],
                all: true
            })
            const output = byline.createStream(proc.all)
            output.on("data", (line) => {
                log(`npm: [output]: ${line.toString()}`)
            })
            return proc
        }

        /*  initially start or restart run-time programs  */
        if (!supervisord) {
            /*  initially start supervisord(8)  */
            supervisord = runDaemon()
        }
        else {
            /*  reload supervisord(8)  */
            await runControl("reload")
            await new Promise((resolve) => setTimeout(() => resolve(), 1000))

            /*  reload nginx(8)  */
            await runControl("signal", "HUP", "gateway")

            /*  restart services  */
            for (const name of Object.keys(services)) {
                if (services[name].restart) {
                    services[name].restart = false

                    /*  stop service  */
                    log(`snas: [info]: stopping service "${name}"`)
                    await runControl("stop", `service-${name}`)

                    /*  establish the NPM dependencies  */
                    log(`snas: [info]: establishing NPM dependencies for service "${name}"`)
                    await runNPM(name)

                    /*  (re)start service  */
                    log(`snas: [info]: starting service "${name}"`)
                    await runControl("start", `service-${name}`)
                }
            }
        }
    }

    /*  watch the service files  */
    let K = 0
    const changed = {}
    let timer = null
    chokidar.watch(libdir, {
        ignored:        [ ".*", "*/node_modules/**", ".npm/**" ],
        ignoreInitial:  false,
        followSymlinks: false,
        cwd:            libdir,
        interval:       100,
        depth:          5,
        atomic:         100,
        awaitWriteFinish: {
            stabilityThreshold: 2000,
            pollInterval:       100
        }
    }).on("all", async (event, path) => {
        const m = path.match(/^(.+)\/.+$/)
        if (!m)
            return
        const name = m[1]
        const isService = await existsFile(`${libdir}/${name}/package.json`)
        if (!isService)
            return
        changed[name] = true
        if (timer)
            clearTimeout(timer)
        timer = setTimeout(async () => {
            const names = Object.keys(changed)
            for (const name of names) {
                /*  mark service for restart  */
                log(`snas: [info]: detected changes for service "${name}"`)
                if (!services[name])
                    services[name] = { port: argv.servicePort + K++ }
                services[name].restart = true
            }
            await updateConfigs()
        }, 1000)
    })

    /*  graceful termination handling  */
    const terminate = async (signal) => {
        log(`snas: [info]: received ${signal} signal -- shutting down`)
        if (supervisord)
            supervisord.cancel()
        await supervisord.catch((err) => err)
        log("snas: [info]: exit")
        process.exit(0)
    }
    process.on("SIGINT",  () => terminate("INT"))
    process.on("SIGTERM", () => terminate("TERM"))
})().catch((err) => {
    /*  fatal error  */
    process.stderr.write(`snas: [ERROR]: ${err.stack}\n`)
    process.exit(1)
})

