import puppeteer from "puppeteer";

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
    console.log("here");
    await dialog.accept();
  });
  await page.goto(targetURL);
  await page.setViewport({ width: 1080, height: 1024 });
  const targetPageCount = await getPage(page);
  const willOpenArr = await waitingOpenURL(targetPageCount, targetURL);
  const findArray = [];
  console.log("willOpenArr:>>", willOpenArr);
  findArray.push(...(await findElement(page)));
  if (targetPageCount > 1) {
    for (let i = 0; i < willOpenArr.length; i++) {
      await page.goto(willOpenArr[i]);
      findArray.push(...(await findElement(page)));
    }
  }
  console.log(findArray);
  for (let i = 0; i < findArray.length; i++) {
    const eachID = findArray[i]["id"];
    targetURL = `https://editor.csdn.net/md/?articleId=${eachID}`;
    await page.goto(targetURL, { timeout: 10000, waitUntil: "load" });
    await clickImport(page);
  }
  // 点击每个标题

  //   const linksTitle = await listElement.$$(".title");
  //   const linksDate = await listElement.$$(".column_article_data>.status");

  //   const titles = await linksTitle.$$eval('.title', element => element.map(i => i.innerHTML));
  //   console.log(titles);
  //   // Type into search box
  //   await page.type(".devsite-search-field", "automate beyond recorder");

  //   // Wait and click on first result
  //   const searchResultSelector = ".devsite-result-item-link";
  //   await page.waitForSelector(searchResultSelector);
  //   await page.click(searchResultSelector);

  //   // Locate the full title with a unique string
  //   const textSelector = await page.waitForSelector(
  //     "text/Customize and automate"
  //   );
  //   const fullTitle = await textSelector?.evaluate((el) => el.textContent);

  //   // Print the full title
  //   console.log('The title of this blog post is "%s".', fullTitle);

  //   await browser.close();
})();
