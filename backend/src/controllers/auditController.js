import { Audit } from '../models/Audit.js';
import { Resource } from '../models/Resource.js';
import { Measurement } from '../models/Measurement.js';
import { runFullAuditPipeline } from '../services/pipeline.js';
import { buildDependencyGraph } from '../services/graph.js';
import { validateTargetUrl } from '../services/security.js';
import { detectUrlTypo, diagnoseFailureStage } from '../services/typoDetector.js';
import {
  generateSmartFindings,
  generateTrustSignals,
  generateEasyNotes,
} from '../services/explanationEngine.js';

/**
 * Pre-flight URL & Typo Analysis Endpoint
 */
export async function analyzeUrl(req, res) {
  try {
    const { url, referenceDomains = [] } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    const typoResult = detectUrlTypo(url, { referenceDomains });
    const diagnostics = await diagnoseFailureStage(url);

    return res.json({
      originalUrl: url,
      typoDetected: typoResult.hasMistake || false,
      typoInfo: typoResult.hasMistake ? typoResult : null,
      diagnostics,
      suggestedUrl: typoResult.suggestedUrl || null,
      canProceed: !typoResult.hasMistake && diagnostics.stageIndex === -1,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function createAudit(req, res) {
  try {
    const { url, options = {} } = req.body;
    if (!url) {
      return res.status(400).json({ error: 'Target URL is required' });
    }

    // Pre-validate URL and security rules
    const validation = await validateTargetUrl(url, { allowLab: options.allowLab });
    if (!validation.isValid) {
      // Check if this validation failure was caused by a detectable typo
      const typoResult = detectUrlTypo(url);
      const diagnostics = await diagnoseFailureStage(url);

      return res.status(400).json({
        error: validation.error,
        typoDetected: typoResult.hasMistake || false,
        typoInfo: typoResult.hasMistake ? typoResult : null,
        diagnostics,
        suggestedUrl: typoResult.suggestedUrl || null,
      });
    }

    // Launch pipeline in background to keep API responsive
    runFullAuditPipeline(url, options).catch((err) => {
      console.error(`Audit pipeline background error for ${url}:`, err);
    });

    // Find the newly initialized audit
    let audit = null;
    for (let i = 0; i < 10; i++) {
      audit = await Audit.findOne({ url: validation.parsedUrl.toString() }).sort({ createdAt: -1 });
      if (audit) break;
      await new Promise((r) => setTimeout(r, 200));
    }

    return res.status(201).json({
      message: 'Audit started successfully',
      audit: audit || { url, status: 'validating', progress: 5 },
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function listAudits(req, res) {
  try {
    const { page = 1, limit = 20, status } = req.query;
    const query = {};
    if (status) query.status = status;

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);
    const [audits, total] = await Promise.all([
      Audit.find(query).sort({ createdAt: -1 }).skip(skip).limit(parseInt(limit, 10)),
      Audit.countDocuments(query),
    ]);

    return res.json({
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      audits,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getAuditById(req, res) {
  try {
    const { id } = req.params;
    const audit = await Audit.findById(id);
    if (!audit) {
      return res.status(404).json({ error: `Audit ${id} not found` });
    }
    return res.json({ audit });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getAuditResources(req, res) {
  try {
    const { id } = req.params;
    const { type, classification, isThirdParty } = req.query;

    const resourceQuery = { auditId: id };
    if (type) resourceQuery.resourceType = type;
    if (isThirdParty !== undefined) resourceQuery.isThirdParty = isThirdParty === 'true';

    const resources = await Resource.find(resourceQuery).sort({ discoveredAt: 1 }).lean();
    const measurements = await Measurement.find({ auditId: id }).lean();

    const measurementMap = new Map();
    for (const m of measurements) {
      measurementMap.set(m.url, m);
    }

    let combined = resources.map((r) => ({
      ...r,
      measurement: measurementMap.get(r.url) || null,
    }));

    if (classification) {
      combined = combined.filter(
        (c) => c.measurement?.classification?.overall === classification
      );
    }

    return res.json({
      auditId: id,
      count: combined.length,
      resources: combined,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

export async function getAuditGraph(req, res) {
  try {
    const { id } = req.params;
    const audit = await Audit.findById(id);
    if (!audit) {
      return res.status(404).json({ error: `Audit ${id} not found` });
    }

    const resources = await Resource.find({ auditId: id }).lean();
    const measurements = await Measurement.find({ auditId: id }).lean();

    const graph = buildDependencyGraph(audit, resources, measurements);
    return res.json({
      auditId: id,
      targetHost: audit.targetHost,
      graph,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Returns structured findings generated by the Easy Explanation Engine
 */
export async function getAuditFindings(req, res) {
  try {
    const { id } = req.params;
    const { status, severity, category, query } = req.query;

    const audit = await Audit.findById(id).lean();
    if (!audit) return res.status(404).json({ error: `Audit ${id} not found` });

    const resources = await Resource.find({ auditId: id }).lean();
    const measurements = await Measurement.find({ auditId: id }).lean();

    let findings = generateSmartFindings(audit, resources, measurements);

    // Apply query filters
    if (status) findings = findings.filter((f) => f.status.toLowerCase() === status.toLowerCase());
    if (severity) findings = findings.filter((f) => f.severity.toLowerCase() === severity.toLowerCase());
    if (category) findings = findings.filter((f) => f.category.toLowerCase() === category.toLowerCase());
    if (query) {
      const q = query.toLowerCase();
      findings = findings.filter(
        (f) =>
          f.title.toLowerCase().includes(q) ||
          f.affectedUrl.toLowerCase().includes(q) ||
          f.simpleEnglish.toLowerCase().includes(q)
      );
    }

    return res.json({
      auditId: id,
      targetHost: audit.targetHost,
      totalFindings: findings.length,
      findings,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Returns executive report with health & trust signals and test limitations
 */
export async function getAuditReport(req, res) {
  try {
    const { id } = req.params;
    const audit = await Audit.findById(id).lean();
    if (!audit) return res.status(404).json({ error: `Audit ${id} not found` });

    const resources = await Resource.find({ auditId: id }).lean();
    const measurements = await Measurement.find({ auditId: id }).lean();

    const findings = generateSmartFindings(audit, resources, measurements);
    const trustSignals = generateTrustSignals(audit, resources, measurements);

    // Sort findings by severity
    const severityOrder = { Critical: 1, High: 2, Medium: 3, Warning: 4, Low: 5, Informational: 6 };
    const mostImportantProblems = findings
      .filter((f) => f.severity === 'Critical' || f.severity === 'High')
      .sort((a, b) => (severityOrder[a.severity] || 9) - (severityOrder[b.severity] || 9));

    const passedChecks = findings.filter((f) => f.status === 'Passed');

    const recommendedFixes = findings
      .filter((f) => f.status !== 'Passed' && f.stepByStepFix && f.stepByStepFix.length > 0)
      .map((f) => ({
        findingTitle: f.title,
        severity: f.severity,
        affectedUrl: f.affectedUrl,
        steps: f.stepByStepFix,
        commands: f.exampleCommands || [],
        verification: f.verificationSteps,
      }));

    const worker = audit.workerMetadata || {};

    return res.json({
      auditId: id,
      targetHost: audit.targetHost,
      url: audit.url,
      status: audit.status,
      summary: audit.summary,
      trustSignals,
      mostImportantProblems,
      passedChecks,
      recommendedFixes,
      testLimitations: [
        {
          aspect: 'Native IPv6 Transport',
          status: worker.hasNativeIpv6 ? 'Executed & Verified' : 'Vantage Point Unsupported',
          description: worker.hasNativeIpv6
            ? 'Measured via real dual-stack Node.js sockets with family:6 enforcement.'
            : 'Worker host environment has no native IPv6 route. IPv6 socket tests marked Unsupported to prevent false failures.',
        },
        {
          aspect: 'Browser Session Scope',
          status: 'Observed Session Only',
          description:
            'Measurements cover dependencies observed by Playwright Chromium during the live session. Does not crawl unbounded external domains.',
        },
        {
          aspect: 'DNS Resolution Integrity',
          status: 'Dual-Resolver Verified',
          description:
            'A and AAAA lookups were resolved with DNS64 synthesis protection. A missing AAAA record alone does not prove transport failure.',
        },
      ],
      findingsCount: findings.length,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}

/**
 * Returns Easy Notes in Simple English and Hinglish
 */
export async function getAuditNotes(req, res) {
  try {
    const { id } = req.params;
    const audit = await Audit.findById(id).lean();
    if (!audit) return res.status(404).json({ error: `Audit ${id} not found` });

    const resources = await Resource.find({ auditId: id }).lean();
    const measurements = await Measurement.find({ auditId: id }).lean();

    const findings = generateSmartFindings(audit, resources, measurements);
    const easyNotes = generateEasyNotes(audit, findings);

    return res.json({
      auditId: id,
      targetHost: audit.targetHost,
      easyNotes,
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
