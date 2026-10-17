import mongoose from 'mongoose';

const MeasurementSchema = new mongoose.Schema(
  {
    auditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Audit',
      required: true,
      index: true,
    },
    resourceId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Resource',
      required: true,
      index: true,
    },
    url: {
      type: String,
      required: true,
    },
    hostname: {
      type: String,
      required: true,
      index: true,
    },
    port: {
      type: Number,
      default: 443,
    },
    protocol: {
      type: String,
      default: 'https:',
    },

    // DNS Evidence
    dns: {
      queryHost: String,
      aRecords: [String],
      aaaaRecords: [String],
      cnames: [String],
      lookupDurationMs: Number,
      resolverUsed: String,
      outcome: {
        type: String,
        enum: ['SUCCESS', 'NO_A', 'NO_AAAA', 'NXDOMAIN', 'SERVFAIL', 'TIMEOUT', 'ERROR', 'SKIPPED'],
        default: 'SKIPPED',
      },
      error: String,
    },

    // IPv4 Transport Evidence
    ipv4: {
      tested: { type: Boolean, default: false },
      destinationIp: String,
      tcpConnected: { type: Boolean, default: false },
      tcpDurationMs: Number,
      tlsHandshake: { type: Boolean, default: false },
      tlsDurationMs: Number,
      tlsVersion: String,
      tlsCipher: String,
      httpStatusCode: Number,
      httpStatusText: String,
      httpDurationMs: Number,
      outcome: {
        type: String,
        enum: ['Passed', 'DNS failure', 'TCP failure', 'TLS failure', 'HTTP error', 'Timeout', 'Unsupported', 'Untested', 'Inconclusive'],
        default: 'Untested',
      },
      error: String,
    },

    // IPv6 Transport Evidence
    ipv6: {
      tested: { type: Boolean, default: false },
      destinationIp: String,
      tcpConnected: { type: Boolean, default: false },
      tcpDurationMs: Number,
      tlsHandshake: { type: Boolean, default: false },
      tlsDurationMs: Number,
      tlsVersion: String,
      tlsCipher: String,
      httpStatusCode: Number,
      httpStatusText: String,
      httpDurationMs: Number,
      outcome: {
        type: String,
        enum: ['Passed', 'DNS failure', 'TCP failure', 'TLS failure', 'HTTP error', 'Timeout', 'Unsupported', 'Untested', 'Inconclusive'],
        default: 'Untested',
      },
      error: String,
    },

    // Measurement Context: Geolocation and Resolver
    geoContext: {
      country: { type: String, default: null },
      city: { type: String, default: null },
      org: { type: String, default: null },
      asn: { type: String, default: null },
    },

    // Unified Scientific Failure Classification
    classification: {
      overall: {
        type: String,
        enum: [
          'Passed',
          'DNS failure',
          'TCP failure',
          'TLS failure',
          'HTTP error',
          'Timeout',
          'Browser-only failure',
          'Unsupported',
          'Untested',
          'Inconclusive',
        ],
        default: 'Untested',
        index: true,
      },
      ipv4Classification: String,
      ipv6Classification: String,
      isIpv6SpecificFailure: { type: Boolean, default: false, index: true },
      explanation: String,
      recommendedNextStep: String,
    },
  },
  { timestamps: true }
);

export const Measurement = mongoose.model('Measurement', MeasurementSchema);
