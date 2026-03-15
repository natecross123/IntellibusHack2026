# Cyber Shield

Cyber Shield is a cyber-safety platform built to help people feel more secure while operating online. As more essential services move to digital-first platforms, users are being asked to trust links, emails, media, logins, and third-party services at a much higher frequency than before. This project exists to reduce that uncertainty by giving users a single place to check suspicious links, analyze potentially malicious emails, detect account exposure in known breaches, and monitor ongoing digital risk.

The system is designed around a practical problem: most users do not have the time, tools, or expertise to investigate cyber threats every day, yet the pressure to transact, communicate, and store sensitive information online keeps increasing. Cyber Shield addresses that gap by combining automated threat scanning, AI-assisted interpretation, and persistent account monitoring into one product experience.

## What Problem It Solves

People are now expected to live a large part of their lives online. Banking, education, healthcare, communication, employment, and personal identity management are increasingly tied to web platforms and online services. That convenience also increases exposure.

Users regularly face questions like these:

- Is this link safe to open?
- Is this email a phishing attempt or just badly written?
- Has my email been exposed in a breach?
- Which of my accounts should I secure first?
- Can I trust this media or is it potentially manipulated?

Cyber Shield is built to answer those questions quickly, clearly, and consistently. The project focuses on reducing anxiety and increasing confidence by translating technical security signals into user-facing guidance and prioritized actions.

## System Overview

The project is split into two major parts:

- A FastAPI backend that handles scanning workflows, AI-powered analysis orchestration, breach lookups, user history, and authenticated account monitoring.
- A React + TypeScript frontend that provides the user interface for logging in, checking risk, reviewing results, and managing monitored accounts.

### Core Capabilities

- Link scanning using Google Safe Browsing and VirusTotal signals.
- Email/phishing analysis using a large language model to identify scam patterns, red flags, verdicts, and recommended next steps.
- Data breach checking for email addresses, including recovery guidance.
- Authenticated per-user monitored accounts, allowing users to persistently track their own breach exposure.
- Historical storage for scans and analysis results.
- UI workflows for dashboarding, breach investigation, email review, and broader cyber-safety tooling.

## Architecture

### Frontend

The frontend is built with:

- React 18
- TypeScript
- Vite
- React Router
- TanStack Query
- Tailwind-based UI components

The client is responsible for:

- User authentication flows
- Rendering dashboards and analysis results
- Managing protected routes
- Calling backend APIs for link scanning, email analysis, breach checks, and monitored-account operations

### Backend

The backend is built with:

- FastAPI
- Supabase Python client
- Pydantic / Pydantic Settings
- httpx for async external API calls

The API is organized into focused routers:

- `app/routers/auth.py` for registration, login, logout, and user identity checks
- `app/routers/scanner.py` for URL safety scanning
- `app/routers/analysis.py` for email analysis
- `app/routers/breach.py` for breach lookups and recovery planning
- `app/routers/user.py` for authenticated user history and monitored-account persistence
- `app/routers/media.py` for broader media-related detection workflows

## How It Uses Models

This system uses models selectively where they add the most value instead of routing every request through an expensive LLM call.

Today, the model layer is used to:

- Generate plain-English breach recovery plans from breach metadata
- Analyze suspicious email content for phishing or fraud indicators
- Convert technical signals into understandable red flags, verdicts, and recommended next actions

This matters for cost control and performance. Model inference is reserved for high-value interpretation tasks, while lower-level security checks are handled by deterministic systems and API-based threat intelligence.

In practice, the platform combines:

- Deterministic scanners for URLs and reputation checks
- Structured breach data lookups
- AI interpretation for explanation and actionability

That separation is important because it keeps the product useful without making every request dependent on expensive inference.

## Caching and Cost Control

The code already includes a practical caching pattern that reduces repeated external calls.

### Current Cost Controls

- Scanned URL results are cached in Supabase through the `scanned_urls` table.
- Email analysis reuses cached URL risk scores for links extracted from email content.
- Monitored account results are stored per user so the system does not need to recompute everything for every page view.
- Async external requests help keep latency lower while avoiding unnecessary blocking.

This is especially important because some external threat-intelligence sources are rate limited or expensive to call at scale. By caching link reputation and persisting monitored-account state, the platform reduces redundant scans and keeps recurring workloads much more manageable.

### Why This Helps Scalability

- High-volume repeated scans for the same suspicious URL can be served from storage instead of recomputed.
- Monitoring workflows can persist latest-known breach state rather than repeating full analysis every render.
- AI usage can stay targeted to explanation generation instead of being used as a first-pass classifier for everything.

## Scalability Strategy

This project is designed with a growth path in mind.

### What Supports Scale Today

