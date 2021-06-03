export let getBaseUrl = () => {
    let env = process.env.NODE_ENV
    let baseUrl = ''
    if (env === 'development') {
        baseUrl = "http://127.0.0.1:5000/"
    } else if (env === 'production') {
        baseUrl = "http://127.0.0.1:5000/"
    }
    return baseUrl
};
