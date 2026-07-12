# Codex 额度实时监控

面向 Windows 的 Codex 真实额度桌面小组件，采用轻量液态玻璃视觉风格。

## Windows 适配

- 支持 Windows 10/11 x64
- 需要已安装并登录 OpenAI Codex Windows 桌面应用
- 复用本机 Codex 登录状态，不要求手动填写 Token
- 跟随 Codex 启动和退出，不在任务栏显示
- 固定显示在主屏幕右上角
- 支持 Windows 多显示器与显示缩放

> 本项目依赖 Codex 桌面端本地登录文件及其用量服务。相关内部接口若发生变化，真实额度同步可能需要随之更新。

## 安装

先安装 [Node.js 20+](https://nodejs.org/)，然后在 PowerShell 中运行：

```powershell
Set-ExecutionPolicy -Scope Process Bypass
.\scripts\install.ps1
```

安装脚本会执行确定性依赖安装、注册当前用户登录计划任务，并启动隐藏监控器。计划任务支持异常自动重启；打开 Codex 后，小组件会自动出现，退出 Codex 后自动关闭。

## 卸载

```powershell
.\scripts\uninstall.ps1
```

## 本地开发

```powershell
npm ci
npm run check
npm start
```

## 推送前检查

```powershell
npm ci
npm run check
npm audit --omit=dev --audit-level=high
git status --short
```

GitHub Actions 会在 `windows-latest` 和 Node.js 22 环境中重复执行语法及生产依赖安全检查。

## 项目结构

```text
CodexQuotaMonitor/
├─ .github/workflows/windows-ci.yml  # Windows CI
├─ scripts/install.ps1               # 安装与自启动注册
├─ scripts/uninstall.ps1             # 卸载
├─ main.js                            # Electron 主进程、额度与环境采样
├─ preload.js                         # 安全 IPC 桥接
├─ renderer.js                        # 额度刷新与对比度渲染
├─ styles.css                         # 液态玻璃界面
└─ watcher.ps1                        # Codex 进程监控
```

## 隐私与安全

- 凭据仅由 Electron 主进程读取
- 渲染层只能获得额度百分比和重置时间
- 不记录或上传访问令牌
- Electron 使用 `contextIsolation: true`
