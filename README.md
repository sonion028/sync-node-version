# sync-node-version

`sync-node-version` 是一个用于同步 Node.js 版本的小工具。

它会读取当前项目 `package.json` 中配置的 Node.js 版本，并写入 `.node-version` 文件，方便配合 nodenv、fnm、asdf 等工具统一项目 Node.js 版本。

## 功能

从当前项目的 `package.json` 中读取 Node.js 版本，并同步到 `.node-version`。

读取优先级：

1. `devEngines.runtime.version`
2. `engines.node`

支持的版本写法包括：

- `20`
- `20.19`
- `20.19.0`
- `>=20.19.0`
- `^20.19.0`
- `~20.19.0`
- `=20.19.0`
- `^20.19.0 || >=22.12.0`

默认情况下，如果版本范围中包含多个版本，会提取并写入其中最大的纯数字版本号。

## 安装

推荐安装为项目开发依赖：

```bash
npm install -D sync-node-version
```

也可以全局安装：

```bash
npm install -g sync-node-version
```

## 使用方法

在项目根目录执行：

```bash
sync-node-version
```

执行后会根据当前项目的 `package.json` 生成或更新 `.node-version`。

默认写入纯数字版本。

例如：

```json
{
  "devEngines": {
    "runtime": {
      "version": ">=20.0.0"
    }
  }
}
```

执行后会写入：

```txt
20.0.0
```

如果配置了多个版本范围，例如：

```json
{
  "engines": {
    "node": "^20.19.0 || >=22.12.0"
  }
}
```

默认会写入其中最大的纯数字版本号：

```txt
22.12.0
```

如果希望保留完整版本范围，可以执行：

```bash
sync-node-version --version-range
```

等价于：

```bash
sync-node-version --version-range=true
```

此时会写入经过验证和格式化后的版本范围：

```txt
^20.19.0 || >=22.12.0
```

也可以显式关闭范围写入：

```bash
sync-node-version --version-range=false
```

如果没有配置 `devEngines.runtime.version`，则会使用 `engines.node`：

```json
{
  "engines": {
    "node": ">=18.18.0"
  }
}
```

## 说明

`sync-node-version` 会在当前执行目录查找 `package.json`，并将解析出的 Node.js 版本写入当前目录下的 `.node-version`。
