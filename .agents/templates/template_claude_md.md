<!--
TEMPLATE — template_claude_md.md
Produces the repository's CLAUDE.md. Keep every section, heading, ordering and
formatting exactly as written. Text in [square brackets] is a slot: replace it
with this application's content from the PRD and TAD, then remove the brackets.
Everything outside brackets is kept as written. Delete this comment block from
the finished file.
-->

# [Application name] — Global Agent Rules

## 1. Core Principles

**VERBOSE NAMING IS NON-NEGOTIABLE**

- Clarity over brevity, always

**STRUCTURED JSON LOGGING IS MANDATORY**

- Every operation logs start + completion (or failure) with contextual fields
- Dotted namespace events: `domain.component.action_state`
- [The correlation-ID rule for this application, beginning: `request_id` on every API log]

**SECURITY AND DATA HANDLING ARE NON-NEGOTIABLE**

- Never read, modify, or commit files containing API keys, tokens, credentials, or private certificates
- Never commit sensitive configuration files, private data files, or files with embedded plaintext secrets
- Use environment variables or managed secrets; never store credentials in plaintext
- Ensure compliance with relevant data protection regulations (e.g., GDPR, CCPA)

**TYPE SAFETY IS REQUIRED**

- Full type hints on every function signature
- Both configured type checkers must pass in strict mode
- No `# type: ignore` or `# noqa` without a documented reason on the same line

**REQUIREMENT ALIGNMENT IS REQUIRED**

- Maintain a three-way match between: stated requirements (PRD, TAD), implementation plan, and final code

**DOCSTRINGS ON ALL PUBLIC FUNCTIONS**

- Google-style with `Args:` and `Returns:` sections

**KISS** (Keep It Simple, Stupid)

- Prefer simple, readable solutions over clever abstractions

