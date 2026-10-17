import { generateJsonReport, generateCsvReport } from '../services/reports.js';

export async function getReportJson(req, res) {
  try {
    const { id } = req.params;
    const report = await generateJsonReport(id);
    return res.json(report);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getReportCsv(req, res) {
  try {
    const { id } = req.params;
    const csvData = await generateCsvReport(id);

    res.setHeader('Content-Type', 'text/csv; charset=utf-8');
    res.setHeader('Content-Disposition', `attachment; filename="netscope_audit_${id}.csv"`);
    return res.status(200).send(csvData);
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
