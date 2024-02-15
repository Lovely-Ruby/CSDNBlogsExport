import puppeteer from "puppeteer";
import asyncPool from "tiny-async-pool";
import { getPage, waitingOpenURL, findElement, clickImport } from "./tools.js";

(async () => {
  // 关闭无头模式，显示浏览器窗口
  // userDataDir 表示把登录信息放到当前目录下，省着我们每次调用脚本都需要登录了
  const browser = await puppeteer.launch({
    headless: false,
    userDataDir: "./userData",
  });
  const page = await browser.newPage();
  let targetURL = "https://blog.csdn.net/u010263423/category_9162796.html";
  page.on("dialog", async (dialog) => {
    await dialog.accept();
  });
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
  const handleURL = (url) =>
    new Promise(async (resolve) => {
      const page = await browser.newPage();
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      await page.goto(url);
      await clickImport(page);
      await page.close();
      resolve(`${url} 解析完成 ${++successHandle}`);
    });

  for await (const ms of asyncPool(2, baseWriteURLArray, handleURL)) {
    console.log(ms);
  }
})();
