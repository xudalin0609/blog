
1. gitlab 的 runner 版本在匹配的范围内应该使用较高的版本。

   > 例如：我使用过的 gitlab 的版本为 12.9，但是使用 12.9 版本的 runner 发现，我的 runner 的 tags 无效，yaml 文件和 runner 中的 tags 都是 dev 的情况下，仍会找不到匹配 tag 的 runner

2. gitlab 注册 runner 的过程中需要提供 gitlab 的域名，但是如果直接使用 gitlab 自动生成的域名，会是 http 协议，如果你的 gitlab 注册了 https，会导致注册 runner 失败

![Image of Yaktocat](https://octodex.github.com/images/yaktocat.png)
