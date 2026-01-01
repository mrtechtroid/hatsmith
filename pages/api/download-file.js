// API route to handle file downloads
// This route works with the service worker to provide encrypted file downloads

export default function handler(req, res) {
  // This endpoint is intercepted by the service worker
  // The service worker will handle the actual file streaming
  // We just need to provide a valid response that the service worker can intercept
  
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Set headers that indicate this is a file download
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Cache-Control', 'no-cache');
    
    // The service worker will intercept this and provide the actual file content
    res.status(200).end();
  } catch (error) {
    res.status(500).json({ error: 'Download preparation failed' });
  }
}
