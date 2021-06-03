### nova的构成
openstac由不同的组件构成，目前常用的组件有nova,cinder,glance,neutron等。组件之间采用restful-api进行通信，组件内部使用RPC进行通讯。

每个组件内部又分为不同的模块，以nova为例，可以分出的模块如下：
- nova api
- nova compute
- nova schedule
- nova condutor

### nova的内部的基本流程
如果我向nova发送了一个create server的restful请求，nova内部会如何处理这个请求呢？大致的流程概括如下。

1. nova api接受到请求，做出相应的校验，参数处理和资源准备，然后rpc调用nova-schduler
2. nova scheduler是虚拟机调度服务，选择合适的计算节点运行虚拟机，然后rpc调用nova-compute
3. nova compute是虚拟机的管理服务，通过调用hypervisor api实现虚拟机的生命周期管理，以kvm为例，就是使用libvert的api进行虚拟机生命周期管理，在过程中会对conductor进行调用
4. nova conductor和数据库进行交互（之所以使用nova conductor而不是nova compute直接和数据库交互是出于安全性和可伸缩性考虑）

每个组件是如何实现的，具体做了哪些事情，以及为什么要这么实现，后面会继续尝试进行分析。

### nova api的实现
nova api使用paste_deploy来帮助生成wsgi app。要理解nova api的实现，首先要理解paste deploy的使用方式。

简单的概括一下paste deploy是做什么的。PasteDeploy是一套发现和配置WSGI应用的系统。它根据指定的配置文件动态生成入口点和组织WSGI applieation间的逻辑关系。换成一个比较容易理解的方式来说，就是使用配置文件生成wsgi app并将它们组装起来。

来看一个最小的deploy使用demo


```
# config.ini
[composite:main]
use = call:urlmap:urlmap_factory
/v1: router_v1 

[composite:router_v1]
use = call:router_v1:app_factory
r1 = filter_v1 app_v1

[filter:filter_v1]
paste.filter_factory = filter_v1:filter_factory

[app:app_v1]
paste.app_factory = app_v1:app_factory
```

```python
# router_v1
from webob.dec import *
import webob.exc
from routes import Mapper, middleware


def _load_pipeline(loader, pipeline):
    filters = [loader.get_filter(n) for n in pipeline[:-1]]
    app = loader.get_app(pipeline[-1])
    filters.reverse()
    for filter in filters:
        app = filter(app)
    return app


def app_factory(loader, global_conf, **local_conf):
    pipeline = local_conf['r1']
    pipeline = pipeline.split()
    return _load_pipeline(loader, pipeline)
```

```python
# filter_v1
def add_str(app):
    return app + "filter v1"


def filter_factory(loader, **local_config):
    return add_str
```

```python
# app_v1
def app_factory(loader, **local_config):
    return "app v1"
```


从以上代码可以看到一个基本paste deploy的使用方式
- loadapp从配置文件中加载一个wsgi app
- 可以通过paste deploy传入的loader获取到不同的组件
- 将最终需要返回的app作为参数传入pipeline并经过层层处理

