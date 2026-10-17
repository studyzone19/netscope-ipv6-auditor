import mongoose from 'mongoose';

/**
 * In-memory resilient storage for audits, resources, measurements, and benchmarks.
 * Automatically activates whenever MongoDB is disconnected or unavailable (e.g. cloud free-tiers),
 * ensuring zero Mongoose buffering timeouts and seamless application execution.
 */

function getNestedValue(obj, path) {
  if (!obj || !path) return undefined;
  const parts = path.split('.');
  let curr = obj;
  for (const part of parts) {
    if (curr == null) return undefined;
    curr = curr[part];
  }
  return curr;
}

function matchSingleField(val, expected) {
  if (expected instanceof RegExp) {
    return expected.test(String(val || ''));
  }

  if (expected !== null && typeof expected === 'object' && !Array.isArray(expected)) {
    // Regex operator
    if ('$regex' in expected) {
      const flags = expected.$options || '';
      const regex = new RegExp(expected.$regex, flags);
      return regex.test(String(val || ''));
    }
    // $in operator
    if ('$in' in expected) {
      return Array.isArray(expected.$in) && expected.$in.some((item) => String(item) === String(val));
    }
    // $ne operator
    if ('$ne' in expected) {
      return String(val) !== String(expected.$ne);
    }
    // Comparison operators
    if ('$gt' in expected && !(val > expected.$gt)) return false;
    if ('$gte' in expected && !(val >= expected.$gte)) return false;
    if ('$lt' in expected && !(val < expected.$lt)) return false;
    if ('$lte' in expected && !(val <= expected.$lte)) return false;
    return true;
  }

  return String(val ?? '') === String(expected ?? '');
}

function matchesQuery(doc, query) {
  if (!query || typeof query !== 'object') return true;

  // $or operator
  if (Array.isArray(query.$or)) {
    const matchesAny = query.$or.some((subQuery) => matchesQuery(doc, subQuery));
    if (!matchesAny) return false;
  }

  for (const [key, expected] of Object.entries(query)) {
    if (key === '$or') continue;

    if (key === '_id' || key === 'auditId' || key === 'resourceId') {
      const docVal = doc[key];
      if (expected !== null && typeof expected === 'object' && !Array.isArray(expected)) {
        if (!matchSingleField(docVal, expected)) return false;
      } else if (String(docVal) !== String(expected)) {
        return false;
      }
      continue;
    }

    // Check array matching like 'sites.url'
    if (key.includes('.')) {
      const [first, ...rest] = key.split('.');
      const subPath = rest.join('.');
      if (Array.isArray(doc[first])) {
        const found = doc[first].some((item) => matchSingleField(getNestedValue(item, subPath), expected));
        if (!found) return false;
        continue;
      }
    }

    const val = key.includes('.') ? getNestedValue(doc, key) : doc[key];
    if (!matchSingleField(val, expected)) return false;
  }

  return true;
}

function wrapDocument(raw, store) {
  if (!raw) return null;
  const doc = { ...raw };

  doc._id = doc._id ? String(doc._id) : new mongoose.Types.ObjectId().toString();
  doc.createdAt = doc.createdAt || new Date();
  doc.updatedAt = new Date();

  // Handle Mongoose Map fields for compatibility
  if (doc.summary) {
    if (doc.summary.resourceTypeBreakdown && typeof doc.summary.resourceTypeBreakdown.get !== 'function') {
      const rawMap = { ...doc.summary.resourceTypeBreakdown };
      doc.summary.resourceTypeBreakdown = {
        ...rawMap,
        get: (k) => rawMap[k] ?? 0,
        set: (k, v) => { rawMap[k] = v; },
      };
    }
    if (doc.summary.failureCategories && typeof doc.summary.failureCategories.get !== 'function') {
      const rawMap = { ...doc.summary.failureCategories };
      doc.summary.failureCategories = {
        ...rawMap,
        get: (k) => rawMap[k] ?? 0,
        set: (k, v) => { rawMap[k] = v; },
      };
    }
  }

  // Attach .save() method
  doc.save = async function () {
    this.updatedAt = new Date();
    store.set(String(this._id), this);
    return this;
  };

  doc.toObject = function () {
    const copy = { ...this };
    delete copy.save;
    delete copy.toObject;
    delete copy.toJSON;
    return copy;
  };

  doc.toJSON = doc.toObject;

  return doc;
}

class MemoryQuery {
  constructor(store, query = {}, isFindOne = false, isCount = false) {
    this.store = store;
    this.query = query;
    this.isFindOne = isFindOne;
    this.isCount = isCount;
    this._sortObj = null;
    this._skipNum = 0;
    this._limitNum = 0;
    this._isLean = false;
  }

  sort(sortObj) {
    this._sortObj = sortObj;
    return this;
  }

  skip(n) {
    this._skipNum = parseInt(n, 10) || 0;
    return this;
  }

  limit(n) {
    this._limitNum = parseInt(n, 10) || 0;
    return this;
  }

  lean() {
    this._isLean = true;
    return this;
  }

  populate() {
    return this;
  }

  select() {
    return this;
  }

