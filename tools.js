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
  console.log(pageCount);
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

  await page.waitForSelector(".column_article_list");
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
  await new Promise((r) => setTimeout(r, 1500));
  const exportButton =
    "div.layout__panel.layout__panel--navigation-bar.clearfix > nav > div.scroll-box > div:nth-child(1) > div:nth-child(22) > button";
  await page.waitForSelector(exportButton);
  await page.click(exportButton);
  // await new Promise((r) => setTimeout(r, 500));

  const nextExportButton =
    "div.side-bar__inner > div.side-bar__panel.side-bar__panel--menu > a:nth-child(1)";
  await page.waitForSelector(nextExportButton);
  await page.click(nextExportButton);
  // 这个时间是不能省的，一定要给点击事件留点时间，
  // 不然直接跳转页面，下载就失效了
  await new Promise((r) => setTimeout(r, 500));
}

export function handleWriteURLs(url) {
  return new Promise((resolve) => {
    console.log(url);
    resolve();
  });
}
