# Little Bunny's Home 🐇

一个可以直接部署到 GitHub Pages 的静态个人主页。

## 文件

- `index.html`：主页
- `style.css`：全部视觉与动画
- `script.js`：北京时间、杭州天气、兔兔日程、花园互动、工具、音乐
- `assets/fairy-home.png`：梦幻童话风视觉背景
- `.nojekyll`：避免 GitHub Pages 对静态资源做 Jekyll 处理

## 1. 上传到 GitHub

新建一个仓库，把这些文件直接上传到仓库根目录。

如果你想要个人主页，仓库名建议使用：

`你的GitHub用户名.github.io`

GitHub Pages 会以 `index.html` 作为入口文件。

## 2. 打开 GitHub Pages

Repository → Settings → Pages → Build and deployment → Source 选择 GitHub Actions 或从 `main` 分支发布。

最简单的静态站方式是选择 `main` / `root`。

## 3. 修改网易云歌单

打开 `script.js`，找到：

`const NETEASE_PLAYLIST_URL = "https://music.163.com/";`

替换成你的网易云歌单地址。

### 关于“自动播放”

浏览器通常会阻止网页首次打开时自动播放声音，这是浏览器的安全策略，不是 GitHub Pages 的问题。

如果你有合法可公开访问的 mp3/ogg 音频文件，可以：

1. 放进 `assets/music.mp3`
2. 把 `AUDIO_URL` 改成 `assets/music.mp3`

第一次点击页面后即可启动背景音乐。

如果要直接播放网易云的具体歌曲，不能简单把网易云页面地址当作 mp3 音频地址。网易云歌单入口已经做好，点击会打开你的歌单。

## 4. 天气

页面使用 Open-Meteo 的公开天气接口，以杭州坐标和 `Asia/Shanghai` 时区读取天气。无需 API Key。

## 5. 兔兔

页面中的兔兔使用统一的原创 CSS/SVG 风格角色，不依赖多张不同兔子图片，因此读书、浇花、做饭、散步、睡觉时仍然是同一只兔兔。

你可以继续把它升级成更丰富的逐帧动画或 Lottie 动画。
