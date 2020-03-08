
const HAPI = require("@hapi/hapi")

;(async () => {

    let url  = process.env.SERVICE_URL
    let host = process.env.SERVICE_HOST
    let port = parseInt(process.env.SERVICE_PORT)

    const server = HAPI.server({ host, port, debug: { request: [ "error" ] } })

    server.route({
        method:  "GET",
        path:    "/",
        handler: async (request, h) => {
            return "Hello World\n"
        }
    })

    await server.start()

})().catch((err) => {
    process.stderr.write(`** ERROR: ${err.stack}\n`)
    process.exit(1)
})