  async exec() {
    const all = Array.from(this.store.values());
    let filtered = all.filter((doc) => matchesQuery(doc, this.query));

    // Sort if requested
    if (this._sortObj) {
      const [field, dir] = Object.entries(this._sortObj)[0] || [];
      if (field) {
        const order = dir === -1 || dir === 'desc' ? -1 : 1;
        filtered.sort((a, b) => {
          const valA = getNestedValue(a, field);
          const valB = getNestedValue(b, field);
          if (valA < valB) return -1 * order;
          if (valA > valB) return 1 * order;
          return 0;
        });
      }
    }

    if (this.isCount) {
      return filtered.length;
    }

    if (this._skipNum > 0) {
      filtered = filtered.slice(this._skipNum);
    }

    if (this._limitNum > 0) {
      filtered = filtered.slice(0, this._limitNum);
    }

    if (this.isFindOne) {
      const first = filtered[0] || null;
      if (!first) return null;
      return this._isLean ? (first.toObject ? first.toObject() : { ...first }) : wrapDocument(first, this.store);
    }

    return filtered.map((d) => (this._isLean ? (d.toObject ? d.toObject() : { ...d }) : wrapDocument(d, this.store)));
  }

  then(resolve, reject) {
    return this.exec().then(resolve, reject);
  }
}

/**
 * Creates a resilient model that proxies to Mongoose when connected,
 * or gracefully handles in-memory queries when MongoDB is disconnected.
 */
export function createResilientModel(modelName, schema) {
  const RealMongooseModel = mongoose.model(modelName, schema);
  const memoryStore = new Map();

  const isConnected = () => mongoose.connection && mongoose.connection.readyState === 1;

  return new Proxy(RealMongooseModel, {
    construct(target, args) {
      if (isConnected()) {
        return new target(...args);
      }
      const raw = args[0] || {};
      const wrapped = wrapDocument(raw, memoryStore);
      return wrapped;
    },

    get(target, prop, receiver) {
      // When MongoDB is connected, execute natively on Mongoose Model
      if (isConnected()) {
        const value = Reflect.get(target, prop, receiver);
        return typeof value === 'function' ? value.bind(target) : value;
      }

      // When MongoDB is NOT connected, handle in-memory seamlessly
      if (prop === 'create') {
        return async function (docOrDocs) {
          if (Array.isArray(docOrDocs)) {
            return docOrDocs.map((item) => {
              const wrapped = wrapDocument(item, memoryStore);
              memoryStore.set(String(wrapped._id), wrapped);
              return wrapped;
            });
          }
          const wrapped = wrapDocument(docOrDocs, memoryStore);
          memoryStore.set(String(wrapped._id), wrapped);
          return wrapped;
        };
      }

      if (prop === 'insertMany') {
        return async function (docs) {
          return (docs || []).map((item) => {
            const wrapped = wrapDocument(item, memoryStore);
            memoryStore.set(String(wrapped._id), wrapped);
            return wrapped;
          });
        };
      }

      if (prop === 'findOne') {
        return function (query) {
          return new MemoryQuery(memoryStore, query, true, false);
        };
      }

      if (prop === 'findById') {
        return function (id) {
          return new MemoryQuery(memoryStore, { _id: String(id) }, true, false);
        };
      }

      if (prop === 'find') {
        return function (query) {
          return new MemoryQuery(memoryStore, query, false, false);
        };
      }

      if (prop === 'countDocuments') {
        return function (query) {
          return new MemoryQuery(memoryStore, query, false, true);
        };
      }

      if (prop === 'updateOne') {
        return async function (query, update) {
          const all = Array.from(memoryStore.values());
          const doc = all.find((d) => matchesQuery(d, query));
          if (doc && update && update.$set) {
            for (const [k, v] of Object.entries(update.$set)) {
              if (k.startsWith('sites.$.') && Array.isArray(doc.sites)) {
                const field = k.replace('sites.$.', '');
                const targetUrl = query['sites.url'];
                const site = doc.sites.find((s) => s.url === targetUrl);
                if (site) site[field] = v;
              } else {
                doc[k] = v;
              }
            }
            memoryStore.set(String(doc._id), doc);
            return { acknowledged: true, modifiedCount: 1 };
          }
          return { acknowledged: true, modifiedCount: 0 };
        };
      }

      if (prop === 'updateMany') {
        return async function (query, update) {
          let count = 0;
          const all = Array.from(memoryStore.values());
          const docs = all.filter((d) => matchesQuery(d, query));
          for (const doc of docs) {
            if (update && update.$set) {
              for (const [k, v] of Object.entries(update.$set)) {
                doc[k] = v;
              }
              memoryStore.set(String(doc._id), doc);
              count++;
            }
          }
          return { acknowledged: true, modifiedCount: count };
        };
      }

      if (prop === 'deleteOne') {
        return async function (query) {
          const all = Array.from(memoryStore.values());
          const doc = all.find((d) => matchesQuery(d, query));
          if (doc) {
            memoryStore.delete(String(doc._id));
            return { acknowledged: true, deletedCount: 1 };
          }
          return { acknowledged: true, deletedCount: 0 };
        };
      }

      if (prop === 'deleteMany') {
        return async function (query) {
          let count = 0;
          const all = Array.from(memoryStore.values());
          const docs = all.filter((d) => matchesQuery(d, query));
          for (const doc of docs) {
            memoryStore.delete(String(doc._id));
            count++;
          }
          return { acknowledged: true, deletedCount: count };
        };
      }

      const val = Reflect.get(target, prop, receiver);
      return typeof val === 'function' ? val.bind(target) : val;
    },
  });
}
