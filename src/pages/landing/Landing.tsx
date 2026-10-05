import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import styles from "./index.module.css";
import api from "@/lib/api/api";
import { ThemeToggle } from "@/components/themeToggle/ThemeToggle";
import { calculateUploadPrice, formatINR } from "@/lib/pricing";
import {
  CheckCircle2,
  ArrowRight,
  UploadCloud,
  Share2,
  ThumbsUp,
  Files,
  Zap,
  RefreshCw,
  Loader2,
  Cpu,
  Film,
  Music,
  Check,
  Layers,
  ShieldCheck,
} from "lucide-react";

export const Landing = () => {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [calculatorMB, setCalculatorMB] = useState(150);

  const calculated = calculateUploadPrice(calculatorMB * 1024 * 1024);

  const presets = [
    { label: "50 MB", mb: 50 },
    { label: "100 MB", mb: 100 },
    { label: "250 MB", mb: 250 },
    { label: "500 MB", mb: 500 },
    { label: "1000 MB (1GB)", mb: 1000 },
  ];

  const scrollToCreate = () => {
    const el = document.getElementById("project-input");
    el?.focus();
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleStart = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading || !name.trim()) return;

    setLoading(true);

    try {
      const { data } = await api.post<{ data: { adminToken: string } }>(
        "/projects",
        { name: name.trim() }
      );

      const { adminToken } = data.data;
      localStorage.setItem("approval_admin_token", adminToken);
      navigate(`/dashboard/${adminToken}`);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        alert(error.response?.data?.message ?? "Failed to create project");
      } else {
        alert("Unexpected error occurred while creating project");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={styles.page}>
      {/* NAVBAR */}
      <header className={styles.navContainer}>
        <nav className={styles.nav}>
          <div className={styles.brand}>
            <div className={styles.logo}>
              <CheckCircle2 size={18} strokeWidth={2.75} />
            </div>
            <span>Freelance Approval</span>
          </div>

          <div className={styles.navLinks}>
            <a href="#how-it-works" className={styles.navLink}>
              How it works
            </a>
            <a href="#features" className={styles.navLink}>
              Features
            </a>
            <a href="#pricing" className={styles.navLink}>
              Pricing
            </a>
            <a href="#formats" className={styles.navLink}>
              Formats
            </a>
          </div>

          <div className={styles.navRight}>
            <div className={styles.authorTag}>
              <span className={styles.authorDot} />
              <span>By Lokesh Singh Tanwar</span>
            </div>
            <ThemeToggle />
            <button
              onClick={() => {
                const el = document.getElementById("project-input");
                el?.focus();
                window.scrollTo({ top: 0, behavior: "smooth" });
              }}
              className={styles.navCta}
            >
              <span>+ New</span>
            </button>
          </div>
        </nav>
      </header>

      {/* HERO */}
      <main className={styles.hero}>
        <div className={styles.badge}>
          <span className={styles.pulseDot} />
          <span>Instant Client Approvals</span>
        </div>

        <h1 className={styles.title}>
          Share deliverables. <br />
          <span className={styles.titleGradient}>Get approved in seconds.</span>
        </h1>

        <p className={styles.subtitle}>
          Stop chasing approvals over email. Create a secure workspace, upload your work in any
          format (.exe, video, audio, designs, docs), and send a zero-login link to your client.
        </p>

        {/* INPUT FORM */}
        <form onSubmit={handleStart} className={styles.form}>
          <div className={styles.formBox}>
            <input
              id="project-input"
              autoFocus
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Project Name (e.g. logo Redesign v2)"
              className={styles.input}
              disabled={loading}
            />

            <button
              type="submit"
              disabled={!name.trim() || loading}
              className={styles.submitBtn}
            >
              {loading ? (
                <Loader2 className={styles.spinner} size={16} />
              ) : (
                <span>Start</span>
              )}
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>

          <div className={styles.formNote}>
            <span>No client sign-up</span>
            <span className={styles.dotSep}>•</span>
            <span>All file formats supported</span>
            <span className={styles.dotSep}>•</span>
            <span>Same-link revisions</span>
          </div>
        </form>
      </main>

      {/* HOW IT WORKS */}
      <section className={styles.section} id="how-it-works">
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>How it works</h2>
          <p className={styles.sectionSubtitle}>
            A streamlined approval workflow designed to eliminate client friction.
          </p>
        </div>

        <div className={styles.stepsGrid}>
          <div className={styles.stepCard}>
            <div className={styles.stepTop}>
              <div className={styles.stepIcon}>
                <UploadCloud size={18} />
              </div>
              <span className={styles.stepNumber}>01</span>
            </div>
            <h3>1. Upload Deliverable</h3>
            <p>
              Drop any file format into your workspace—software builds (.exe), 4K videos, audio
              stems, zip archives, designs, or sheets.
            </p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepTop}>
              <div className={styles.stepIcon}>
                <Share2 size={18} />
              </div>
              <span className={styles.stepNumber}>02</span>
            </div>
            <h3>2. Share One Secret Link</h3>
            <p>
              Send the private link to your client. They open it instantly in their browser with
              zero account creation or login required.
            </p>
          </div>

          <div className={styles.stepCard}>
            <div className={styles.stepTop}>
              <div className={styles.stepIcon}>
                <ThumbsUp size={18} />
              </div>
              <span className={styles.stepNumber}>03</span>
            </div>
            <h3>3. Approve or Revise</h3>
            <p>
              Clients approve in one tap or request changes. When you upload a revision, the exact
              same link resets to pending automatically.
            </p>
          </div>
        </div>
      </section>

      {/* CORE FEATURES */}
      <section className={styles.section} id="features" style={{ paddingTop: 0 }}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Built for modern freelance work</h2>
          <p className={styles.sectionSubtitle}>
            Simple, focused features that save time and keep projects on track.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Files size={18} />
            </div>
            <h3>Universal File Delivery</h3>
            <p>
              No restrictions. Deliver Windows executables (.exe), media, source archives, or
              spreadsheets with safe dedicated download actions.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Zap size={18} />
            </div>
            <h3>Live Real-Time WebSockets</h3>
            <p>
              Your dashboard updates instantaneously the moment a client clicks Approve or sends
              revision feedback without manual page refreshes.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <RefreshCw size={18} />
            </div>
            <h3>Continuous Same-Link Iteration</h3>
            <p>
              Never confuse clients with version 1, version 2 links. Upload revisions in the dashboard
              and the client reviews on the exact same URL.
            </p>
          </div>
        </div>
      </section>

      {/* PRICING & TIERS */}
      <section className={styles.section} id="pricing" style={{ paddingTop: 0 }}>
        <div className={styles.sectionHeader}>
          <div className={styles.badge} style={{ margin: "0 auto 1.25rem", width: "fit-content" }}>
            <span className={styles.pulseDot} />
            <span>Fair & Transparent Pricing</span>
          </div>
          <h2 className={styles.sectionTitle}>Simple deliverable pricing</h2>
          <p className={styles.sectionSubtitle}>
            Files up to 99 MB are 100% free forever. Heavy files (100 MB+) powered by automated Cashfree checkout.
          </p>
        </div>

        {/* 2-TIER COMPARISON CARDS */}
        <div className={styles.pricingGrid}>
          {/* FREE TIER CARD */}
          <div className={styles.pricingCard}>
            <div className={styles.pricingCardTop}>
              <div className={styles.pricingTierName}>Standard Deliverable</div>
              <div className={styles.pricingAmountRow}>
                <span className={styles.pricingAmount}>₹0</span>
                <span className={styles.pricingUnit}>Free forever</span>
              </div>
              <p className={styles.pricingDesc}>
                Perfect for code, designs, documents, presentations, compressed assets, and media.
              </p>
            </div>

            <div className={styles.pricingFeaturesList}>
              <div className={styles.pricingFeatureItem}>
                <Check size={16} className={styles.pricingFeatureIcon} />
                <span>Files up to <strong>99 MB</strong> free</span>
              </div>
              <div className={styles.pricingFeatureItem}>
                <Check size={16} className={styles.pricingFeatureIcon} />
                <span>Zero client sign-up or login required</span>
              </div>
              <div className={styles.pricingFeatureItem}>
                <Check size={16} className={styles.pricingFeatureIcon} />
                <span>Universal format delivery (.exe, .zip, etc.)</span>
              </div>
              <div className={styles.pricingFeatureItem}>
                <Check size={16} className={styles.pricingFeatureIcon} />
                <span>Live real-time WebSockets status sync</span>
              </div>
              <div className={styles.pricingFeatureItem}>
                <Check size={16} className={styles.pricingFeatureIcon} />
                <span>Auto-expiring private links (up to 90 days)</span>
              </div>
            </div>

            <button onClick={scrollToCreate} className={styles.pricingActionBtn}>
              <span>Start Free Project</span>
              <ArrowRight size={15} />
            </button>
          </div>

          {/* HEAVY DELIVERABLE TIER CARD */}
          <div className={`${styles.pricingCard} ${styles.pricingCardFeatured}`}>
            <span className={styles.pricingBadge}>Cashfree Secured</span>
            <div className={styles.pricingCardTop}>
              <div className={styles.pricingTierName} style={{ color: "#818cf8" }}>Heavy Deliverables Tier</div>
              <div className={styles.pricingAmountRow}>
                <span className={styles.pricingAmount}>₹10</span>
                <span className={styles.pricingUnit}>/ 100 MB block</span>
              </div>
              <p className={styles.pricingDesc}>
                High-speed cloud bandwidth for 4K video renders, audio stems, RAW photo shoots, large 3D models & executables.
              </p>
            </div>

            <div className={styles.pricingFeaturesList}>
              <div className={styles.pricingFeatureItem}>
                <Check size={16} className={styles.pricingFeatureIconIndigo} />
                <span><strong>100 MB to 5 GB+</strong> massive file capacity</span>
              </div>
              <div className={styles.pricingFeatureItem}>
                <Check size={16} className={styles.pricingFeatureIconIndigo} />
                <span>Flat rate: <strong>100 MB = ₹10</strong>, <strong>1000 MB = ₹100</strong></span>
              </div>
              <div className={styles.pricingFeatureItem}>
                <Check size={16} className={styles.pricingFeatureIconIndigo} />
                <span>Instant automated Cashfree PG checkout modal</span>
              </div>
              <div className={styles.pricingFeatureItem}>
                <Check size={16} className={styles.pricingFeatureIconIndigo} />
                <span>Supports UPI (GPay, PhonePe, Paytm), Cards & NetBanking</span>
              </div>
              <div className={styles.pricingFeatureItem}>
                <Check size={16} className={styles.pricingFeatureIconIndigo} />
                <span>Instant auto-upload unlock upon payment confirmation</span>
              </div>
            </div>

            <button onClick={scrollToCreate} className={`${styles.pricingActionBtn} ${styles.pricingActionBtnPrimary}`}>
              <span>Create Workspace & Upload</span>
              <ArrowRight size={15} />
            </button>
          </div>
        </div>

        {/* INTERACTIVE ESTIMATOR */}
        <div className={styles.calculatorCard}>
          <div className={styles.calculatorHeader}>
            <div className={styles.calculatorTitleBox}>
              <div className={styles.stepIcon}>
                <Layers size={18} />
              </div>
              <div>
                <h3 className={styles.calculatorTitle}>Interactive Fee Estimator</h3>
                <p className={styles.calculatorSubtitle}>
                  Slide or select file size to preview exact upload cost
                </p>
              </div>
            </div>
            <div className={styles.calculatorSizeDisplay}>
              {calculatorMB} MB
            </div>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <input
              type="range"
              min={10}
              max={2000}
              step={10}
              value={calculatorMB}
              onChange={(e) => setCalculatorMB(Number(e.target.value))}
              className={styles.calculatorSlider}
            />
            <div className={styles.calculatorSliderMarks}>
              <span>10 MB (Free)</span>
              <span>100 MB (₹10)</span>
              <span>500 MB (₹50)</span>
              <span>1000 MB / 1GB (₹100)</span>
              <span>2000 MB (₹200)</span>
            </div>
          </div>

          <div className={styles.calculatorPresets}>
            {presets.map((p) => (
              <button
                key={p.mb}
                type="button"
                onClick={() => setCalculatorMB(p.mb)}
                className={`${styles.presetBtn} ${calculatorMB === p.mb ? styles.presetBtnActive : ""
                  }`}
              >
                {p.label}
              </button>
            ))}
          </div>

          <div className={styles.calculatorResultBox}>
            <div className={styles.calculatorResultLeft}>
              <div className={styles.calculatorResultLabel}>
                {calculated.tierLabel}
              </div>
              <div className={styles.calculatorResultDesc}>
                {calculated.isFree
                  ? "Standard deliverables under 100 MB are 100% Free. No payment required."
                  : `₹10 per 100 MB tier coverage (Up to ${calculated.tierMaxMB} MB storage & bandwidth)`}
              </div>
            </div>

            <div className={styles.calculatorResultPrice}>
              {calculated.isFree ? "₹0 FREE" : formatINR(calculated.amount)}
            </div>
          </div>

          <div className={styles.trustBar}>
            <span style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <ShieldCheck size={15} style={{ color: "#10b981" }} />
              Cashfree Payments Verified • 256-bit Bank Grade Security
            </span>
            <span>
              UPI • Google Pay • PhonePe • Paytm • Cards • NetBanking
            </span>
          </div>
        </div>
      </section>

      {/* SUPPORTED FORMATS */}
      <section className={styles.section} id="formats" style={{ paddingTop: 0 }}>

        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Supported Deliverable Formats</h2>
          <p className={styles.sectionSubtitle}>
            Everything from standalone software to print-ready creatives.
          </p>
        </div>

        <div className={styles.featuresGrid}>
          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Cpu size={18} />
            </div>
            <h3>Executables & Binaries</h3>
            <p>
              <code>.exe</code>, <code>.msi</code>, <code>.dmg</code>, <code>.apk</code>. Verified
              download notice and direct execution guidance.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Film size={18} />
            </div>
            <h3>Video & Motion</h3>
            <p>
              <code>.mp4</code>, <code>.mov</code>, <code>.webm</code>. In-browser responsive player
              for quick client screening.
            </p>
          </div>

          <div className={styles.featureCard}>
            <div className={styles.featureIcon}>
              <Music size={18} />
            </div>
            <h3>Audio & Soundtracks</h3>
            <p>
              <code>.mp3</code>, <code>.wav</code>, <code>.flac</code>. Waveform audio player with
              volume controls for music and voiceovers.
            </p>
          </div>
        </div>
      </section>

      {/* FOOTER */}
      <footer className={styles.footer}>
        <div className={styles.footerGrid}>
          {/* Brand Col */}
          <div className={styles.footerBrandCol}>
            <div className={styles.brand} style={{ fontSize: "1.05rem" }}>
              <div className={styles.logo} style={{ width: "26px", height: "26px" }}>
                <CheckCircle2 size={16} strokeWidth={2.75} />
              </div>
              <span>Freelance Approval</span>
            </div>
            <p>
              A lightweight, friction-free tool for freelancers and agencies to share deliverables
              and secure client approvals with zero sign-up friction.
            </p>
            <div style={{ fontSize: "0.825rem", color: "#a1a1aa", marginTop: "0.25rem" }}>
              Crafted by <strong style={{ color: "#fff" }}>Lokesh Singh Tanwar</strong>
            </div>
          </div>

          {/* Product Col */}
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>Navigation</div>
            <div className={styles.footerLinks}>
              <a href="#how-it-works" className={styles.footerLink}>How It Works</a>
              <a href="#features" className={styles.footerLink}>Features</a>
              <a href="#pricing" className={styles.footerLink}>Pricing</a>
              <a href="#formats" className={styles.footerLink}>Formats</a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  window.scrollTo({ top: 0, behavior: "smooth" });
                  document.getElementById("project-input")?.focus();
                }}
                className={styles.footerLink}
              >
                Create Workspace
              </a>
            </div>
          </div>

          {/* Formats Col */}
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>Formats</div>
            <div className={styles.footerLinks}>
              <span className={styles.footerLink}>Desktop Binaries (.exe)</span>
              <span className={styles.footerLink}>Video Renders (.mp4)</span>
              <span className={styles.footerLink}>Audio Stems (.wav)</span>
              <span className={styles.footerLink}>Spreadsheets & PDFs</span>
            </div>
          </div>

          {/* Security Col */}
          <div className={styles.footerCol}>
            <div className={styles.footerColTitle}>Security</div>
            <div className={styles.footerLinks}>
              <span className={styles.footerLink}>No Client Passwords</span>
              <span className={styles.footerLink}>Auto-Expiring Links</span>
              <span className={styles.footerLink}>Dual-Storage Engine</span>
              <span className={styles.footerLink}>WebSockets Real-Time</span>
            </div>
          </div>
        </div>

        {/* Bottom Strip */}
        <div className={styles.footerBottom}>
          <div>
            © {new Date().getFullYear()} Freelance Approval. All rights reserved.
          </div>
          <div className={styles.footerStatus}>
            <span className={styles.authorDot} />
            <span>Real-time sync active • Supabase & Local Fallback</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
