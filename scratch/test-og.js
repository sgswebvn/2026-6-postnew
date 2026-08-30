import app from '../api/index.js';
import http from 'http';

const server = http.createServer(app);
server.listen(3099, async () => {
  console.log('Test server listening on 3099');
  try {
    const res = await fetch('http://localhost:3099/post/tim-conway-completely-broke-the-cast-with-one-ridiculous-circus-story-', {
      headers: {
        'User-Agent': 'facebookexternalhit/1.1 (+http://www.facebook.com/externalhit_uatext.php)'
      }
    });
    console.log('Status code:', res.status);
    const text = await res.text();
    console.log('Preview first 400 chars:', text.slice(0, 400));
  } catch (e) {
    console.error('Fetch error:', e);
  } finally {
    server.close();
    process.exit(0);
  }
});
