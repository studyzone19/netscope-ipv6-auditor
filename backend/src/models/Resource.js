import mongoose from 'mongoose';
import { createResilientModel } from './memoryFallback.js';

const ResourceSchema = new mongoose.Schema(
  {
    auditId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Audit',
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
    pathname: {
      type: String,
      default: '/',
    },
    protocol: {
      type: String,
      default: 'https:',
    },
    port: {
      type: Number,
      default: 443,
    },
    resourceType: {
      type: String,
      enum: [
        'document',
        'stylesheet',
        'script',
        'image',
        'font',
        'xhr',
        'fetch',
        'subframe',
        'media',
        'websocket',
        'other',
      ],
      default: 'other',
      index: true,
    },
    method: {
      type: String,
      default: 'GET',
    },
    browserStatusCode: {
      type: Number,
      default: null,
    },
    browserStatusText: {
      type: String,
      default: null,
    },
    initiator: {
      type: mongoose.Schema.Types.Mixed,
      default: null,
    },
    parentUrl: {
      type: String,
      default: null,
    },
    isThirdParty: {
      type: Boolean,
      default: false,
    },
    timing: {
      startTime: Number,
      duration: Number,
    },
    discoveredAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

export const Resource = createResilientModel('Resource', ResourceSchema);