对比nova api的实际配置文件如下：
```ini
# nova/etc/nova
[composite:osapi_compute]
use = call:nova.api.openstack.urlmap:urlmap_factory
/: oscomputeversions
/v2: openstack_compute_api_v21_legacy_v2_compatible
/v2.1: openstack_compute_api_v21

[composite:openstack_compute_api_v21]
use = call:nova.api.auth:pipeline_factory_v21
noauth2 = cors compute_req_id faultwrap sizelimit osprofiler noauth2 osapi_compute_app_v21
keystone = cors compute_req_id faultwrap sizelimit osprofiler authtoken keystonecontext osapi_compute_app_v21

```
不难理解，nova api首先使用nova/api/openstack/urlmap中的urlmap_factory函数根据版本对请求进行路由。路由的逻辑如下：
```python
def urlmap_factory(loader, global_conf, **local_conf):
    if 'not_found_app' in local_conf:
        not_found_app = local_conf.pop('not_found_app')
    else:
        not_found_app = global_conf.get('not_found_app')
    if not_found_app:
        not_found_app = loader.get_app(not_found_app, global_conf=global_conf)
    urlmap = URLMap(not_found_app=not_found_app)
    for path, app_name in local_conf.items():
        path = paste.urlmap.parse_path_expression(path)
        app = loader.get_app(app_name, global_conf=global_conf)
        urlmap[path] = app
    return urlmap

class URLMap:
    def __call__(self, environ, start_response):
        host = environ.get('HTTP_HOST', environ.get('SERVER_NAME')).lower()
        if ':' in host:
            host, port = host.split(':', 1)
        else:
            if environ['wsgi.url_scheme'] == 'http':
                port = '80'
            else:
                port = '443'

        path_info = environ['PATH_INFO']
        path_info = self.normalize_url(path_info, False)[1]

        # The MIME type for the response is determined in one of two ways:
        # 1) URL path suffix (eg /servers/detail.json)
        # 2) Accept header (eg application/json;q=0.8, application/xml;q=0.2)

        # The API version is determined in one of three ways:
        # 1) URL path prefix (eg /v1.1/tenant/servers/detail)
        # 2) Content-Type header (eg application/json;version=1.1)
        # 3) Accept header (eg application/json;q=0.8;version=1.1)

        supported_content_types = list(wsgi.get_supported_content_types())

        mime_type, app, app_url = self._path_strategy(host, port, path_info)

        # Accept application/atom+xml for the index query of each API
        # version mount point as well as the root index
        if (app_url and app_url + '/' == path_info) or path_info == '/':
            supported_content_types.append('application/atom+xml')

        if not app:
            app = self._content_type_strategy(host, port, environ)

        if not mime_type or not app:
            possible_mime_type, possible_app = self._accept_strategy(
                    host, port, environ, supported_content_types)
            if possible_mime_type and not mime_type:
                mime_type = possible_mime_type
            if possible_app and not app:
                app = possible_app

        if not mime_type:
            mime_type = 'application/json'

        if not app:
            # Didn't match a particular version, probably matches default
            app, app_url = self._match(host, port, path_info)
            if app:
                app = self._munge_path(app, path_info, app_url)

        if app:
            environ['nova.best_content_type'] = mime_type
            return app(environ, start_response)

        LOG.debug('Could not find application for %s', environ['PATH_INFO'])
        environ['paste.urlmap_object'] = self
        return self.not_found_application(environ, start_response)


```
以上的URLMap只保留了__call__部分的代码，可以看出URLMap实现了根据不同的版本信息路由到不同的不同的组件中。假设使用的版本为v21，继续openstack_compute_api_v21实现了那些功能。
```python
def _load_pipeline(loader, pipeline):
    filters = [loader.get_filter(n) for n in pipeline[:-1]]
    app = loader.get_app(pipeline[-1])
    filters.reverse()
    for filter in filters:
        app = filter(app)
    return app

def pipeline_factory(loader, global_conf, **local_conf):
    """A paste pipeline replica that keys off of auth_strategy."""

    pipeline = local_conf[CONF.auth_strategy]
    if not CONF.api_rate_limit:
        limit_name = CONF.auth_strategy + '_nolimit'
        pipeline = local_conf.get(limit_name, pipeline)
    pipeline = pipeline.split()
    return _load_pipeline(loader, pipeline)
```
这一段的逻辑也不难理解，pipeline实现了加载配置文件中的所有filter并将app作为参数逐层传入filter中。跳过filter中的内容，下一步直接跳入到最后的app，看一下app是如何实现的。

