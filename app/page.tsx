'use client'

import { useRouter } from 'next/navigation'
import { useEffect, useState, useCallback } from 'react'
import { useIsMobile } from '@/lib/useIsMobile'

// ─── Icons ────────────────────────────────────────────────────────────────────

function ArrowIcon() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
      <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function CloneIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="3" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="12" y="12" width="13" height="13" rx="2.5" stroke="currentColor" strokeWidth="1.5" strokeDasharray="2 1.5"/>
      <path d="M9 9h6M9 13h4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function ManageIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="14" cy="14" r="11" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="14" cy="14" r="4" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M14 3v4M14 21v4M3 14h4M21 14h4M6.1 6.1l2.8 2.8M19.1 19.1l2.8 2.8M21.9 6.1l-2.8 2.8M9 19.1l-2.9 2.8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function StatusIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M4 20 Q7 8 14 14 Q21 20 24 8" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" fill="none"/>
      <circle cx="14" cy="14" r="2" fill="currentColor"/>
    </svg>
  )
}
function LinksIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <path d="M11 17H8a5 5 0 0 1 0-10h3M17 7h3a5 5 0 0 1 0 10h-3M9 14h10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function CollectionsBuilderIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <rect x="3" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="15" y="3" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <rect x="3" y="15" width="10" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M15 20h10M20 15v10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
    </svg>
  )
}
function MigrateIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 28 28" fill="none">
      <circle cx="8" cy="14" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <circle cx="20" cy="14" r="5" stroke="currentColor" strokeWidth="1.5"/>
      <path d="M13 14h2M15 11l3 3-3 3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function ExternalIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
      <path d="M4.5 2H2a1 1 0 0 0-1 1v7a1 1 0 0 0 1 1h7a1 1 0 0 0 1-1V7.5M7 1h4m0 0v4m0-4L5 7" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}
function RefreshIcon() {
  return (
    <svg width="13" height="13" viewBox="0 0 13 13" fill="none">
      <path d="M11 6.5A4.5 4.5 0 1 1 6.5 2a4.5 4.5 0 0 1 3.18 1.32L11 5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
      <path d="M11 2v3H8" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round"/>
    </svg>
  )
}

// ─── Types ────────────────────────────────────────────────────────────────────

interface GatusResult {
  success: boolean
  duration: number  // nanoseconds
  conditionResults?: { condition: string; success: boolean }[]
  timestamp: string
}
interface GatusEndpoint {
  name: string
  group: string
  key: string
  results: GatusResult[]
}
interface StatusData {
  endpoints: GatusEndpoint[]
}

// ─── Nav card ─────────────────────────────────────────────────────────────────

