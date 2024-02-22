import {
  initBrowser,
  getInfo,
  exportInfo2Json,
  exportArticles,
} from "./modules.js";

const POOL_LIMIT = 3;
// 将要爬取的专栏地址
let targetURL = "https://blog.csdn.net/u010263423/category_9468795.html";

(async () => {
  const { browser, page } = await initBrowser();
  await page.goto(targetURL);
  const findArray = await getInfo({ page, targetURL });
  await exportInfo2Json(findArray);
  await exportArticles({ browser, findArray, POOL_LIMIT });
  await browser.close();
})();
