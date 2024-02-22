import fs from "fs-extra";
import path from "path";
import { removeDir } from "./tools.js";

const __dirname = path.resolve(path.dirname(""));
const id2info = JSON.parse(
  await fs.readFileSync(`${__dirname}\\id2info.json`, "utf-8")
);
const reg = /\@\[toc\]\(.*?\)|\@\[toc\]/i;
const allArticles = Object.keys(id2info);

const myArticlesPath = `${__dirname}\\my-articles`;

const tags = `建站`;
const handleReplaceContent = (articleId) => {
  const { date, id, title } = id2info[articleId];
  return `---
tags:
  - ${tags}
categories: 计算机语言
date: ${date}
abbrlink: ${id}
title: ${title}
---
    
<meta name="referrer" content="no-referrer" />
`;
};

try {
  /**
   * 检测是否有 my-articles-handle 文件夹
   */
  const handlePath = path.resolve(myArticlesPath, "..", "my-articles-handle");
  if (fs.existsSync(handlePath)) {
    removeDir(handlePath);
  }
  fs.mkdirSync(handlePath);
  for (let articleId of allArticles) {
    /**
     * 读文件
     */
    const { findPath } = id2info[articleId];
    let eachArticlePath = `${myArticlesPath}\\${findPath}.md`;
    const content = fs.readFileSync(eachArticlePath, "utf8");
    const replaceContent = handleReplaceContent(articleId);
    let afterContent = "";
    /**
     * 拼接文章内容：文章分两种情况
     * - 一种是头部有 @[toc]()之类的
     * - 另一种是什么都没有的
     */
    if (content.match(reg) !== null) {
      const splitContent = content.split(reg)[1];
      afterContent = `${replaceContent}\n${splitContent}`;
    } else {
      afterContent = `${replaceContent}\n${content}`;
    }

    /**
     * 写文件
     */
    const afterPath = path.resolve(handlePath, `${findPath}.md`);
    fs.writeFileSync(afterPath, afterContent, { flag: "w" });
  }
} catch (e) {
  console.log(e);
}
