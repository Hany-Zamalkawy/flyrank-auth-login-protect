const USER_AGENT = 'FlyRankInternship-A9/1.0 (+https://github.com/Hany-Zamalkawy/flyrank-auth-login-protect)';
const TIMEOUT_MS = 8000;
const MIN_DELAY_MS = 500;
let lastRequestAt = 0;

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function politeWait() {
  const elapsed = Date.now() - lastRequestAt;
  if (lastRequestAt && elapsed < MIN_DELAY_MS) await sleep(MIN_DELAY_MS - elapsed);
  lastRequestAt = Date.now();
}

async function requestText(url) {
  let attempt = 0;
  while (true) {
    await politeWait();
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': USER_AGENT,
          'Accept': 'text/html,application/xhtml+xml;q=0.9,*/*;q=0.8'
        },
        signal: AbortSignal.timeout(TIMEOUT_MS),
        redirect: 'follow'
      });
      if (response.status === 200) return { status: response.status, body: await response.text() };
      const error = new Error(`HTTP ${response.status} for ${url}`);
      error.status = response.status;
      if (attempt === 0 && response.status >= 500 && response.status <= 599) {
        attempt += 1;
        await sleep(1000);
        continue;
      }
      throw error;
    } catch (error) {
      const isTimeout = error.name === 'TimeoutError' || error.name === 'AbortError';
      const isServerError = Number(error.status) >= 500 && Number(error.status) <= 599;
      const retryableNetwork = ['ECONNRESET', 'ETIMEDOUT'].includes(error.cause?.code);
      if (attempt === 0 && (isTimeout || isServerError || retryableNetwork)) {
        attempt += 1;
        await sleep(1000);
        continue;
      }
      throw error;
    }
  }
}

module.exports = { requestText, USER_AGENT, TIMEOUT_MS, MIN_DELAY_MS };
