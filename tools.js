function retry(fn, times, item) {
  const allTime = times;
  const articleId = item.split("articleId=")[1] || "";
  return new Promise((res, rej) => {
    const attempt = () => {
      const currTime = allTime - times + 1;
      fn()
        .then(() => {
          console.log(
            `Retry Success: 第 ${currTime} 次重试 ${articleId} 成功!`
          );
          res(item);
        })
        .catch((error) => {
          console.log(`Warning: 第 ${currTime} 次重试 ${articleId} `);
          if (times-- > 0) {
            attempt();
          } else {
            console.log(
              `Error:  已经重试 ${item} 文章 ${currTime} 次，机会已用光`
            );
            rej();
          }
        });
    };
    attempt();
  });
}

// https://github.com/rxaviers/async-pool/blob/1.x/lib/es7.js
export async function asyncPool(poolLimit, iterable, iteratorFn) {
  const ret = [];
  const executing = new Set();
  for (let i = 0, len = iterable.length; i < len; i++) {
    const item = iterable[i];
    const articleId = item.split("articleId=")[1] || "";
    const p = Promise.resolve()
      .then(() => iteratorFn(item))
      .catch(async (err) => {
        console.log(`${articleId} 解析失败，即将重试`);
        // 这里的 retry 也添加上 await
        await retry(() => iteratorFn(item), 3, item).catch(() => {});
      });
    ret.push(p);
    executing.add(p);
    const clean = () => executing.delete(p);
    p.then(clean).catch(clean);
    if (executing.size >= poolLimit) {
      await Promise.race(executing);
    }
  }
  return Promise.all(ret);
}

/**
 * 功能：获取文章标题
 * @param {*} lis
 * @returns
 */
export async function getTitle(lis) {
  const titles = await lis.$$eval(".title", (elements) => {
    return elements.map((e) =>
      e.innerHTML
        .replace("\n", "")
        .split("<!--####试读-->")[0]
        .replace("\n", "")
        .trim()
    );
  });
  return titles;
}

/**
 * 功能：获取文章写作时间
 * - nth-child 选择器从1开始，前面尽量是标签名吧，如果是类的话，我试了一下选择不到
 * @param {*} lis
 */
export async function getDate(lis) {
  const titleDate = await lis.$$eval(
    ".column_article_data span:nth-child(2)",
    (elements) => {
      return elements.map((e) => e.innerHTML.trim().split(" &nbsp")[0]);
    }
  );
  return titleDate;
}

export async function getID(lis) {
  const titleId = await lis.$$eval("a", (elements) => {
    return elements.map((e) => e.href.split("details/")[1]);
  });
  return titleId;
}

export async function getPage(page) {
  const pageContainer = await page.$(".ui-paging-container");
  let pageCount = 1;
  if (pageContainer) {
    const pageContext = await pageContainer.$$eval(".ui-pager", (elements) => {
      return elements.map((e) => e.innerHTML);
    });
    pageCount = Number(pageContext[pageContext.length - 3]);
  }

  return pageCount;
}

export async function waitingOpenURL(targetPageCount, targetURL) {
  const arr = [];
  if (targetPageCount > 1) {
    for (let i = 2; i <= targetPageCount; i++) {
      const front = targetURL.split(".html")[0];
      const url = `${front}_${i}.html`;
      arr.push(url);
    }
  }
  return arr;
}

export async function findElement(page) {
  // 等待页面选择器的出现
  await page.waitForSelector(".column_article_list", { timeout: 5000 });
  const lis = await page.$(".column_article_list");

  // 获取文章标题、写作时间、文章id
  const titles = await getTitle(lis);
  const titleId = await getID(lis);
  const titleDate = await getDate(lis);

  // 整理成数组对象
  const notes = [];
  titles.forEach((item, index) => {
    const obj = {
      title: item,
      date: titleDate[index],
      id: titleId[index],
    };
    notes.push(obj);
  });
  return notes;
}

/**
 * 功能: 点击导出按钮
 * @param {*} page
 */
export async function clickImport(page) {
  return new Promise(async (resolve, reject) => {
    try {
      const exportButton =
        "div.layout__panel.layout__panel--navigation-bar.clearfix > nav > div.scroll-box > div:nth-child(1) > div:nth-child(22) > button";
      await page.waitForSelector(exportButton, { timeout: 5000 });
      await page.click(exportButton);
      // await new Promise((r) => setTimeout(r, 1000));

      const nextExportButton =
        "div.side-bar__inner > div.side-bar__panel.side-bar__panel--menu > a:nth-child(1)";
      await page.waitForSelector(nextExportButton, { timeout: 5000 });
      await page.click(nextExportButton);
      // 这个时间是不能省的，一定要给点击事件留点时间，
      // 不然直接跳转页面，下载就失效了
      await new Promise((r) => setTimeout(r, 100));
      resolve();
    } catch (err) {
      reject(err);
    }
  });
}

export function handleWriteURLs(url) {
  return new Promise((resolve) => {
    console.log(url);
    resolve();
  });
}
