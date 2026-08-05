## ADDED Requirements

### Requirement: Block Scanner and Exploit Paths
The server SHALL intercept requests attempting to access known bot scanner, CMS exploit, or sensitive configuration paths before routing or database execution, returning HTTP 403 Forbidden.

#### Scenario: Request to known WordPress exploit path
- **WHEN** an incoming request targets a known WordPress pattern (e.g. `/wp-login.php`, `/wp-admin/`, `/wp-json/`, `/xmlrpc.php`)
- **THEN** the request shield middleware returns HTTP 403 Forbidden with `{ "success": false, "message": "Access denied" }` without executing application route handlers.

#### Scenario: Request to sensitive file path
- **WHEN** an incoming request targets sensitive configuration or metadata paths (e.g. `/.env`, `/.git/config`, `/.vscode/sftp.json`, `/config.json`, `/.DS_Store`)
- **THEN** the request shield middleware returns HTTP 403 Forbidden and logs a security alert.

### Requirement: Scanner Rate Limiting
The server SHALL enforce rate limits specifically for invalid route requests (HTTP 404 responses) to prevent automated discovery of unmapped endpoints.

#### Scenario: Excessive non-existent route probing
- **WHEN** a client IP generates more than 30 404 response errors within a 15-minute window
- **THEN** subsequent requests from that IP receive HTTP 429 Too Many Requests.

### Requirement: Security Event Logging
The server SHALL emit structured security log entries whenever suspicious probe requests or rate-limit violations occur.

#### Scenario: Blocked probe logging
- **WHEN** a bot or scanner request is blocked by the request shield
- **THEN** a warning log entry is emitted with level `warn`, including client IP, requested URL, request method, and user-agent string.
