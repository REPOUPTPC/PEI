import type { NextApiRequest, NextApiResponse } from 'next';
import { uploadToR2 } from '@/lib/s3';

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb',
    },
  },
};

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { base64Data, fileName, mimeType, cedula } = req.body;

    if (!base64Data) {
      return res.status(400).json({ error: 'No image data provided' });
    }

    // Extract raw base64 and mime type
    const matches = base64Data.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
    let buffer: Buffer;
    let detectedMime = mimeType || 'image/jpeg';

    if (matches && matches.length === 3) {
      detectedMime = matches[1];
      buffer = Buffer.from(matches[2], 'base64');
    } else {
      buffer = Buffer.from(base64Data, 'base64');
    }

    const ext = detectedMime.includes('png') ? 'png' : 'jpg';
    const cleanCedula = (cedula || 'docente').replace(/[^a-zA-Z0-9_-]/g, '');
    const cleanFileName = fileName || `${cleanCedula}_${Date.now()}.${ext}`;

    const publicUrl = await uploadToR2(buffer, cleanFileName, detectedMime);

    return res.status(200).json({
      success: true,
      url: publicUrl,
      fileName: cleanFileName,
    });
  } catch (error: any) {
    console.error('Error uploading to R2:', error);
    return res.status(500).json({ error: error.message || 'Error al subir imagen a R2' });
  }
}
