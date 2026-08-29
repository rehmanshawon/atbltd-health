# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased] — 2026-08-29

### Added

- Structured logging with nestjs-pino
- Sequential Maker-Checker approval workflow across all features
- Auto-generated passwords for owners/agents (name prefix + mobile suffix)
- SMS notifications for owner/agent approval
- Health endpoint (`GET /api/health`)
- About Chairman section on landing page
- Owners management page with expandable sub-agents
- Created By tracking for owners and agents
- Password visibility toggle on staff login

### Changed

- Member ID format: `ATB-26-ME-01`
- Staff ID formats: `ATB-26-SA-1`, `ATB-26-AD-1`, `ATB-26-OW-1`, `ATB-26-AG-1`
- Split large components into modular files (under 500 LOC)
- Replaced bcrypt with bcryptjs for Docker compatibility
- Official accounts moved to environment variables
- Seed passwords moved to environment variables

### Tests

- AuthService: 14 tests
- ClaimService: 9 tests
- AdminService: 9 tests
- AgentService: 10 tests
- ClaimDocumentService: 8 tests
- AgentApprovalService: 9 tests
- MembershipModal (Frontend): 5 tests

### Security

- Remove hardcoded temporary password
- Environment-based payment account routing
- npm audit in CI pipeline
- Role-based access control for all admin routes

### Documentation

- Comprehensive README.md
- .env.example files for backend and frontend
- CONTRIBUTING.md
- CHANGELOG.md

## [0.1.0] — 2026-08-15

### Added

- Initial release of ATB Ltd healthcare fintech platform
- Membership registration with bKash payment verification
- Claim/benefit application system with document upload
- Agent-owner commission engine with multi-level approvals
- Hospital partner portal for claim verification
- Real-time notification system (dashboard bell + SMS)
- 5-tier role-based access control
- Maker-Checker dual approval for financial operations
- Fraud detection (NID/mobile/transaction duplicate checks)
- Audit logging for all system actions
- CI/CD pipeline with GitHub Actions → Docker → AWS EC2
