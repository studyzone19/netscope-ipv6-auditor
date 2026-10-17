import mongoose from 'mongoose';
import { createResilientModel } from './memoryFallback.js';

const AuditSchema = new mongoose.Schema(
  {
    url: {
      type: String,
      required: true,
      trim: true,
    },
    targetHost: {
      type: String,
      required: true,
      trim: true,
    },
    protocol: {
      type: String,
      default: 'https:',
    },
    status: {
      type: String,
      enum: [
        'pending',
        'validating',
        'discovering',
        'extracting',
        'measuring_ipv4',
        'measuring_ipv6',
        'classifying',
        'completed',
        'failed',
      ],
      default: 'pending',
    },
    stage: {
      type: String,
      default: 'Initialized',
    },
    progress: {
      type: Number,
      min: 0,
      max: 100,
      default: 0,
    },
    error: {
      type: String,
      default: null,
    },
    options: {
      timeoutMs: { type: Number, default: 15000 },
      maxResources: { type: Number, default: 50 },
      bypassLabCheck: { type: Boolean, default: false },
    },
    summary: {
      totalDiscovered: { type: Number, default: 0 },
      totalTested: { type: Number, default: 0 },
      ipv6ReachableCount: { type: Number, default: 0 },
      ipv6FailedCount: { type: Number, default: 0 },
      ipv4ReachableCount: { type: Number, default: 0 },
      ipv4FailedCount: { type: Number, default: 0 },
      ipv6ReachabilityRate: { type: Number, default: 0 },
      confirmedIpv6SpecificFailures: { type: Number, default: 0 },
      measurementCoverageRate: { type: Number, default: 0 },
      failureCategories: { type: Map, of: Number, default: {} },
      resourceTypeBreakdown: { type: Map, of: Number, default: {} },
    },
    workerMetadata: {
      hostname: String,
      platform: String,
      hasNativeIpv6: Boolean,
      workerIpv6Addresses: [String],
      dnsResolvers: [String],
      timestamp: { type: Date, default: Date.now },
    },
  },
  { timestamps: true }
);

export const Audit = createResilientModel('Audit', AuditSchema);
