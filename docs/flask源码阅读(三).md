# flask 是如何取出 request 的

之前分析 wsgi_app()函数的时候看到，当 flask 接受到了请求后，会生成一个 Request 的对象，并调用了 push()方法，在后续的使用中，会直接取出 request 中的参数传入业务逻辑函数。那么 Request 对象内部做了些什么？又是什么样的数据结构呢？这里就开始分析一下 flask 内部的 RequestContext 类。

```python
    ...
    def wsgi_app(self, environ, start_response):
        ctx = self.request_context(environ)
        ctx.push()
        ...

    def request_context(self, environ):
        return RequestContext(self, environ)
```

可以看到 wsgi_app()调用了 request_context()方法，request_context()返回了 RequestContext 的实例。

```python
class RequestContext(object):
    def __init__(self, app, environ, request=None):
        self.app = app
        if request is None:
            request = app.request_class(environ)
        self.request = request
        self.url_adapter = app.create_url_adapter(self.request)
        self.flashes = None
        self.session = None

        self._implicit_app_ctx_stack = []

        self.preserved = False

        self._preserved_exc = None

        self._after_request_functions = []

        self.match_request()

    def push(self):

        top = _request_ctx_stack.top
        if top is not None and top.preserved:
            top.pop(top._preserved_exc)

        app_ctx = _app_ctx_stack.top
        if app_ctx is None or app_ctx.app != self.app:
            app_ctx = self.app.app_context()
            app_ctx.push()
            self._implicit_app_ctx_stack.append(app_ctx)
        else:
            self._implicit_app_ctx_stack.append(None)

        if hasattr(sys, 'exc_clear'):
            sys.exc_clear()

        _request_ctx_stack.push(self)

        self.session = self.app.open_session(self.request)
        if self.session is None:
            self.session = self.app.make_null_session()

```

在初始化 RequestContext 实例的时候，传入了 Flask()实例和 environ 变量，并使用 environ 生成了 Requst 实例，这里不继续深究 Requst 实例的细节。

继续分析 push()函数做了什么。这里使用到了\_request_ctx_stack 和\_app_ctx_stack 的全局变量。分别对\_request_ctx_stack 和\_app_ctx_stack 取出了栈顶的值，并且将 ReqeustContext 的实例压入\_request_ctx_stack 中。那么\_reqeust_ctx_stack 和\_app_ctx_stack 是什么呢？又为什么要使用这两个栈呢？继续看看这两个栈的代码细节。

```python
# context locals
_request_ctx_stack = LocalStack()
_app_ctx_stack = LocalStack()
current_app = LocalProxy(_find_app)
request = LocalProxy(partial(_lookup_req_object, 'request'))
session = LocalProxy(partial(_lookup_req_object, 'session'))
g = LocalProxy(partial(_lookup_app_object, 'g'))
```

可以看到二者都是 LocalStack()的实例，至此我们可以知道，我们处理 environ 参数的流程如下

1. 获取到 environ
2. 生成 RequestContext 对象
3. 将 RequestContext 压入\_request_ctx_stack

回忆我们前文找到业务逻辑并传入参数的代码

```python
    def dispatch_request(self):
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

也就是说从当前的栈顶直接取出就是 reqeust 的参数，那么问题来了，如果是多线程的情况，如何能保证取到当前线程的参数呢？继续深入 LocalStack 的代码实现。

```python
class LocalStack(object):

    def __init__(self):
        self._local = Local()

    def __release_local__(self):
        self._local.__release_local__()

    def __call__(self):
        def _lookup():
            rv = self.top
            if rv is None:
                raise RuntimeError('object unbound')
            return rv
        return LocalProxy(_lookup)

    def push(self, obj):
        rv = getattr(self._local, 'stack', None)
        if rv is None:
            self._local.stack = rv = []
        rv.append(obj)
        return rv

    def pop(self):
        stack = getattr(self._local, 'stack', None)
        if stack is None:
            return None
        elif len(stack) == 1:
            release_local(self._local)
            return stack[-1]
        else:
            return stack.pop()

    @property
    def top(self):
        try:
            return self._local.stack[-1]
        except (AttributeError, IndexError):
            return None
