const { requestText } = require('./http');

(async () => {
  const url = 'https://books.toscrape.com/robots.txt';
  try {
    const response = await requestText(url);
    console.log(`robots_url=${url}`);
    console.log(`status=${response.status}`);
    console.log(response.body || '(empty robots.txt)');
  } catch (error) {
    console.error(`robots_url=${url}`);
    console.error(`robots_check_failed=${error.message}`);
    console.error('Do not interpret a failed or missing robots.txt request as permission. Check the site manually before running against it.');
    process.exitCode = 1;
  }
})();
