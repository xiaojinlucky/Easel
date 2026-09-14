# dailyhot · 热点雷达的数据层

**这是什么**：把「热点雷达」的数据来源从**第三方公益接口**换成**你自己机器上跑的服务**。

改造前，`web/app.py` 的 `/api/trends` 直接请求两个公共接口（`60s.viki.moe`、`v2.xxapi.cn`）——
它们随时可能限流、改字段或下线，而且只有 6 个平台，接口清单写死在代码里。

改造后，配置一项即可切换到自托管的 [DailyHotApi](https://github.com/imsyy/DailyHotApi)：
**MIT 许可、40+ 站点、REST 与 RSS 双形态**，数据在自己手里。
未配置时，Easel 行为与改造前**完全一致**（原接口链保留为兜底）。

## 启动

```bash
cd deploy/dailyhot
docker compose up -d
```

自检（应返回 JSON）：

```bash
curl http://127.0.0.1:6688/weibo
```

## 让 Easel 用上它

在项目根的 `.env` 里加一行：

```
EASEL_DAILYHOT_BASE=http://127.0.0.1:6688
```

然后重启 Web 服务（`python -m easel.services restart web`）。热点雷达会自动：
- 优先从自托管服务取数；
- 解锁扩展平台（快手、36氪、掘金、少数派、IT之家、虎嗅、澎湃、贴吧、V2EX、豆瓣电影、腾讯/新浪/网易新闻、微信读书）；
- 某个平台在自托管服务上取不到时，原 6 个平台自动回落到原公开接口。

页面上的平台按钮由 `/api/trends/sources` 动态返回：没配置时只有 6 个，配置后变 20 个。

## 停止 / 移除

```bash
cd deploy/dailyhot
docker compose down          # 停止
docker compose down --rmi local   # 停止并删除本地构建产物（镜像仍为上游镜像）
```

## 费用说明（完全免费）

| 项目 | 情况 |
|---|---|
| 软件许可 | **MIT**，永久免费，无付费档位 |
| API key / 账号 | **不需要**，无注册、无登录、无订阅 |
| 数据库 / 中间件 | **不需要**。上游对 Redis 是**可选**依赖——连不上会自动回退到内存缓存 |
| 唯一成本 | 你自己机器的 CPU / 内存 / 磁盘（无任何费用） |

**首次启动会看到的现象（都属正常，不是故障）：**

1. 日志里可能出现一行 `📦 [Redis] connection failed` —— 上游是可选依赖，会自动用内存缓存，功能不受影响。
   （源码依据：`src/utils/cache.ts` 中 `lazyConnect` + 连接失败后 `isRedisAvailable=false`，读写均回退 `NodeCache`。）
2. **B站、微信读书**这两个源需要上游自行计算/获取平台公开参数（**不需要你的账号**，纯本地计算 + 公开接口），偶发失败属正常；取不到时页面会明确显示「实时热点暂时不可用」，不会静默出错。

## 来源与许可

见 `UPSTREAM.json`。上游为 MIT，镜像**原样使用**，没有补丁、没有内联其源码，
Easel 侧只通过 HTTP 只读消费 —— 属「直接依赖」这一最浅的复用深度；
若将来需要深度定制，优先在该目录加补丁并登记 `PROVENANCE.json`（参照 `deploy/postiz/patches/` 的做法）。
