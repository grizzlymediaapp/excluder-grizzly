export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const auth = req.headers['authorization'];
  if (auth !== 'Basic ' + Buffer.from('admin:Astaextr43!').toString('base64')) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const { url } = req.body;
  if (!url) return res.status(400).json({ error: 'No URL provided' });

  const cleanUrl = url.split('?')[0].trim();
  const videoIdMatch = cleanUrl.match(/\/video\/(\d+)/);
  const handleMatch = cleanUrl.match(/tiktok\.com\/@([^/?]+)/);
  const videoId = videoIdMatch ? videoIdMatch[1] : '';
  const handle = handleMatch ? '@' + handleMatch[1] : '';

  if (!videoId) return res.status(400).json({ error: 'Could not extract video ID from URL' });

  try {
    const response = await fetch(cleanUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
      },
      signal: AbortSignal.timeout(12000),
    });

    if (!response.ok) {
      return res.status(200).json({ videoId, handle, url: cleanUrl, isAi: null, status: 'error', reason: `HTTP ${response.status}` });
    }

    const html = await response.text();

    const jsonMatch = html.match(/<script id="__UNIVERSAL_DATA_FOR_REHYDRATION__"[^>]*>([\s\S]*?)<\/script>/);
    if (jsonMatch) {
      try {
        const data = JSON.parse(jsonMatch[1]);
        const item = data?.['__DEFAULT_SCOPE__']?.['webapp.video-detail']?.['itemInfo']?.['itemStruct'];
        if (item) {
          const isAigc = item['IsAigc'];
          const aigcType = item['aigcLabelType'];
          if (isAigc === true) return res.status(200).json({ videoId, handle, url: cleanUrl, isAi: true, status: 'flagged', reason: 'IsAigc:true' });
          if (isAigc === false && (!aigcType || aigcType === '0' || aigcType === '1')) {
            return res.status(200).json({ videoId, handle, url: cleanUrl, isAi: false, status: 'clean', reason: 'IsAigc:false' });
          }
          if (aigcType && aigcType !== '0') {
            return res.status(200).json({ videoId, handle, url: cleanUrl, isAi: true, status: 'flagged', reason: `aigcLabelType:${aigcType}` });
          }
        }
      } catch (e) {}
    }

    if (html.includes('"IsAigc":true') || html.includes('"is_aigc":true')) {
      return res.status(200).json({ videoId, handle, url: cleanUrl, isAi: true, status: 'flagged', reason: 'text match' });
    }
    if (html.includes('"IsAigc":false')) {
      return res.status(200).json({ videoId, handle, url: cleanUrl, isAi: false, status: 'clean', reason: 'text match' });
    }

    return res.status(200).json({ videoId, handle, url: cleanUrl, isAi: null, status: 'error', reason: 'could not parse page' });

  } catch (err) {
    const reason = err.name === 'TimeoutError' ? 'timeout' : (err.message || 'unknown error').slice(0, 60);
    return res.status(200).json({ videoId, handle, url: cleanUrl, isAi: null, status: 'error', reason });
  }
}