- Clear separation between frontend and backend allows independent scaling of UI delivery and API capacity.
- Stateless HTTP API design makes horizontal backend scaling realistic.
- Supabase provides managed persistence and authentication infrastructure.
- Cached URL intelligence prevents duplicate calls to external reputation services.
- Async request handling with `httpx` helps the backend manage multiple concurrent external lookups more efficiently.

### Future Scalability Direction

The long-term direction is to expand the scanning pipeline with built engines and deeper traversal systems, especially for URLs and content chains.

That includes:

- Link traversal pipelines that follow redirects and inspect chained destinations safely
- Queued background processing for scheduled re-checks of monitored accounts
- Rate-aware scheduling to avoid overrunning third-party API quotas
- Tiered caching and refresh windows so frequently repeated requests stay inexpensive
- More specialized engines for phishing pattern detection, suspicious page classification, and media integrity scoring
- Worker-based background jobs for scans that do not need to block the user interface

This approach allows the system to evolve from a responsive interactive tool into a more continuous protection platform without making it prohibitively expensive to operate.

## Availability

Availability is a core product concern because security tools are only useful when users can access them quickly.

The current system supports availability through:

- A separate frontend and API deployment model
- Managed data and auth infrastructure through Supabase
- API fallbacks and warning paths in some scanning workflows where one provider failing does not necessarily collapse the entire request path
- Persistent storage of prior results so users can still see historical outputs and monitored data

For future production hardening, the platform can improve availability further with:

- Background jobs and retry queues
- Health checks and observability dashboards
- Multi-provider fallback for reputation and intelligence sources
- More aggressive cache reuse for known-safe or known-malicious URLs

## Integrity and Secure Secret Handling

Security claims in this project are grounded in the current implementation.

### Password Security

User authentication is built on Supabase Auth. Passwords are not stored in plaintext in this codebase. Supabase handles secure password hashing and credential verification. The application sends credentials to the auth system over API calls and stores only the resulting authenticated session token on the client side.

This means the project relies on a mature authentication provider for:

- Password hashing
- Credential verification
- User identity management
- Auth token issuance

That is the correct security boundary for a project like this. The app should never implement ad hoc plaintext password storage, and it does not.

### Data Integrity

The platform also protects integrity in other ways:

- Pydantic schemas validate request and response structures
- Auth-protected routes scope monitored account data to the current user
- Cached and persisted results are stored in structured form rather than loose untyped blobs in the client
- The backend keeps security-sensitive logic server-side

## Novelty of the Project

What makes Cyber Shield novel is not just that it scans things. Many tools can do one isolated task. The novelty comes from how it combines multiple layers of cyber assistance into a user-centered platform.

This project brings together:

- Threat intelligence checks
- Breach exposure monitoring
- AI-assisted explanation
- Recovery guidance
- Persistent user-specific monitoring
- A single dashboard-oriented experience for non-expert users

Instead of forcing users to bounce between separate breach websites, URL checkers, email analyzers, and security advice blogs, Cyber Shield tries to unify those experiences into one coherent system. That makes the product not only functional, but approachable.

## Performance Considerations Already Present in the Code

Several performance-conscious decisions are already visible in the implementation:

- Cached link results reduce expensive repeated scans
- Email analysis limits the number of extracted URLs scanned in a single pass
- Async outbound calls prevent the API from blocking unnecessarily on network-bound work
- Persistent monitored-account storage avoids recomputing breach data on every page transition
- Frontend state centralization keeps monitored account data synchronized across views

These are important because they show the system is already being built with operational efficiency in mind, not just feature breadth.

## Technology Stack

### Backend

- FastAPI
- Uvicorn
- Supabase
- httpx
- Pydantic
- Python dotenv / environment-based config

### Frontend

- React
- TypeScript
- Vite
- TanStack Query
- Tailwind CSS
- Recharts
- Framer Motion

## Project Vision

The long-term vision for Cyber Shield is to become a continuously helpful online safety layer for normal users, not just a one-time scanner. The platform is intended to scale from interactive checks into persistent monitoring and explainable protection.

That means building a system that is:

- Understandable by non-technical users
- Operationally affordable through caching and selective model usage
- Scalable through background processing and service separation
- Secure by design through managed auth and validated server-side flows
- Useful in the real world where people need confidence, not just raw threat scores

## Repository Layout

```text
app/
	config.py
	main.py
	middleware/
	models/
	routers/
	services/
	utils/
client/
	src/
requirements.txt
README.md
```

## Summary

Cyber Shield is a practical cyber-assistance platform built for a world where daily life increasingly depends on online services. It helps users feel safer online by combining threat scanning, breach monitoring, AI-guided analysis, and recovery advice in one system. Its design emphasizes availability, selective use of models, caching for cost control, managed authentication for secure password handling, and a scalable path toward deeper automated protection.