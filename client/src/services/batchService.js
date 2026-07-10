export const sleep = (ms) => {
  return new Promise((resolve) => setTimeout(resolve, ms));
};

export const withTimeout = async (promise, timeoutMs = 15000) => {
  let timeoutId;

  const timeoutPromise = new Promise((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`Request timeout after ${timeoutMs} ms`));
    }, timeoutMs);
  });

  try {
    return await Promise.race([promise, timeoutPromise]);
  } finally {
    clearTimeout(timeoutId);
  }
};

export const retryRequest = async (
  requestFn,
  {
    retries = 3,
    delayMs = 1000,
    timeoutMs = 15000,
    shouldStop = () => false,
  } = {}
) => {
  let lastError;

  for (let attempt = 1; attempt <= retries; attempt++) {
    if (shouldStop()) {
      throw new Error("ยกเลิกการตรวจสอบ");
    }

    try {
      return await withTimeout(requestFn(), timeoutMs);
    } catch (error) {
      lastError = error;

      if (attempt < retries) {
        await sleep(delayMs * attempt);
      }
    }
  }

  throw lastError;
};

export const runBatchQueue = async ({
  items = [],
  worker,
  concurrency = 5,
  retries = 3,
  delayMs = 1000,
  timeoutMs = 15000,
  onProgress,
  shouldStop = () => false,
}) => {
  const results = new Array(items.length);
  let currentIndex = 0;
  let completed = 0;

  const runWorker = async () => {
    while (currentIndex < items.length) {
      if (shouldStop()) break;

      const index = currentIndex;
      currentIndex += 1;

      const item = items[index];

      try {
        const result = await retryRequest(() => worker(item), {
          retries,
          delayMs,
          timeoutMs,
          shouldStop,
        });

        results[index] = result;
      } catch (error) {
        results[index] = {
          ...item,
          status: "ไม่พบข้อมูล",
          updatedAt: "-",
          error: error.message || "เกิดข้อผิดพลาด",
        };
      }

      completed += 1;

      if (typeof onProgress === "function") {
        onProgress({
          completed,
          total: items.length,
          percent: Math.round((completed / items.length) * 100),
          latestResult: results[index],
          index,
        });
      }
    }
  };

  const workerCount = Math.min(concurrency, items.length);

  await Promise.all(
    Array.from({ length: workerCount }, () => runWorker())
  );

  return results.filter(Boolean);
};