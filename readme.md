# CSDN 博客导出

- 使用 `puppeteer` 模拟点击，导出自己专栏中的所有博客
- 只能导出自己写的
- 主要目的是为了迁移, 将 CSDN 的博客迁移到掘金或者 hexo 上

# 我可以

- 获取专栏文章的信息，包括 title,date,id
- 批量下载到当前 `my-articles` 文件夹下
- 批量处理 md 使其符合 hexo 的模板，模板可以在 `modify.js` 中的 `handleReplaceContent()` 方法里修改

# 使用说明

- 入口文件为 index.js，需要修改此文件中的 `targetURL` 变量为你自己的专栏地址
- 每个函数几乎都有注释

```bash
node ./index.js
```
