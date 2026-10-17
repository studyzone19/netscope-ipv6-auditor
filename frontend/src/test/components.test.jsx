import React from 'react';
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { StatusBadge } from '../components/StatusBadge';
import { MetricCard } from '../components/MetricCard';
import { UrlFixGuide } from '../components/UrlFixGuide';
import { TrustSignalsCard } from '../components/TrustSignalsCard';

describe('Frontend UI Components', () => {
  it('renders StatusBadge with Passed status', () => {
    render(<StatusBadge status="Passed" />);
    expect(screen.getByText('Passed')).toBeInTheDocument();
  });

  it('renders StatusBadge with IPv6-Specific failure labeling', () => {
    render(<StatusBadge status="TCP failure" isIpv6SpecificFailure={true} />);
    expect(screen.getByText(/IPv6-Specific/i)).toBeInTheDocument();
  });

  it('renders MetricCard with title, value and denominator', () => {
    render(
      <MetricCard
        title="IPv6 Reachability"
        value="85%"
        denominator="(17/20)"
        explanation="Percentage of eligible, actually tested resources reachable over IPv6."
        tooltip="Test metric"
      />
    );
    expect(screen.getByText('IPv6 Reachability')).toBeInTheDocument();
    expect(screen.getByText('85%')).toBeInTheDocument();
    expect(screen.getByText('(17/20)')).toBeInTheDocument();
    expect(screen.getByText(/Percentage of eligible/i)).toBeInTheDocument();
  });

  it('renders DEMO DATA badge when isDemo is true', () => {
    render(
      <MetricCard
        title="Websites Audited"
        value="1"
        isDemo={true}
        explanation="Number of distinct websites checked."
      />
    );
    expect(screen.getByText('DEMO DATA')).toBeInTheDocument();
  });

  it('renders UrlFixGuide with typo and suggested correction', () => {
    const mockTypoInfo = {
      errorCategory: 'HOSTNAME_TYPO',
      errorTitle: 'Suspected Typo in Hostname',
      originalUrl: 'https://prayag-hospitl.vercel.app/',
      suggestedUrl: 'https://prayag-hospital.vercel.app/',
      suspectedTypo: 'hospitl',
      characterPosition: 15,
      diff: { removed: 'hospitl', added: 'hospital', index: 15 },
      explanationEn: 'Hostname closely matches reference domain prayag-hospital.vercel.app.',
      explanationHi: 'Typing mistake detected in hostname.',
      stepByStepFix: ['Review the spelling.', 'Click Analyze Corrected URL.'],
    };

    render(<UrlFixGuide typoInfo={mockTypoInfo} />);
    expect(screen.getByText(/SMART URL TYPO & ERROR GUIDE/i)).toBeInTheDocument();
    expect(screen.getByText(/Analyze Corrected URL/i)).toBeInTheDocument();
    expect(screen.getByText(/ORIGINAL INPUT/i)).toBeInTheDocument();
  });

  it('renders TrustSignalsCard with transport security and domain integrity', () => {
    const mockSignals = {
      overview: { targetHost: 'example.com', verdict: 'Legitimate Domain Architecture' },
      transportSecurity: {
        httpsEnforced: true,
        tlsHandshakePassed: true,
        tlsVersion: 'TLSv1.3',
        mixedContentDetected: false,
      },
      domainIntegrity: {
        hasA: true,
        hasAaaa: true,
        cnameChain: [],
      },
      suspiciousSignals: {
        detected: false,
        indicators: [],
        note: 'Never labeled as scam without proof.',
      },
    };

    render(<TrustSignalsCard trustSignals={mockSignals} />);
    expect(screen.getByText(/WEBSITE HEALTH & TRUST SIGNALS/i)).toBeInTheDocument();
    expect(screen.getByText(/Legitimate Domain Architecture/i)).toBeInTheDocument();
    expect(screen.getByText(/HTTPS Active/i)).toBeInTheDocument();
  });
});
