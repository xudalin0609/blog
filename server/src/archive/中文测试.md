```python
from flask import Flask
app = Flask(__name__)

@app.route('/')
def hello_world():
    return 'Hello, World!'
    
if __name__ == __main__:
    app.run()
```
这是官方给出的一个最小的flask应用，可以看出flask的基本功能。
1. 生成一个Flask实例,即```app=Flask(__name__```)
2. 调用```app.run()```使flask运行起来

当然我们选择性的忽视了```app.route('/')```，这部分内容留到之后继续分析,现在我们先看看```app.run()```这个函数做了些什么。

```python
def run(self, host='localhost', port=5000, **options):
    from werkzeug import run_simple
    return run_simple(host, port, self, **options)
```

以上是0.1版本的flask中```app.run()```的代码（注释和参数处理等无用信息被我删除了）。

```run()```方法做了一件很简单的事情,调用了werkzeug的run_simple()方法,把host,port和app实例本身作为参数传了过去。


我们会发现，在run（）中没有调用Flask类中的其他方法，那么请求（request）发送过来之后，Flask是如何接受请求又如何返回相应的呢？
剩下的都就是werkzeug的任务了。

在继续讨论werkzeug之前，先补充一下python的WSGI的相关知识.

> WSGI区分为两个部分：一为“服务器”或“网关”，另一为“应用程序”或“应用框架”。在处理一个WSGI请求时，服务器会为应用程序提供环境信息及一个回调函数（Callback Function）。当应用程序完成处理请求后，透过前述的回调函数，将结果回传给服务器。
所谓的 WSGI 中间件同时实现了API的两方，因此可以在WSGI服务器和WSGI应用之间起调解作用：从Web服务器的角度来说，中间件扮演应用程序，而从应用程序的角度来说，中间件扮演服务器。“中间件”组件可以执行以下功能：
重写环境变量后，根据目标URL，将请求消息路由到不同的应用对象。
允许在一个进程中同时运行多个应用程序或应用框架。
负载均衡和远程处理，通过在网络上转发请求和响应消息。
进行内容后处理，例如应用XSLT样式表。  --wiki百科

我们可以简单的将WSGI应用理解为一个在socket和flask之间的东西，负责接受并处理socket传来的信息,然后通过回调传递过来的app塞给flask之类的应用。例如在werkzeug中有这样一段代码就是调用app的
```python
def execute(app):
    application_iter = app(environ, start_response)
    try:
        for data in application_iter:
            write(data)
        if not headers_sent:
            write(b'')
    finally:
        if hasattr(application_iter, 'close'):
            application_iter.close()
            application_iter = None
```
接下来我们就可以顺藤摸瓜到app的__call__()方法了
```python
def __call__(self, environ, start_response):
    """Shortcut for :attr:`wsgi_app`"""
    return self.wsgi_app(environ, start_response)
```
发现__call__调用了wsgi_app()方法，并传递了environ和start_response参数
```
def wsgi_app(self, environ, start_response):
    """The actual WSGI application.  This is not implemented in
    `__call__` so that middlewares can be applied:

        app.wsgi_app = MyMiddleware(app.wsgi_app)

    :param environ: a WSGI environment
    :param start_response: a callable accepting a status code,
                           a list of headers and an optional
                           exception context to start the response
    """
    with self.request_context(environ):
        rv = self.preprocess_request()
        if rv is None:
            rv = self.dispatch_request()
        response = self.make_response(rv)
        response = self.process_response(response)
        return response(environ, start_response)
```
wsgi_app也只做了一件简单的事情，找到处理函数并调用，生成响应(response),至于如何找到处理函数并生成response的，后续会逐步分析。

至此，我们就可以认为一个简单的flask服务就启动成功了。总结一下

1. 实例化一个Flask类并调用run方法，将app实例作为参数传递给WSGI服务，如werkzeug
2. WSGI服务接收到请求后调用app，并传入request的参数
3. app被调用后调用自身的wsgi_app()方法，找到对应的处理函数，生成response并返回