**YAGNI** (You Aren't Gonna Need It)

- Defer building features until they're actually needed

**SOLUTIONS MUST BE GROUNDED**

- Demonstrate solutions are grounded in project docs, existing code, or verified research.

---

## 2. Tech Stack

### Backend

- **Language:** [language and version]
- **Package manager:** [package manager]
- **Framework:** [web framework and version floor + validation library and version floor]
- **ORM:** [ORM and driver, with version floors]
- **Logging:** [logging library and version floor (output format)]
- **Database:** [database provider and version; extensions; migration tool]
- **Lint/format:** [linter/formatter and version floor (line length, quote style, rule set)]
- **Type checking:** [type checkers and version floors (both required)]
- **Testing:** [test framework and plugins, with version floors]

### Frontend

[The frontend stack from the TAD, in the same bullet format as Backend: language, runtime/package manager, framework, validation/forms, lint/format, testing, logging, data access. With no frontend in the TAD: None in scope.]

---

## 3. Architecture

```
app/
├── core/                   # Universal infra — required by all slices
│   ├── config.py           # Settings singleton (get_settings)
│   ├── database.py         # Async engine, session factory, Base, get_db
│   ├── logging.py          # Logging setup, correlation ID context vars
│   ├── middleware.py        # RequestLoggingMiddleware, CORS
│   ├── exceptions.py       # AppException base, ErrorResponse, global handler
│   ├── health.py           # /health, /health/db, /health/ready
│   └── tests/              # Core unit tests (colocated)
├── shared/                 # Cross-feature utilities (3+ slice rule)
│   ├── models.py           # ORM mixins: [the mixins for this application]
│   ├── schemas.py          # [the application-wide enums and shared schemas]
│   ├── utils.py            # utcnow(), format_iso()
│   └── tests/
├── {feature}/              # Vertical slices: [the slice names from the TAD]
│   ├── models.py
│   ├── schemas.py
│   ├── router.py
│   ├── service.py
│   └── tests/              # Colocated unit tests (no DB, no HTTP)
├── tests/                  # Backend integration tests (multi-slice, HTTP-level)
[└── the entry-point module(s) for this application, one line each with its purpose]
```

**Rules:**

- `app/core/` — infrastructure only; never imports feature slices or `app/shared/`
- `app/shared/` — only code used by **3 or more** feature slices; never feature-specific logic
- Each feature slice is self-contained; cross-slice dependencies go through `app/shared/`
- [The process-model rule for this application: how many services, from how many images, with which entry points]

---

## 4. Code Style

### Size limits

- **Files:** 500 lines max — refactor into modules when approaching this limit
- **Functions:** 50 lines max — extract helpers if a function grows beyond this
- **Parameters:** Move constants, configurations, and long strings to separate files.

### Naming

- Functions and variables: `snake_case`
- Classes (models, schemas, exceptions, etc.): `PascalCase`
- Model fields: verbose — `customer_id`, `order_status`, `created_at` (never `id`, `status`)
- Constants: `UPPER_SNAKE_CASE`

### Docstrings (Google style — required on all public functions)

```python
async def get_customer_by_id(
    customer_id: UUID,
    db: AsyncSession,
) -> Customer | None:
    """Fetch a single customer by primary key.

    Queries the customers table using the provided ID and returns
    the full ORM instance if it exists.

    Args:
        customer_id (UUID): Primary key of the customer to retrieve.
        db (AsyncSession): Async database session (injected as a dependency).

    Returns:
        Customer | None: Customer ORM instance if found, None otherwise.

    Raises:
        AppException: If the caller is not permitted to read the customer.
    """
```

### ORM models — always use shared mixins

```python
from app.shared.models import TimestampMixin

class Customer(Base, TimestampMixin):
    __tablename__ = "customers"

    customer_id: Mapped[UUID] = mapped_column(primary_key=True)
    email_address: Mapped[str] = mapped_column(String(320), nullable=False)
    customer_status: Mapped[str] = mapped_column(
        String(20), nullable=False, default=CustomerStatus.ACTIVE
    )
```

### Schemas

```python
from pydantic import BaseModel, ConfigDict

class CustomerResponse(BaseModel):
    customer_id: UUID
    customer_status: CustomerStatus
    created_at: datetime

    model_config = ConfigDict(from_attributes=True)
```

> **External API exception:** Public-facing API response schemas may use shorter field names (e.g., `status` instead of `customer_status`) for consumer ergonomics. Internal model fields and database columns must always use verbose names. When a schema serves both purposes, use `serialization_alias` to map verbose internal names to shorter external names.

---

## 5. Logging

```python
from app.core.logging import get_logger

log = get_logger(__name__)
```

**Event name format:** `domain.component.action_state`

- Good: `orders.checkout.validation_started`, `billing.invoice.generation_failed`
- Bad: `validation_started`, `failed`, `checkout`

**States:** `_started`, `_completed`, `_failed` (general); `_validated`, `_rejected` (validation operations)

**Always include contextual fields; never log bare messages.**

**Never log secrets, API keys, credentials, or sensitive document contents.**

```python
# Operation start + completion pair
log.info("orders.checkout.validation_started", order_id=str(order_id))

result = await _validate_order(order)

log.info(
    "orders.checkout.validation_completed",
    order_id=str(order_id),
    line_item_count=result.line_item_count,
    total_amount=str(result.total_amount),
)

# Error with structured context
log.error(
    "orders.checkout.validation_failed",
    order_id=str(order_id),
    error_code="ORDERS_INPUT_EMPTY_CART",
    exc_info=True,
)
```

[How each correlation ID this application uses is set and cleared, beginning: **`request_id`** is set automatically by `RequestLoggingMiddleware` on every inbound request.]

---

## 6. Testing

### Test locations

| Test type           | Location                             | Marker                     |
| ------------------- | ------------------------------------ | -------------------------- |
| Backend unit        | `app/{slice}/tests/`                 | (none required)            |
| Backend integration | `app/tests/`                         | `@pytest.mark.integration` |
| Cross-stack E2E     | `tests/` (root)                      | -- (future)                |

### Rules

- Tests must cover happy paths, edge cases, boundary conditions, and failure/error paths
- Root `tests/` is reserved for cross-stack E2E only — never place unit or integration tests there
- Unit tests: no real DB, no HTTP, no external provider calls -- mocks acceptable at slice boundaries
- Integration tests: HTTP-level through the async test client against the application; still mock external providers
- Test names: `test_<function>_<condition>_<expected_result>`
- Async test mode is configured -- no per-test async marker needed
- Integration test fixtures live in `app/tests/conftest.py` -- always use `test_db_engine` / `test_db_session` fixtures, never import `engine` / `AsyncSessionLocal` from `app.core.database` directly (event loop mismatch)

### Unit test example

```python
async def test_validate_order_with_empty_cart_raises_app_exception() -> None:
    with pytest.raises(AppException) as exc_info:
        await validate_order(Order(line_items=[]), order_id=uuid4())
    assert exc_info.value.error_code == "ORDERS_INPUT_EMPTY_CART"
    assert exc_info.value.retryable is False
```

### Integration test example

```python
@pytest.mark.integration
async def test_post_order_returns_202_with_order_id(
    client: AsyncClient,
) -> None:
    response = await client.post(
        "/api/v1/orders",
        json=SAMPLE_ORDER_PAYLOAD,
    )
    assert response.status_code == 202
    assert "order_id" in response.json()
```

---

## 7. Error Handling

**Error code format:** [the error-code format for this application and its domain list] -- e.g., `ORDERS_INPUT_EMPTY_CART`, `BILLING_PROVIDER_TIMEOUT`

```python
from app.core.exceptions import AppException, ErrorResponse

raise AppException(
    error_code="ORDERS_INPUT_EMPTY_CART",
    http_status_code=422,
    message="An order must contain at least one line item.",
    retryable=False,
)
```

- Raise `AppException` (or a subclass like `DatabaseError`) for all application-layer errors
- 5xx response bodies are **intentionally generic**
- All `AppException` instances with `http_status_code >= 500` must use a generic, non-sensitive `message` (e.g., `"Service temporarily unavailable. Please try again later."`). Full diagnostics go to structured logs only.
- Externally returned errors must be non-sensitive; put full diagnostics in structured logs only
- The global handler in `app/core/exceptions.py` converts `AppException` -> `ErrorResponse` automatically
- The handler auto-attaches [the correlation IDs this application uses] from the logging context.
- Exception: `app/core/health.py` may raise `HTTPException` directly (infrastructure-only, not application logic)

**`ErrorResponse` shape** (canonical across all endpoints):

```python
class ErrorResponse(BaseModel):
    error_code: str          # [the error-code format]
    message: str
    request_id: str | None
    [one line per further correlation-ID field this application carries]
    retryable: bool
```

---

## 8. Common Patterns

- [Where reference material for recurring patterns (e.g. router + service, pagination, lifespan mounting) lives under `.agents/reference/`, or that it is to come.]

---

## 9. Development Commands

```bash
# Setup — NEVER edit dependency declarations directly, always use the package manager's add / remove commands
# Dependencies — update as part of the same change whenever packages are introduced or removed
[install-dependencies command]                             # Install all dependencies
cp .env.example .env                                       # Create local env file (first time)

# Running services
[API dev server command, with the port]                    # API dev server
[one line per additional service]

# Database
[start local database command]                             # Start local DB (port [port])
[reset-and-migrate command]                                # Reset + re-apply all migrations
[new-migration command]                                    # New migration file

# Tests
[unit-tests-only command]                                  # Unit tests only (fast)
[all-tests command]                                        # All tests (requires the local database)
[integration-tests-only command]                           # Integration tests only

# Lint, format, type checking (run all before committing)
[lint and format command]
[type checker command, one line per checker]

# Containers
[build-and-start command]                                  # [the services] in containers
[one line per additional service]
```

---

## 10. Human Communication Rules

**PHILOSOPHY**

- You may read highly technical materials and perform senior-level engineering work, but communication with the project owner must be calibrated to their role and background.
- Treat the project owner as:
  - a nontechnical executive for product, business, delivery, risk, and prioritisation matters
  - a junior engineer for implementation matters
  - an intelligent decision-maker who needs clear explanations, not oversimplification

**SCOPE**

- Applies to every reply addressed to the project owner, including progress updates, code explanations, document walkthroughs, answers to questions, and general project conversation.
- Does **not** apply to the underlying artefacts themselves. Source code, docstrings, reference documents, sub-agent prompts, and commit messages remain appropriately technical.
- These rules govern how you talk to the project owner about those artefacts.

**GOAL**

- The goal is not to reduce complexity. The goal is to make complexity navigable.
- Preserve important technical nuance, but explain it in a way the project owner can follow.
- Act like a senior technical advisor, teacher, and implementation partner to the project owner.

**PRACTICAL RULES**

- Start with the practical meaning before technical detail.
- Explain why something matters, not only what happened.
- Omit performative agreement, generic setup, repeated summaries, and adjacent detail that does not improve understanding, decision making, or progress tracking.
- Use technical terms when useful, but define or contextualise them when they may not be obvious.
- When citing a document section, briefly explain what that section is for; do not rely on section numbers alone.
- When explaining code, first describe what it does, what it produces, and where it fits before walking through implementation detail.
- When comparing options, give the plain-language consequence of each option before technical trade-offs.
- Prefer concrete examples over abstract architecture language.
- Do not assume the project owner can infer implications from technical shorthand.
- Do not dumb things down; make the real issue legible.
- Calibrate depth to the situation: brief for simple updates, deeper for architecture, risk, scope, learning, or important decisions.
- When depth is needed, explain in layers: plain-English meaning, project impact, technical mechanism, then trade-offs or edge cases.
- If the project owner appears confused, frustrated, or uncertain, slow down and reframe before continuing.
- Avoid meta-commentary such as "honest answer" or "fair criticism"; just state the point clearly.

**FAILURE MODES**

- Too technical: senior-engineer shorthand without explanation.
- Too simplistic: removing detail the project owner needs to make informed judgments.

**PROJECT OWNER CONTROL**

- Optimise communication for understanding, decision making, progress tracking, and the project owner's ability to intervene and stay in control of the project.

---

## 11. AI Agent Instructions

<!-- Rebuild this list from the sections present in the finished file; every item must point at a section that exists. -->

1. **Match the vertical slice** per Section 3
2. **Log every operation** per Section 5
3. **Use verbose field names** per Section 4
4. **Apply all shared mixins** per Section 4
5. **Error codes and exceptions** per Section 7
6. **Write colocated tests** per Section 6
7. **Run linters and type checkers before finishing** per Section 9
8. **No suppression comments without a documented reason** per Section 1
9. **Never import across feature slices** per Section 3
10. **Never use git commands:** `git add .`, `git add -A` or `git add --all`
11. **Communicate with the project owner** per Section 10
