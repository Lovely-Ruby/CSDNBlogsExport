// https://github.com/rxaviers/async-pool/blob/1.x/lib/es7.js
async function asyncPool(poolLimit, iterable, iteratorFn) {
  const ret = [];
  const executing = new Set();
  for (const item of iterable) {
    const p = Promise.resolve().then(() => iteratorFn(item));
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

const timeout = (i) => {
  console.log("开始" + i);
  return new Promise((resolve) =>
    setTimeout(() => {
      resolve(i);
      console.log("结束" + i);
    }, 1000 + Math.random() * 1000)
  );
};

let urls = Array(10)
  .fill(0)
  .map((v, i) => i);
console.log(urls);

(async () => {
  const res = await asyncPool(2, urls, timeout);
  console.log(res);
})();
