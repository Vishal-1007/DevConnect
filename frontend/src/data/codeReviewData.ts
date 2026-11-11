import {
  Building2,
  Gauge,
  Layers,
  Shield,
  Sparkles,
  type LucideIcon,
} from 'lucide-react'

export type FocusAreaId =
  | 'security'
  | 'performance'
  | 'architecture'
  | 'clean-code'
  | 'interview-standard'

export interface ReviewFocusOption {
  id: FocusAreaId
  label: string
  description: string
  icon: LucideIcon
  accent: string
}

export interface ReviewLanguage {
  id: string
  label: string
  extension: string
}

export interface CodeReviewSubmission {
  title: string
  languageId: string
  languageLabel: string
  framework: string
  githubUrl: string
  code: string
  focusAreas: FocusAreaId[]
}

export const REVIEW_LANGUAGES: ReviewLanguage[] = [
  { id: 'java', label: 'Java', extension: 'java' },
  { id: 'typescript', label: 'TypeScript', extension: 'ts' },
  { id: 'javascript', label: 'JavaScript', extension: 'js' },
  { id: 'python', label: 'Python', extension: 'py' },
  { id: 'react', label: 'React/TSX', extension: 'tsx' },
  { id: 'go', label: 'Go', extension: 'go' },
  { id: 'csharp', label: 'C#', extension: 'cs' },
]

export const REVIEW_FRAMEWORKS: Record<string, string[]> = {
  java: ['Spring Boot', 'Quarkus', 'Micronaut', 'Plain Java'],
  typescript: ['Node.js', 'NestJS', 'Express', 'Next.js'],
  javascript: ['Node.js', 'Express', 'React', 'Vue'],
  python: ['Django', 'FastAPI', 'Flask', 'Plain Python'],
  react: ['React', 'Next.js', 'Remix', 'Vite + React'],
  go: ['Gin', 'Fiber', 'Echo', 'Standard library'],
  csharp: ['ASP.NET Core', '.NET MVC', 'Blazor'],
}

export const REVIEW_FOCUS_OPTIONS: ReviewFocusOption[] = [
  {
    id: 'security',
    label: 'Security Review',
    description: 'Find vulnerabilities, authentication issues, injection risks',
    icon: Shield,
    accent: '#ef4444',
  },
  {
    id: 'performance',
    label: 'Performance Review',
    description: 'Find slow queries, inefficient algorithms, memory issues',
    icon: Gauge,
    accent: '#f59e0b',
  },
  {
    id: 'architecture',
    label: 'Architecture Review',
    description: 'Check project structure, scalability, design patterns',
    icon: Layers,
    accent: '#818cf8',
  },
  {
    id: 'clean-code',
    label: 'Clean Code Review',
    description: 'Check naming, readability, SOLID principles',
    icon: Sparkles,
    accent: '#34d399',
  },
  {
    id: 'interview-standard',
    label: 'Interview Standard Review',
    description: 'Check if code quality matches company expectations',
    icon: Building2,
    accent: '#a78bfa',
  },
]

export const SAMPLE_SNIPPETS: { id: string; title: string; languageId: string; code: string }[] = [
  {
    id: 'user-reg',
    title: 'User registration handler',
    languageId: 'java',
    code: `@Service
public class UserRegistrationService {

    public User register(RegisterRequest req) {
        User user = new User();
        user.setEmail(req.getEmail());
        user.setPassword(req.getPassword());
        userRepository.save(user);
        emailService.sendWelcome(user.getEmail());
        return user;
    }
}`,
  },
  {
    id: 'react-list',
    title: 'React data fetching',
    languageId: 'react',
    code: `export function UserList() {
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetch('/api/users')
      .then(r => r.json())
      .then(setUsers);
  });

  return (
    <ul>
      {users.map(u => (
        <li key={Math.random()}>{u.name}</li>
      ))}
    </ul>
  );
}`,
  },
]

export const DEFAULT_FOCUS_AREAS: FocusAreaId[] = REVIEW_FOCUS_OPTIONS.map((o) => o.id)

/** @deprecated Kept for CodeReviewSessionPanel compatibility */
export const REVIEW_CHECKLIST = [
  'Code is readable and well-named',
  'Logic handles edge cases',
  'Error handling is appropriate',
  'Security concerns addressed',
  'Tests or test plan discussed',
]

export type ReviewVerdict = 'in_progress' | 'approved' | 'changes_requested'
