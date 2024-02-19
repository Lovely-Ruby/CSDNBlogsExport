import path from "path";
import puppeteer from "puppeteer";
import asyncPool from "tiny-async-pool";
import { getPage, waitingOpenURL, findElement, clickImport } from "./tools.js";

const __dirname = path.resolve(path.dirname(""));
const myDownloadPath = `${__dirname}\\my-post`;

(async () => {
  // 关闭无头模式，显示浏览器窗口
  // userDataDir 表示把登录信息放到当前目录下，省着我们每次调用脚本都需要登录
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./userData",
  });
  const page = await browser.newPage();
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });
  let targetURL = "https://blog.csdn.net/u010263423/category_9162796.html";
  await page.goto(targetURL);
  await page.setViewport({ width: 1080, height: 1024 });
  const targetPageCount = await getPage(page);
  const willOpenArr = await waitingOpenURL(targetPageCount, targetURL);
  const findArray = [];
  findArray.push(...(await findElement(page)));
  if (targetPageCount > 1) {
    for (let i = 0; i < willOpenArr.length; i++) {
      await page.goto(willOpenArr[i]);
      findArray.push(...(await findElement(page)));
    }
  }

  const baseWriteURL = `https://editor.csdn.net/md/?articleId=`;
  const baseWriteURLArray = findArray.map((i) => `${baseWriteURL}${i.id}`);
  let successHandle = 0;
  async function handleURL(url) {
    const page = await browser.newPage();
    // 我能想到的就是，尽早设置这个玩意儿
    const client = await page.createCDPSession();
    await client.send("Page.setDownloadBehavior", {
      behavior: "allow",
      downloadPath: myDownloadPath,
    });
    page.on("dialog", async (dialog) => {
      await dialog.accept();
    });
    // 这个 Promise 就不影响，为什么？？？
    await new Promise((r) => setTimeout(r, 2000));
    await page.goto(url);
    await clickImport(page);
    await page.close();
    // 这个 new Promise 为什么会影响下载位置的设定？？？
    return `${url} 解析完成 ${++successHandle}`;
  }
  for await (const ms of asyncPool(2, baseWriteURLArray, handleURL)) {
    console.log(ms);
  }

  console.log("***已完成所有解析***");
})();
