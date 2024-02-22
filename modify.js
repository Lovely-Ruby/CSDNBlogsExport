import fs from "fs-extra";
import path from "path";
const __dirname = path.resolve(path.dirname(""));
const myArticlesPath = `${__dirname}\\my-articles`;

const reg = /\@\[toc\]\(.*?\)|\@\[toc\]/i;
const id2info = JSON.parse(
  await fs.readFileSync(`${__dirname}\\id2info.json`, "utf-8")
);

function removeDir(path) {
  let data = fs.readdirSync(path);
  for (let i = 0; i < data.length; i++) {
    // 判断是文件或者是目录
    // 文件：直接删除
    // 目录：继续查找
    let url = path + "/" + data[i];
    let stat = fs.statSync(url);
    if (stat.isDirectory()) {
      // 继续查找,递归
      removeDir(url);
    } else {
      // 文件删除
      fs.unlinkSync(url);
    }
  }
  // 删除空目录
  fs.rmdirSync(path);
}

const allArticles = Object.keys(id2info);

const handleReplaceContent = (articleId) => {
  const info = id2info[articleId];
  const date = info["date"];
  const id = info["id"];
  const title = info["title"];
  return `---
tags:
  - Javascript 笔记
categories: 计算机语言
date: ${date}
abbrlink: ${id}
title: ${title}
---
    
<meta name="referrer" content="no-referrer" />
`;
};

try {
  const handlePath = path.resolve(myArticlesPath, "..", "my-articles-handle");
  if (fs.existsSync(handlePath)) {
    removeDir(handlePath);
  }
  fs.mkdirSync(handlePath);
  for (let articleId of allArticles) {
    const { findPath, title } = id2info[articleId];
    console.log(findPath);
    let eachArticlePath = `${myArticlesPath}\\${findPath}.md`;
    const content = fs.readFileSync(eachArticlePath, "utf8");
    const replaceContent = handleReplaceContent(articleId);
    let afterContent = "";
    // 分两种添加，一种是替代，另一种是文件头追加
    if (content.match(reg) !== null) {
      const splitContent = content.split(reg)[1];
      afterContent = `${replaceContent}\n${splitContent}`;
    } else {
      afterContent = `${replaceContent}\n${content}`;
    }
    const afterPath = path.resolve(handlePath, `${findPath}.md`);
    fs.writeFileSync(afterPath, afterContent, { flag: "w" });
  }
} catch (e) {
  console.log(e);
}
