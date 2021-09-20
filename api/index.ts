import {server} from "./server"

const main = async () => {
    const {url} = await server.listen()
    console.log(`🚀 Server ready at ${url}`)

}

main()