# Third-Party External Services

## Credential Management

- When requesting a credential from the user, explain what it is for and what access scope is required.
- Guide the user through obtaining missing credentials (where to find/create them).
- Validate credentials before relying on them (smoke test the auth flow / minimal request).
- Implement refresh/rotation procedures for expiring credentials where applicable.
- Provide secure storage guidance (environment variables, secret managers, OS keychain); avoid plaintext storage.
- Use placeholders in sample config files; do not store real secrets in examples.
- Never print credentials in logs/output; prefer redaction.

## Service Integration

- Verify the user completed required setup steps for the service.
- Confirm necessary permissions/scopes/settings are configured.
- Test connectivity before using the service in a broader workflow.
- Document version requirements and integration dependencies (SDK versions, API versions, platform constraints).
- Plan for outages and failure modes (timeouts, retries/backoff, fallbacks, circuit breakers, etc.).
