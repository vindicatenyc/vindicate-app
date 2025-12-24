# Security Policy

## Supported Versions

| Version | Supported          |
| ------- | ------------------ |
| 0.1.x   | :white_check_mark: |

## Reporting a Vulnerability

**DO NOT** open a public issue for security vulnerabilities.

Please email security@vindicate.nyc with:
- Description of the vulnerability
- Steps to reproduce
- Potential impact
- Any suggested fixes

We will respond within 48 hours and work with you on a fix.

## Security Measures

### Data Protection
- All TIER 1 data (SSN, bank accounts, tax documents) encrypted with AES-256
- TLS 1.3 for all data in transit
- Access logging for all sensitive data

### Authentication
- bcrypt password hashing with per-user salt
- Rate limiting on authentication endpoints
- Session tokens with secure expiration

### Code Security
- Automated security scanning (Gitleaks, Bandit, Semgrep)
- Dependency vulnerability monitoring
- SQL injection prevention via parameterized queries
- XSS prevention via input sanitization

## Responsible Disclosure

We follow a 90-day responsible disclosure timeline. We will:
1. Confirm receipt within 48 hours
2. Investigate and validate within 7 days
3. Develop and test fix within 30 days
4. Release fix within 90 days
5. Credit reporters in security advisories (unless anonymity requested)