```

LocalStack 并没有解决我们的问题。但是我们可以知道，其实 LocalStack 内部实现了 Local 的实例\_local，并将传入的值以"stack"的 key 传入\_local。那么 Local 又实现了什么？

```python
try:
    from greenlet import getcurrent as get_ident
except ImportError:
    try:
        from thread import get_ident
    except ImportError:
        from _thread import get_ident

class Local(object):
    __slots__ = ('__storage__', '__ident_func__')

    def __init__(self):
        object.__setattr__(self, '__storage__', {})
        object.__setattr__(self, '__ident_func__', get_ident)

    def __call__(self, proxy):
        """Create a proxy for a name."""
        return LocalProxy(self, proxy)

    def __release_local__(self):
        self.__storage__.pop(self.__ident_func__(), None)

        try:
            return self.__storage__[self.__ident_func__()][name]
        except KeyError:
            raise AttributeError(name)

    def __setattr__(self, name, value):
        ident = self.__ident_func__()
        storage = self.__storage__
        try:
            storage[ident][name] = value
        except KeyError:
            storage[ident] = {name: value}

    def __delattr__(self, name):
        try:
            del self.__storage__[self.__ident_func__()][name]
        except KeyError:
            raise AttributeError(name)
```

从以上可以发现重写了**setattr**, **delattr**, **release_local**方法 Local 将相关的属性存入了**storage**,而**setattr**在存储 key,value 的时候，使用的其实是一个二层字典，结构为**storage**[ident][name],其中 ident 为 get_ident()方法的返回值，也就是当前线程的值。这也就解释了 Local 是如何实现线程隔离的存储 request 参数的了。

在 Local 的**call**中，创建了一个 LocalProxy 对象，那么这又是什么？

```python
class LocalProxy(object):
    """Acts as a proxy for a werkzeug local.
    Forwards all operations to a proxied object. """
    __slots__ = ('__local', '__dict__', '__name__')

    def __init__(self, local, name=None):
        object.__setattr__(self, '_LocalProxy__local', local)
        object.__setattr__(self, '__name__', name)

    def _get_current_object(self):
        """Return the current object."""
        if not hasattr(self.__local, '__release_local__'):
            return self.__local()
        try:
            return getattr(self.__local, self.__name__)
        except AttributeError:
            raise RuntimeError('no object bound to %s' % self.__name__)

    @property
    def __dict__(self):
        try:
            return self._get_current_object().__dict__
        except RuntimeError:
            raise AttributeError('__dict__')

    def __getattr__(self, name):
        if name == '__members__':
            return dir(self._get_current_object())
        return getattr(self._get_current_object(), name)

    def __setitem__(self, key, value):
        self._get_current_object()[key] = value
```

我们看到在 LocalProxy 类出初始化的时候，传入了一个 local 对象。并将该对象保存在**local 中。\*\*注意，**setattr**方法中使用的是\_LocalProxy**local,这是因为在 python 中**开头的属性会被保存为\_ClassName**variable 的形式\*\*。然后使用的是\_get_current_object()方法从\_\_local 中获取对应的对象。

这里实现的关键是把通过参数传递进来的 Local 实例保存在 \_\_local 属性中，并定义了 \_get_current_object() 方法获取当前线程或者协程对应的对象。

LocalProxy 是一个典型的代理模式实现，它在构造时接受一个 callable 的参数（比如一个函数），这个参数被调用后的返回值本身应该是一个 Thread Local 对象。对一个 LocalProxy 对象的所有操作，包括属性访问、方法调用（当然方法调用就是属性访问）甚至是二元操作都会转发到那个 callable 参数返回的 Thread Local 对象上。

LocalProxy 的一个使用场景是 LocalStack 的 **call** 方法。比如 my_local_stack 是一个 LocalStack 实例，那么 my_local_stack() 能返回一个 LocalProxy 对象，这个对象始终指向 my_local_stack 的栈顶元素。如果栈顶元素不存在，访问这个 LocalProxy 的时候会抛出 RuntimeError。
