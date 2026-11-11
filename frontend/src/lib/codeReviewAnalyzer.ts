import type { CodeReviewSubmission, FocusAreaId } from '../data/codeReviewData'

export type IssueSeverity = 'critical' | 'improvement' | 'good'

export interface CodeReviewIssue {
  id: string
  severity: IssueSeverity
  category: FocusAreaId
  problem: string
  explanation: string
  solution: string
  codeSuggestion?: string
}

export interface CategoryScores {
  security: number
  performance: number
  architecture: number
  'clean-code': number
  'interview-standard': number
}

export interface CodeReviewReport {
  overallScore: number
  scores: CategoryScores
  critical: CodeReviewIssue[]
  improvements: CodeReviewIssue[]
  goodPractices: CodeReviewIssue[]
  summary: string
  submission: CodeReviewSubmission
}

type Rule = {
  id: string
  category: FocusAreaId
  severity: IssueSeverity
  test: (code: string, submission: CodeReviewSubmission) => boolean
  problem: string
  explanation: string
  solution: string
  codeSuggestion?: string
}

const RULES: Rule[] = [
  {
    id: 'plain-password',
    category: 'security',
    severity: 'critical',
    test: (c) =>
      /setPassword\s*\([^)]*getPassword|password\s*=\s*req\.|stored as plain|plain text/i.test(c) ||
      (/setPassword\s*\(/i.test(c) && !/encode|hash|bcrypt|argon/i.test(c)),
    problem: 'Plain password handling detected',
    explanation:
      'Passwords are persisted or compared without hashing. This exposes credentials if the database is compromised.',
    solution: 'Hash passwords with BCrypt/Argon2 before storage; never log or return raw passwords.',
    codeSuggestion: `user.setPassword(passwordEncoder.encode(req.getPassword()));`,
  },
  {
    id: 'plain-compare',
    category: 'security',
    severity: 'critical',
    test: (c) => /password\s*==|password\.equals\s*\(\s*req/i.test(c),
    problem: 'Plain password comparison detected',
    explanation: 'Comparing raw passwords is insecure and fails industry authentication standards.',
    solution: 'Use passwordEncoder.matches(raw, encodedHash) for verification.',
    codeSuggestion: `if (!passwordEncoder.matches(rawPassword, user.getPasswordHash())) {
  throw new UnauthorizedException("Invalid credentials");
}`,
  },
  {
    id: 'sql-concat',
    category: 'security',
    severity: 'critical',
    test: (c) => /SELECT\s+.*\+|executeQuery\s*\(\s*".*\+/i.test(c),
    problem: 'Possible SQL injection via string concatenation',
    explanation: 'Building SQL with string concatenation allows attackers to inject malicious queries.',
    solution: 'Use parameterized queries or JPA repositories with bound parameters.',
    codeSuggestion: `// Prefer: userRepository.findByEmail(email)
// Or: jdbcTemplate.query("SELECT * FROM users WHERE email = ?", email)`,
  },
  {
    id: 'no-validation',
    category: 'security',
    severity: 'critical',
    test: (c) =>
      /register|create|save|post/i.test(c) &&
      !/@Valid|@NotNull|@NotBlank|validate\(|BeanValidation/i.test(c) &&
      /Request|Dto|Body/i.test(c),
    problem: 'Missing input validation',
    explanation: 'User-supplied data is accepted without server-side validation, increasing abuse and injection risk.',
    solution: 'Add Bean Validation (@Valid, @NotBlank, @Email) and reject invalid payloads with 400 responses.',
    codeSuggestion: `public User register(@Valid @RequestBody RegisterRequest req) { ... }`,
  },
  {
    id: 'infinite-effect',
    category: 'performance',
    severity: 'critical',
    test: (c) => /useEffect\s*\(\s*\(\)\s*=>\s*\{[^}]*fetch/i.test(c) && !/useEffect\s*\([^,]+,\s*\[/i.test(c),
    problem: 'useEffect may run on every render',
    explanation: 'Fetching inside useEffect without a dependency array can cause infinite re-fetch loops and UI jank.',
    solution: 'Add an empty dependency array for mount-only fetch, or list explicit dependencies.',
    codeSuggestion: `useEffect(() => {
  fetch('/api/users').then(r => r.json()).then(setUsers);
}, []);`,
  },
  {
    id: 'random-key',
    category: 'performance',
    severity: 'critical',
    test: (c) => /key=\{Math\.random|key:\s*Math\.random/i.test(c),
    problem: 'Unstable React list keys',
    explanation: 'Math.random() keys force unnecessary re-mounts and hurt reconciliation performance.',
    solution: 'Use stable unique identifiers (user.id) as list keys.',
    codeSuggestion: `{users.map(u => (
  <li key={u.id}>{u.name}</li>
))}`,
  },
  {
    id: 'global-mutable',
    category: 'architecture',
    severity: 'improvement',
    test: (c) => /const\s+\w+\s*=\s*new\s+Map|let\s+hits\s*=/i.test(c) && /rateLimit|limit/i.test(c),
    problem: 'In-memory global state for rate limiting',
    explanation: 'Module-level Maps do not scale across instances and reset on deploy.',
    solution: 'Move rate limits to Redis or API gateway; include TTL and per-instance sharding strategy.',
    codeSuggestion: `// Use Redis INCR with EXPIRE, or a dedicated rate-limit middleware`,
  },
  {
    id: 'fat-service',
    category: 'architecture',
    severity: 'improvement',
    test: (c) => /@Service/i.test(c) && (c.match(/\n/g)?.length ?? 0) > 25 && /email|repository|save/i.test(c),
    problem: 'Service layer may be doing too much',
    explanation: 'Registration, persistence, and notifications in one method reduce testability and scalability.',
    solution: 'Split into UserService, NotificationService, and use domain events for side effects.',
  },
  {
    id: 'empty-catch',
    category: 'clean-code',
    severity: 'improvement',
    test: (c) => /catch\s*\([^)]*\)\s*\{\s*\}/.test(c),
    problem: 'Empty catch block swallows errors',
    explanation: 'Silent failures make production debugging extremely difficult.',
    solution: 'Log the exception, map to a domain error, or rethrow as a wrapped exception.',
    codeSuggestion: `catch (Exception ex) {
  log.error("Registration failed", ex);
  throw new RegistrationException("Could not register user", ex);
}`,
  },
  {
    id: 'magic-numbers',
    category: 'clean-code',
    severity: 'improvement',
    test: (c) => /limit\s*=\s*100|>=\s*100(?!\d)/.test(c) && !/MAX_|LIMIT_|private static final/i.test(c),
    problem: 'Magic numbers in business logic',
    explanation: 'Hard-coded limits are hard to tune and document for other developers.',
    solution: 'Extract named constants or configuration properties.',
    codeSuggestion: `private static final int DEFAULT_RATE_LIMIT = 100;`,
  },
  {
    id: 'no-tests',
    category: 'interview-standard',
    severity: 'improvement',
    test: (c) => !/@Test|describe\(|it\(|pytest|JUnit/i.test(c) && c.length > 120,
    problem: 'No visible test coverage in submission',
    explanation: 'Interview-grade submissions usually include unit tests or a clear test plan.',
    solution: 'Add unit tests for happy path, validation failures, and edge cases.',
    codeSuggestion: `@Test
void register_hashesPasswordBeforeSave() { ... }`,
  },
  {
    id: 'pagination',
    category: 'performance',
    severity: 'improvement',
    test: (c) => /findAll\(\)|getAll|List<.*>\s+users/i.test(c) && !/Page|pageable|limit|offset/i.test(c),
    problem: 'Unbounded list fetch',
    explanation: 'Loading entire tables into memory does not scale and slows API responses.',
    solution: 'Add pagination (Pageable, cursor-based) and indexes on filter columns.',
    codeSuggestion: `Page<User> findAll(Pageable pageable);`,
  },
  {
    id: 'layered',
    category: 'architecture',
    severity: 'good',
    test: (c) => /@Service|@Repository|@Controller|interface\s+\w+Service/i.test(c),
    problem: 'Layered architecture detected',
    explanation: 'Separation into service/repository/controller layers supports maintainability.',
    solution: 'Keep controllers thin; push business rules into services and persistence into repositories.',
  },
  {
    id: 'naming',
    category: 'clean-code',
    severity: 'good',
    test: (c) => /UserRegistrationService|RegisterRequest|UserList/i.test(c),
    problem: 'Clear naming conventions',
    explanation: 'Descriptive class and method names improve readability for reviewers and teammates.',
    solution: 'Continue using domain-driven names; avoid abbreviations like tmp, data, obj.',
  },
  {
    id: 'async-email',
    category: 'performance',
    severity: 'good',
    test: (c) => /@Async|CompletableFuture|sendWelcome/i.test(c),
    problem: 'Side effects considered (email/notify)',
    explanation: 'Welcome emails are a natural async boundary to keep registration latency low.',
    solution: 'If not async yet, publish a UserRegistered event consumed by a notification worker.',
    codeSuggestion: `@Async
public void sendWelcome(String email) { ... }`,
  },
]

function clampScore(n: number): number {
  return Math.min(10, Math.max(0, Math.round(n * 10) / 10))
}

function scoreForCategory(
  category: FocusAreaId,
  issues: CodeReviewIssue[],
  selected: boolean
): number {
  if (!selected) return 0
  let score = 8.5
  for (const issue of issues.filter((i) => i.category === category)) {
    if (issue.severity === 'critical') score -= 1.8
    else if (issue.severity === 'improvement') score -= 0.6
    else score += 0.4
  }
  return clampScore(score)
}

export function analyzeCodeSubmission(submission: CodeReviewSubmission): CodeReviewReport {
  const code = submission.code.trim()
  const lower = code.toLowerCase()
  const focusSet = new Set(submission.focusAreas)

  const matched: CodeReviewIssue[] = []

  for (const rule of RULES) {
    if (!focusSet.has(rule.category)) continue
    if (!rule.test(code, submission)) continue
    matched.push({
      id: rule.id,
      severity: rule.severity,
      category: rule.category,
      problem: rule.problem,
      explanation: rule.explanation,
      solution: rule.solution,
      codeSuggestion: rule.codeSuggestion,
    })
  }

  if (submission.githubUrl && !/^https?:\/\/(www\.)?github\.com\//i.test(submission.githubUrl)) {
    matched.push({
      id: 'invalid-github',
      severity: 'improvement',
      category: 'architecture',
      problem: 'GitHub URL format looks invalid',
      explanation: 'A valid repository link helps mentors review full project context.',
      solution: 'Use format: https://github.com/org/repo',
    })
  }

  if (code.length < 40) {
    matched.push({
      id: 'short-code',
      severity: 'improvement',
      category: 'interview-standard',
      problem: 'Submission is very short',
      explanation: 'Short snippets limit depth of security and architecture analysis.',
      solution: 'Include the full feature module or PR diff for a richer review.',
    })
  }

  if (lower.includes('todo') || lower.includes('fixme')) {
    matched.push({
      id: 'todo-left',
      severity: 'improvement',
      category: 'interview-standard',
      problem: 'TODO/FIXME markers in code',
      explanation: 'Unresolved TODOs signal incomplete work before review or merge.',
      solution: 'Resolve or ticket TODOs before requesting mentor review.',
    })
  }

  if (!matched.some((i) => i.severity === 'good')) {
    matched.push({
      id: 'structure-ok',
      severity: 'good',
      category: 'clean-code',
      problem: 'Readable code structure',
      explanation: 'Your submission is formatted clearly enough for automated static analysis.',
      solution: 'Keep consistent indentation and small functions for mentor review.',
    })
  }

  const critical = matched.filter((i) => i.severity === 'critical')
  const improvements = matched.filter((i) => i.severity === 'improvement')
  const goodPractices = matched.filter((i) => i.severity === 'good')

  const scores: CategoryScores = {
    security: scoreForCategory('security', matched, focusSet.has('security')),
    performance: scoreForCategory('performance', matched, focusSet.has('performance')),
    architecture: scoreForCategory('architecture', matched, focusSet.has('architecture')),
    'clean-code': scoreForCategory('clean-code', matched, focusSet.has('clean-code')),
    'interview-standard': scoreForCategory('interview-standard', matched, focusSet.has('interview-standard')),
  }

  const activeScores = submission.focusAreas.map((id) => scores[id]).filter((s) => s > 0)
  const overallScore = clampScore(
    activeScores.length
      ? activeScores.reduce((a, b) => a + b, 0) / activeScores.length
      : 7
  )

  const summary =
    critical.length > 0
      ? `${critical.length} critical issue(s) found. Address these before production or mentor sign-off.`
      : improvements.length > 0
        ? 'Solid foundation with room for improvement. Review suggestions below to reach interview-ready quality.'
        : 'Strong code quality signals. Consider an expert mentor review for production-grade validation.'

  return {
    overallScore,
    scores,
    critical,
    improvements,
    goodPractices,
    summary,
    submission,
  }
}

export function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}