```python
# nova/api/openstack/compute/__init__.py
class APIRouterV21(nova.api.openstack.APIRouterV21):
    """Routes requests on the OpenStack API to the appropriate controller
    and method.
    """
    def __init__(self, init_only=None):
        self._loaded_extension_info = extension_info.LoadedExtensionInfo()
        super(APIRouterV21, self).__init__(init_only)

    def _register_extension(self, ext):
        return self.loaded_extension_info.register_extension(ext.obj)

    @property
    def loaded_extension_info(self):
        return self._loaded_extension_info
```
这里的实现了很少的逻辑，只加载了一个extensionInfo，主要参数由它的父类实现，继续看父类代码。
```python
class APIRouterV21(base_wsgi.Router):
    """Routes requests on the OpenStack v2.1 API to the appropriate controller
    and method.
    """

    @classmethod
    def factory(cls, global_config, **local_config):
        """Simple paste factory, :class:`nova.wsgi.Router` doesn't have one."""
        return cls()

    def __init__(self, init_only=None, v3mode=False):
        self.api_extension_manager = stevedore.enabled.EnabledExtensionManager(
            namespace=self.api_extension_namespace(),
            check_func=_check_load_extension,
            invoke_on_load=True,
            invoke_kwds={"extension_info": self.loaded_extension_info})

        if v3mode:
            mapper = PlainMapper()
        else:
            mapper = ProjectMapper()

        self.resources = {}

        # NOTE(cyeoh) Core API support is rewritten as extensions
        # but conceptually still have core
        if list(self.api_extension_manager):
            # NOTE(cyeoh): Stevedore raises an exception if there are
            # no plugins detected. I wonder if this is a bug.
            self._register_resources_check_inherits(mapper)
            self.api_extension_manager.map(self._register_controllers)

        missing_core_extensions = self.get_missing_core_extensions(
            self.loaded_extension_info.get_extensions().keys())
        if not self.init_only and missing_core_extensions:
            LOG.critical(_LC("Missing core API extensions: %s"),
                         missing_core_extensions)
            raise exception.CoreAPIMissing(
                missing_apis=missing_core_extensions)

        LOG.info(_LI("Loaded extensions: %s"),
                 sorted(self.loaded_extension_info.get_extensions().keys()))
        super(APIRouterV21, self).__init__(mapper)
```
删除了部分校验相关代码，可以看到这个类主要实现了对于mapper的初始化，并且使用stevedore加载了了一个api_extension_manager。然后使用api_extension_manager将resources注册进了mapper中。继续看他的父类。

```python
class Router(object):
    """WSGI middleware that maps incoming requests to WSGI apps."""

    def __init__(self, mapper):
        """Create a router for the given routes.Mapper.

        Each route in `mapper` must specify a 'controller', which is a
        WSGI app to call.  You'll probably want to specify an 'action' as
        well and have your controller be an object that can route
        the request to the action-specific method.

        Examples:
          mapper = routes.Mapper()
          sc = ServerController()

          # Explicit mapping of one route to a controller+action
          mapper.connect(None, '/svrlist', controller=sc, action='list')

          # Actions are all implicitly defined
          mapper.resource('server', 'servers', controller=sc)

          # Pointing to an arbitrary WSGI app.  You can specify the
          # {path_info:.*} parameter so the target app can be handed just that
          # section of the URL.
          mapper.connect(None, '/v1.0/{path_info:.*}', controller=BlogApp())

        """
        self.map = mapper
        self._router = routes.middleware.RoutesMiddleware(self._dispatch,
                                                          self.map)

    @webob.dec.wsgify(RequestClass=Request)
    def __call__(self, req):
        return self._router

    @staticmethod
    @webob.dec.wsgify(RequestClass=Request)
    def _dispatch(req):
        match = req.environ['wsgiorg.routing_args'][1]
        if not match:
            return webob.exc.HTTPNotFound()
        app = match['controller']
        return app
```
实现了wsgi app约定的__call__方法，返回了router，rotuer的功能就是将地址路由到具体的函数中。至此一个url及其匹配的处理函数就已经被找到了，但是还有一个问题，api_extension_manager中都有些什么东西。这里用到了stevedore的动态加载功能，stevedore根据配置文件，将不同的资源初始化到不同的命名空间中，使用的过程中，指定命名空间，并加载对应的source就可以了,以server的resource为例。

```ini
nova.api.v21.extensions 
    servers = nova.api.openstack.compute.servers:Servers
```
```python
class Servers(extensions.V21APIExtensionBase):
    """Servers."""

    name = "Servers"
    alias = ALIAS
    version = 1

    def get_resources(self):
        member_actions = {'action': 'POST', 'disk': 'GET'}
        collection_actions = {'detail': 'GET'}
        resources = [
            extensions.ResourceExtension(
                ALIAS,
                ServersController(extension_info=self.extension_info),
                member_name='server', collection_actions=collection_actions,
                member_actions=member_actions)]

        res = extensions.ResourceExtension('os-get_servers_info',
                                           GetServersInfoController())
        resources.append(res)

        return resources

    def get_controller_extensions(self):
        return []
```
至此，nova-api的基本逻辑就基本完成了，其中仍有很多细节，需要阅读具体的代码，后续会继续整理nova其他组件的代码。