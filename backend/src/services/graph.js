/**
 * Transforms stored resources and measurements into an interactive React Flow graph.
 */
export function buildDependencyGraph(audit, resources, measurements) {
  const measurementMap = new Map();
  for (const m of measurements) {
    measurementMap.set(m.url, m);
  }

  const nodes = [];
  const edges = [];
  const nodeMap = new Map();

  // Color mapping based on status
  const getStatusColor = (classification, isIpv6SpecificFailure) => {
    if (isIpv6SpecificFailure) return '#EF4444'; // Red
    switch (classification) {
      case 'Passed':
        return '#10B981'; // Green
      case 'DNS failure':
      case 'TCP failure':
      case 'TLS failure':
      case 'HTTP error':
        return '#F43F5E'; // Rose/Red
      case 'Timeout':
        return '#F59E0B'; // Amber
      case 'Unsupported':
        return '#64748B'; // Slate
      default:
        return '#8B5CF6'; // Violet
    }
  };

  // 1. Root Node
  const rootNodeId = 'node-root';
  const rootUrl = audit.url;
  const rootMeasurement = measurementMap.get(rootUrl);

  const rootStatus = rootMeasurement?.classification?.overall || 'Passed';
  const rootIpv6Failure = rootMeasurement?.classification?.isIpv6SpecificFailure || false;

  nodes.push({
    id: rootNodeId,
    type: 'rootNode',
    position: { x: 450, y: 50 },
    data: {
      id: rootNodeId,
      label: audit.targetHost,
      url: rootUrl,
      hostname: audit.targetHost,
      resourceType: 'root',
      isThirdParty: false,
      overallStatus: rootStatus,
      isIpv6SpecificFailure: rootIpv6Failure,
      ipv4Outcome: rootMeasurement?.ipv4?.outcome || 'Untested',
      ipv6Outcome: rootMeasurement?.ipv6?.outcome || 'Untested',
      statusColor: getStatusColor(rootStatus, rootIpv6Failure),
      measurement: rootMeasurement,
    },
  });
  nodeMap.set(rootUrl, rootNodeId);

  // Group child resources by type for tidy layout positioning
  const typeGroups = {
    script: [],
    stylesheet: [],
    image: [],
    font: [],
    xhr: [],
    fetch: [],
    subframe: [],
    other: [],
  };

  resources.forEach((res) => {
    if (res.url === rootUrl) return; // Skip root as it's already added
    const group = typeGroups[res.resourceType] || typeGroups.other;
    group.push(res);
  });

  // Calculate layout coordinates in clean categorized rings / tiers
  let currentY = 220;
  let nodeIndex = 1;

  Object.entries(typeGroups).forEach(([type, items]) => {
    if (items.length === 0) return;

    const count = items.length;
    const spacing = Math.min(260, Math.max(160, 900 / Math.max(count, 1)));
    const startX = 450 - ((count - 1) * spacing) / 2;

    items.forEach((res, i) => {
      const nodeId = `node-${nodeIndex++}`;
      nodeMap.set(res.url, nodeId);

      const m = measurementMap.get(res.url);
      const overallStatus = m?.classification?.overall || 'Untested';
      const isIpv6Failure = m?.classification?.isIpv6SpecificFailure || false;
      const statusColor = getStatusColor(overallStatus, isIpv6Failure);

      const x = startX + i * spacing;
      // Stagger Y slightly to prevent dense crowding
      const y = currentY + (i % 2 === 0 ? 0 : 35);

      nodes.push({
        id: nodeId,
        type: 'resourceNode',
        position: { x: Math.round(x), y: Math.round(y) },
        data: {
          id: nodeId,
          label: res.pathname.split('/').pop() || res.hostname,
          url: res.url,
          hostname: res.hostname,
          pathname: res.pathname,
          resourceType: res.resourceType,
          isThirdParty: res.isThirdParty,
          overallStatus,
          isIpv6SpecificFailure: isIpv6Failure,
          ipv4Outcome: m?.ipv4?.outcome || 'Untested',
          ipv6Outcome: m?.ipv6?.outcome || 'Untested',
          statusColor,
          measurement: m,
          browserStatusCode: res.browserStatusCode,
        },
      });

      // Edge from initiator/parent or root
      let sourceId = rootNodeId;
      if (res.parentUrl && nodeMap.has(res.parentUrl) && res.parentUrl !== res.url) {
        sourceId = nodeMap.get(res.parentUrl);
      }

      edges.push({
        id: `edge-${sourceId}-${nodeId}`,
        source: sourceId,
        target: nodeId,
        type: 'smoothstep',
        animated: isIpv6Failure || overallStatus !== 'Passed',
        style: {
          stroke: isIpv6Failure ? '#EF4444' : overallStatus === 'Passed' ? '#06B6D4' : '#64748B',
          strokeWidth: isIpv6Failure ? 2.5 : 1.5,
          opacity: 0.8,
        },
      });
    });

    currentY += 160;
  });

  return {
    nodes,
    edges,
    totalNodes: nodes.length,
    totalEdges: edges.length,
  };
}
