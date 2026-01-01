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
    res.setHeader('Content-Disposition', 'attachment; filename="encrypted_file.enc"');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET');
    
    // The service worker should intercept this request
    // If we reach here, the service worker didn't intercept properly
    console.log('[API] /download-file endpoint reached - service worker may not be ready');
    
    // Return a minimal response that indicates the service worker should handle this
    res.status(202).json({ 
      message: 'Encryption in progress - service worker will handle download',
      status: 'waiting'
    });
  } catch (error) {
    console.error('[API] Download preparation failed:', error);
    res.status(500).json({ error: 'Download preparation failed', details: error.message });
  }
}
