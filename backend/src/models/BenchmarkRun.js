import mongoose from 'mongoose';

const BenchmarkSiteSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    url: { type: String, required: true },
    category: {
      type: String,
      enum: ['Search & Cloud', 'Tech & Developer', 'Media & News', 'E-commerce & Retail', 'Government & Education'],
      required: true,
    },
    status: {
      type: String,
      enum: ['pending', 'running', 'completed', 'failed', 'inconclusive'],
      default: 'pending',
    },
    auditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Audit',
      default: null,
    },
    totalResources: { type: Number, default: 0 },
    ipv6ReachableCount: { type: Number, default: 0 },
    ipv6SuccessRate: { type: Number, default: 0 },
    rootHasAaaa: { type: Boolean, default: false },
    rootIpv6Reachable: { type: Boolean, default: false },
    brokenDependenciesCount: { type: Number, default: 0 },
    durationMs: { type: Number, default: 0 },
    error: { type: String, default: null },
  },
  { _id: true }
);

const BenchmarkRunSchema = new mongoose.Schema(
  {
    runId: {
      type: String,
      required: true,
      unique: true,
      index: true,
    },
    status: {
      type: String,
      enum: ['idle', 'running', 'completed', 'failed', 'cancelled'],
      default: 'idle',
    },
    startedAt: { type: Date, default: null },
    completedAt: { type: Date, default: null },
    totalSites: { type: Number, default: 30 },
    completedSites: { type: Number, default: 0 },
    failedSites: { type: Number, default: 0 },
    overallIpv6Reachability: { type: Number, default: 0 },
    averageResourceCount: { type: Number, default: 0 },
    sites: [BenchmarkSiteSchema],
  },
  { timestamps: true }
);

export const BenchmarkRun = mongoose.model('BenchmarkRun', BenchmarkRunSchema);
