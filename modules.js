import fs from "fs";
import path from "path";
import readline from "readline";
// const process = require("child_process");
import { exec, spawn } from "node:child_process";
import puppeteer from "puppeteer";
import {
  strHandle,
  getPage,
  asyncPool,
  waitingOpenURL,
  clickImport,
  findElement,
  padStartCount,
} from "./tools.js";

const __dirname = path.resolve(path.dirname(""));
const myDownloadPath = `${__dirname}\\my-articles`;

export function exportArticles({ browser, findArray, POOL_LIMIT = 2 }) {
  return new Promise(async (resolve, reject) => {
    try {
      const allProgress = padStartCount(findArray.length);
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
              const currentProgress = padStartCount(++successHandle);
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
      await asyncPool(POOL_LIMIT, baseWriteURLArray, handleURL);
      console.log("Finished!!!: 已完成所有解析，即将关闭浏览器。");
      await new Promise((r) => setTimeout(r, 5000)); // 防止最后一个文件下载失败，所以关闭之前给一些时间 io
      resolve();
    } catch (e) {
      console.log("Error exportArticles:>>", e);
      reject(e);
    } finally {
    }
  });
}

/**
 * 功能：导出文章信息到 json 中
 * @param {*} arr
 * @returns
 */
export function exportInfo2Json(arr) {
  return new Promise(async (resolve, reject) => {
    try {
      const id2info = {};
      for (let i of arr) {
        const obj = {
          ...i,
        };
        const id = obj["id"];
        const title = obj["title"];
        obj["findPath"] = strHandle(title);
        id2info[id] = obj;
      }
      // 这里如果使用 __dirname 就会报错
      fs.writeFileSync(`${__dirname}\\id2info.json`, JSON.stringify(id2info), {
        flag: "w",
      });
      resolve();
    } catch (e) {
      reject("Error: exportInfo2Json:>>", e);
    }
  });
}

/**
 * 功能：获取专栏页数信息
 * @param {*} param0
 * @returns
 */
export function getInfo({ page, targetURL }) {
  return new Promise(async (resolve, reject) => {
    try {
      const pageCount = await getPage(page);
      console.log(
        `********** Notice: 此专栏共有 ${pageCount} 页，正在获取所有文章 id **********`
      );
      const willOpenArr = await waitingOpenURL(pageCount, targetURL);
      const findArray = [];

      findArray.push(...(await findElement(page)));
      if (pageCount > 1) {
        for (let i = 0; i < willOpenArr.length; i++) {
          await page.goto(willOpenArr[i]);
          findArray.push(...(await findElement(page)));
        }
      }

      resolve(findArray);
    } catch (e) {
      reject("Error getInfo:>>", e);
    }
  });
}

/**
 * - 功能：初始化浏览器，配置下载路径，以及监听 dialog 弹出
 * - headless:false 关闭无头模式，显示浏览器窗口
 * - userDataDir 表示把登录信息放到当前目录下，省着我们每次调用脚本都需要登录
 * @returns
 */
export function initBrowser() {
  return new Promise(async (resolve, reject) => {
    try {
      // 关闭无头模式，显示浏览器窗口
      // userDataDir 表示把登录信息放到当前目录下，省着我们每次调用脚本都需要登录
      const browser = await puppeteer.launch({
        headless: false,
        userDataDir: "./userData",
      });
      const page = await browser.newPage();
      // await page.setViewport({ width: 1080, height: 1024 });
      const client = await page.createCDPSession();
      await client.send("Page.setDownloadBehavior", {
        behavior: "allow",
        downloadPath: myDownloadPath,
      });
      page.on("dialog", async (dialog) => {
        await dialog.accept();
      });
      resolve({ browser, page });
    } catch (e) {
      console.log(e);
      reject(e);
    }
  });
}

export function handleHexoUseCmd() {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
  rl.question("是否立即处理成 hexo 文章? y/n：", (answer) => {
    if (answer === "y") {
      // 执行 npm run build 命令
      exec("modify.cmd", (err, stdout, stderr) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("处理完成");
        rl.close();
      });
    } else {
      rl.close();
    }
  });
}
