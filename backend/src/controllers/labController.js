import { getLabManifest, validateControlledLab } from '../services/lab.js';

export async function getManifest(req, res) {
  try {
    const manifest = getLabManifest();
    return res.json({ manifest });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function validateLab(req, res) {
  try {
    const report = await validateControlledLab();
    return res.json({ validation: report });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