function Card({ icon, title, description, bullets, accent, onClick }: {
  icon: React.ReactNode; title: string; description: string
  bullets: string[]; accent: string; onClick: () => void
}) {
  return (
    <button onClick={onClick}
      style={{
        background: '#111118', border: '1px solid var(--border)', borderRadius: 16,
        padding: 24, textAlign: 'left', cursor: 'pointer',
        transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
        display: 'flex', flexDirection: 'column', gap: 16, width: '100%', fontFamily: 'inherit',
      }}
      onMouseEnter={e => {
        e.currentTarget.style.borderColor = accent
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = `0 8px 32px ${accent}20`
      }}
      onMouseLeave={e => {
        e.currentTarget.style.borderColor = 'var(--border)'
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = 'none'
      }}>
      <div style={{
        width: 48, height: 48, borderRadius: 12,
        background: `${accent}15`, border: `1px solid ${accent}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center', color: accent,
      }}>{icon}</div>
      <div>
        <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 5, color: 'var(--text)', letterSpacing: '-0.01em' }}>{title}</h2>
        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.6 }}>{description}</p>
      </div>
      <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 6 }}>
        {bullets.map((b, i) => (
          <li key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--text-muted)' }}>
            <div style={{ width: 5, height: 5, borderRadius: '50%', background: accent, flexShrink: 0 }} />
            {b}
          </li>
        ))}
      </ul>
      <div style={{ marginTop: 'auto', display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, fontWeight: 700, color: accent }}>
        Get started <ArrowIcon />
      </div>
    </button>
  )
}

// ─── Status dot ───────────────────────────────────────────────────────────────

function StatusDot({ status }: { status: number }) {
  const color = status === 1 ? '#22c55e' : status === 3 ? '#f59e0b' : '#ef4444'
  const label = status === 1 ? 'Up' : status === 3 ? 'Maintenance' : 'Down'
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
      <div style={{ width: 8, height: 8, borderRadius: '50%', background: color, flexShrink: 0, boxShadow: `0 0 6px ${color}` }} />
      <span style={{ fontSize: 11, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</span>
    </div>
  )
}

// ─── Status card ──────────────────────────────────────────────────────────────

function StatusCard() {
  const isMobile = useIsMobile()
  return (
    <div style={{ background: '#111118', border: '1px solid var(--border)', borderRadius: 16, padding: isMobile ? 20 : 28, display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
        <div style={{
          width: 48, height: 48, borderRadius: 12, flexShrink: 0,
          background: 'rgba(251,146,60,0.1)', border: '1px solid rgba(251,146,60,0.25)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fb923c',
        }}><StatusIcon /></div>
        <div>
          <h2 style={{ fontSize: 17, fontWeight: 800, marginBottom: 3, color: 'var(--text)', letterSpacing: '-0.01em' }}>Service Status</h2>
          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Live status for Stremio addons &amp; debrid services</p>
        </div>
      </div>

      {/* Stremio Status link */}
      <a href="https://status.stremio-status.com" target="_blank" rel="noopener noreferrer"
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg)', border: '1px solid var(--border)',
          borderRadius: 8, padding: '12px 14px', textDecoration: 'none', transition: 'border-color 0.15s',
        }}
        onMouseEnter={e => { e.currentTarget.style.borderColor = '#fb923c' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--border)' }}>
        <div>
          <div style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 2 }}>Addon & Service Status</div>
          <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>status.stremio-status.com</div>
        </div>
        <div style={{ color: 'var(--text-muted)', flexShrink: 0 }}><ExternalIcon /></div>
      </a>

      
    </div>
  )
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function Home() {
  const router = useRouter()
  const isMobile = useIsMobile()

  return (
    <div className="grid-bg" style={{ minHeight: '100vh', padding: '0 16px' }}>
      <div style={{
        position: 'fixed', top: 0, left: '50%', transform: 'translateX(-50%)',
        width: 700, height: 400,
        background: 'radial-gradient(ellipse at top, rgba(108,99,255,0.1) 0%, transparent 65%)',
        pointerEvents: 'none', zIndex: 0,
      }} />

      <div style={{ maxWidth: 800, margin: '0 auto', width: '100%', position: 'relative', zIndex: 1, paddingTop: isMobile ? 40 : 64, paddingBottom: 64 }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: isMobile ? 32 : 48 }}>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 10,
            background: 'rgba(108,99,255,0.1)', border: '1px solid rgba(108,99,255,0.25)',
            borderRadius: 20, padding: '5px 16px', marginBottom: 20,
          }}>
            <div style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--accent)' }} />
            <span style={{ fontSize: 11, fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: 'var(--accent)' }}>
              Reframe Account Manager
            </span>
          </div>
          <h1 style={{ fontSize: isMobile ? 28 : 42, fontWeight: 800, letterSpacing: '-0.025em', lineHeight: 1.1, marginBottom: 16 }}>
            Your Reframe library,<br />
            <span style={{ color: 'var(--accent)' }}>from a browser</span>
          </h1>
          <p style={{ fontSize: isMobile ? 14 : 16, color: 'var(--text-muted)', lineHeight: 1.7, maxWidth: 500, margin: '0 auto' }}>
            Sign in with the same email as the TV app. Manage addons, plugins, collections, and profiles on your backend.
          </p>
        </div>

        {/* Top two cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card
            icon={<CloneIcon />}
            title="Account Cloning"
            description="Mirror a source profile's data to any number of target accounts in one click."
            bullets={['Clone addons, plugins & collections', 'Push to multiple accounts at once', 'Per-target toggle control', 'Live success/error per account']}
            accent="#6c63ff"
            onClick={() => router.push('/clone')}
          />
          <Card
            icon={<ManageIcon />}
            title="Account Management"
            description="Log in and manage multiple accounts — addons, plugins, and collections per profile."
            bullets={['Manage multiple accounts at once', 'Add, remove & reorder addons', 'Enable or disable individual items', 'Switch between profiles instantly']}
            accent="#22c55e"
            onClick={() => router.push('/manage')}
          />
        </div>

        {/* Links card — full width */}
        <div style={{ marginBottom: 16 }}>
          <button onClick={() => router.push('/links')}
            style={{
              width: '100%', background: '#111118', border: '1px solid var(--border)',
              borderRadius: 16, padding: '20px 24px', textAlign: 'left', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 16, fontFamily: 'inherit',
              transition: 'border-color 0.2s, transform 0.15s, box-shadow 0.2s',
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = '#e879f9'
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 32px rgba(232,121,249,0.12)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = 'var(--border)'
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = 'none'
            }}
          >
            <div style={{
              width: 48, height: 48, borderRadius: 12, flexShrink: 0,
              background: 'rgba(232,121,249,0.1)', border: '1px solid rgba(232,121,249,0.25)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#e879f9',
            }}>
              <LinksIcon />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--text)', marginBottom: 4, letterSpacing: '-0.01em' }}>
                Helpful Links
              </div>
              <div style={{ fontSize: 13, color: 'var(--text-muted)' }}>
                Nuvio apps, addon catalog, debrid services, status pages, and community resources — all in one place
              </div>
            </div>
            <div style={{ color: '#e879f9', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontWeight: 700 }}>
              {!isMobile && 'Browse'}
              <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
                <path d="M3 8h10M9 4l4 4-4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
              </svg>
            </div>
          </button>
        </div>

        {/* Bottom two cards */}
        <div style={{ display: 'grid', gridTemplateColumns: isMobile ? '1fr' : '1fr 1fr', gap: 16, marginBottom: 16 }}>
          <Card
            icon={<CollectionsBuilderIcon />}
            title="Collections Builder"
            description="Build and manage your Nuvio collections with a visual editor powered by your installed addons."
            bullets={['Load your existing collections', 'Remap catalog sources to your addons', 'Configure display settings & tile shapes', 'Push individual or all collections']}
            accent="#14b8a6"
            onClick={() => router.push('/collections')}
          />
          <Card
            icon={<MigrateIcon />}
            title="Migrate from Stremio"
            description="Move your entire Stremio setup to Nuvio — addons, library, watch history, and continue watching."
            bullets={['Pick addons individually to migrate', 'Import library & watch history', 'Restore continue watching progress', 'Nothing in Stremio gets changed']}
            accent="#f97316"
            onClick={() => router.push('/migrate')}
          />
        </div>

        {/* Status card */}
        <div style={{ marginBottom: 32 }}>
          <StatusCard />
        </div>

        {/* Footer */}
        <div style={{ textAlign: 'center', color: 'var(--text-muted)', fontSize: 12, lineHeight: 1.7 }}>
          Fork of{' '}
          <a href="https://github.com/techuhak/Nuvio-Account-Manager" target="_blank" rel="noopener noreferrer"
            style={{ color: 'var(--accent)', textDecoration: 'none' }}>
            Nuvio Account Manager
          </a>
          {' '}· Talks to your Reframe backend, not api.nuvio.tv
        </div>
      </div>
    </div>
  )
}
