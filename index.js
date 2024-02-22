import path from "path";

import fs from "fs";
import {
  getPage,
  waitingOpenURL,
  findElement,
  clickImport,
  asyncPool,
  initBrowser,
} from "./tools.js";

// const myDownloadPath = `${__dirname}\\my-articles`;
const POOL_LIMIT = 3;

/**
 * 说明：csdn 中的导出，会将一些 windows 路径不允许存在的字符都变成 _
 * @param {*} s
 * @returns
 */
function strHandle(s) {
  const reg = /\/|\:|\?|\*/g;
  return s.replace(reg, "_");
}

(async () => {
  // 关闭无头模式，显示浏览器窗口
  // userDataDir 表示把登录信息放到当前目录下，省着我们每次调用脚本都需要登录

  const page = await initBrowser();

  // const browser = await puppeteer.launch({
  //   headless: false,
  //   userDataDir: "./userData",
  // });
  // const page = await browser.newPage();
  // const client = await page.createCDPSession();
  // await client.send("Page.setDownloadBehavior", {
  //   behavior: "allow",
  //   downloadPath: myDownloadPath,
  // });
  // page.on("dialog", async (dialog) => {
  //   await dialog.accept();
  // });
  let targetURL = "https://blog.csdn.net/u010263423/category_9468795.html"; // 【技术向】教程
  await page.goto(targetURL);
  // await page.setViewport({ width: 1080, height: 1024 });
  const targetPageCount = await getPage(page);
  console.log(
    `********** Notice: 此专栏共有 ${targetPageCount} 页，正在获取所有文章 id **********`
  );
  const willOpenArr = await waitingOpenURL(targetPageCount, targetURL);
  const findArray = [];

  findArray.push(...(await findElement(page)));
  if (targetPageCount > 1) {
    for (let i = 0; i < willOpenArr.length; i++) {
      await page.goto(willOpenArr[i]);
      findArray.push(...(await findElement(page)));
    }
  }

  const id2info = {};
  for (let i of findArray) {
    const obj = {
      ...i,
    };
    const id = obj["id"];
    const title = obj["title"];
    obj.findPath = strHandle(title);
    id2info[id] = obj;
  }

  fs.writeFileSync(`${__dirname}\\id2info.json`, JSON.stringify(id2info), {
    flag: "w",
  });

  const allProgress = findArray.length;

  const baseWriteURL = `https://editor.csdn.net/md/?articleId=`;
  const baseWriteURLArray = findArray.map((i) => `${baseWriteURL}${i.id}`);
  let successHandle = 0;
  console.log(
    `********** Notice: 浏览器将最大并发保持 ${POOL_LIMIT} 个标签页工作. **********`
  );

  function handleURL(url) {
    return new Promise(async (resolve, reject) => {
      const page = await browser.newPage();
      const articleId = url.split("articleId=")[1] || "";
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      try {
        await page.goto(url, {
          waitUntil: "networkidle2",
        });
        await clickImport(page).then((res) => {
          const currentProgress = String(++successHandle).padStart(2, 0);
          console.log(
            `[${currentProgress} / ${allProgress}] 导出完成. articleId: ${articleId}  `
          );
        });
        await page.close();
        resolve();
      } catch (err) {
        console.log(`${url} ${err}`);
        await page.close();
        reject();
      } finally {
      }
    });
  }
  await asyncPool(3, baseWriteURLArray, handleURL);
  console.log("Finished!!!: 已完成所有解析，即将关闭浏览器。");
  // 防止最后一个文件下载失败，所以关闭之前给一些时间 io
  await new Promise((r) => setTimeout(r, 5000));
  await browser.close();
})();
