# flask是如何生成response的
在之前分析flask是如何启动的过程中看到，wsgi_app（）函数返回了response，但是如何寻找到对应的业务处理函数（路由），并生成response的，被略过了，这里继续进行分析。

```python
def wsgi_app(self, environ, start_response):
    """The actual WSGI application.
    """
    ctx = self.request_context(environ)
    ctx.push()
    error = None

    try:
        try:
            response = self.full_dispatch_request()
        except Exception as e:
            response = self.handle_exception(e)
        return response(environ, start_response)
    finally:
        if self.should_ignore_error(error):
            error = None
        ctx.auto_pop(error)
```

> 前文使用的代码是0.1版本的，但是由于wsgi_app（）函数在0.1版本不够清晰，这里之后使用0.12版本代码进行分析

逐行分析这段函数，首先是调用了一个request_context()，生成了一个请求上下文对象，然后将这个对象压入栈(关于请求上下文的分析后面继续)。

接下来调用full_dispatch_request()生成response。

最后将request传入的参数传入response对象并返回response。具体来看一下full_dispatch_request()做了些什么
```python
def full_dispatch_request(self):
    """Dispatches the request and on top of that performs request
    pre and postprocessing as well as HTTP exception catching and
    error handling.

    .. versionadded:: 0.7
    """
    self.try_trigger_before_first_request_functions()
    try:
        request_started.send(self)
        rv = self.preprocess_request()
        if rv is None:
            rv = self.dispatch_request()
    except Exception as e:
        rv = self.handle_user_exception(e)
    return self.finalize_request(rv)
```
做了三件事情：

1. 调用try_trigger_before_first_request_functions()(具体实现了什么暂且搁置)
2. 调用request_started.send(self)(搁置)
3. 调用prepross_request()生成了rv，如果rv为空则调用self.dispatch_reqeust()
4. 调用finilize_request(rv)，将rv作为参数传入

抛开代码细节，这里我的疑问主要是，rv是什么？和我们路由到业务函数之间有什么联系？

```python
def preprocess_request(self):
    """Called before the actual request dispatching and will
    call each :meth:`before_request` decorated function, passing no
    arguments.
    If any of these functions returns a value, it's handled as
    if it was the return value from the view and further
    request handling is stopped.

    This also triggers the :meth:`url_value_preprocessor` functions before
    the actual :meth:`before_request` functions are called.
    """
    bp = _request_ctx_stack.top.request.blueprint

    funcs = self.url_value_preprocessors.get(None, ())
    if bp is not None and bp in self.url_value_preprocessors:
        funcs = chain(funcs, self.url_value_preprocessors[bp])
    for func in funcs:
        func(request.endpoint, request.view_args)

    funcs = self.before_request_funcs.get(None, ())
    if bp is not None and bp in self.before_request_funcs:
        funcs = chain(funcs, self.before_request_funcs[bp])
    for func in funcs:
        rv = func()
        if rv is not None:
            return rv
```
返回的rv的过程中，preprocess_request()做了几件事情
1. 获取bp(即blueprint)
2. 调用url_value_preprocessors.get(),获取funcs（猜测此处为业务函数, 但是**此处及后面的的key都是None**,所以返回的都是()）
3. 迭代所获取到的funcs，传入endpoint和views_args(注意到此处的参数是通过request获取到的，那么request又是哪里来的？)
4. 调用before_request_funcs获取funcs
5. 迭代funcs，返回rv或None

不去纠结preprocess_request()的细节,去看接下来当rv为None时,dispatch_requst()做了些什么

```python
    def dispatch_request(self):
        """Does the request dispatching.  Matches the URL and returns the
        return value of the view or error handler.  This does not have to
        be a response object.  In order to convert the return value to a
        proper response object, call :func:`make_response`.

        .. versionchanged:: 0.7
           This no longer does the exception handling, this code was
           moved to the new :meth:`full_dispatch_request`.
        """
        req = _request_ctx_stack.top.request
        if req.routing_exception is not None:
            self.raise_routing_exception(req)
        rule = req.url_rule
        # if we provide automatic options for this URL and the
        # request came with the OPTIONS method, reply automatically
        if getattr(rule, 'provide_automatic_options', False) \
           and req.method == 'OPTIONS':
            return self.make_default_options_response()
        # otherwise dispatch to the handler for that endpoint
        return self.view_functions[rule.endpoint](**req.view_args)

```

1. 从栈顶获取到request
2. 获取request的rule
3. 从self.view_functions返回业务函数的运行结果,传入req.view_args

现在问题变成了
- reqeust什么时候生成并入栈的?
- view_functions什么时候生成的,是什么?

问题一
```python
    def wsgi_app(self, environ, start_response):
        # 使用environ生了request的上下文对象并入栈了
        ctx = self.request_context(environ)
        error = None
        ...
```

问题二
还记的flask的基本用法么
```
@app.route('/')
def hello_world():
    return 'Hello, World!'
```
但我们调用route装饰器的时候就已经往view_functions里添加了一个k:v,代码如下
```python
    def route(self, rule, **options):
        def decorator(f):
            endpoint = options.pop('endpoint', None)
            self.add_url_rule(rule, endpoint, f, **options)
            return f
        return decorator

   def add_url_rule(self, rule, endpoint=None, view_func=None, **options):
      
        if endpoint is None:
            endpoint = _endpoint_from_view_func(view_func)
        options['endpoint'] = endpoint
        methods = options.pop('methods', None)

        # if the methods are not given and the view_func object knows its
        # methods we can use that instead.  If neither exists, we go with
        # a tuple of only ``GET`` as default.
        if methods is None:
            methods = getattr(view_func, 'methods', None) or ('GET',)
        if isinstance(methods, string_types):
            raise TypeError('Allowed methods have to be iterables of strings, '
                            'for example: @app.route(..., methods=["POST"])')
        methods = set(item.upper() for item in methods)

        # Methods that should always be added
        required_methods = set(getattr(view_func, 'required_methods', ()))

        # starting with Flask 0.8 the view_func object can disable and
        # force-enable the automatic options handling.
        provide_automatic_options = getattr(view_func,
            'provide_automatic_options', None)

        if provide_automatic_options is None:
            if 'OPTIONS' not in methods:
                provide_automatic_options = True
                required_methods.add('OPTIONS')
            else:
                provide_automatic_options = False

        # Add the required methods now.
        methods |= required_methods

        rule = self.url_rule_class(rule, methods=methods, **options)
        rule.provide_automatic_options = provide_automatic_options

        self.url_map.add(rule)
        if view_func is not None:
            old_func = self.view_functions.get(endpoint)
            if old_func is not None and old_func != view_func:
                raise AssertionError('View function mapping is overwriting an '
                                     'existing endpoint function: %s' % endpoint)
            self.view_functions[endpoint] = view_func
```

上面的函数中我们可以看到flask维护了url_map和view_functions两个映射关系,前者是werkzeug中的Map对象,匹配url返回对应的endpoint名字和字典参数.view_functions维护的是endpoint到业务处理函数之间的关系.

总结一下,flask找到对应的业务函数(路由)过程可以概括为:
1. 使用route或者add_rule_url添加映射关系到url_map和view_functions
2. 请求(request)进来之后,通过request的信息匹配到对应的业务处理函数,并返回调用结果
3. 使用业务函数的结果生成响应(response)对象,并返回给wsgi服务