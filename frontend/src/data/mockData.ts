export const quickJoinRooms = [
  {
    id: '1',
    title: 'System Design Discussion',
    capacity: 4,
    max: 8,
    tags: ['System Design', 'Architecture'],
    host: 'Expert',
    hostAgo: '2 mins ago',
    participants: 3,
  },
  {
    id: '2',
    title: 'React Performance Tips',
    capacity: 6,
    max: 10,
    tags: ['React', 'Frontend'],
    host: 'Sarah Chen',
    hostAgo: '5 mins ago',
    participants: 4,
  },
  {
    id: '3',
    title: 'DSA Problem Solving',
    capacity: 2,
    max: 6,
    tags: ['DSA', 'Algorithms'],
    host: 'Mike Johnson',
    hostAgo: '1 min ago',
    participants: 2,
  },
]

export const topMentorsMock = [
  {
    id: '1',
    name: 'Rahul Sharma',
    title: 'Senior Backend Engineer at Paytm',
    rating: 4.9,
    sessions: 156,
    online: true,
  },
  {
    id: '2',
    name: 'Sarah Chen',
    title: 'Frontend Lead at Google',
    rating: 4.8,
    sessions: 89,
    online: true,
  },
  {
    id: '3',
    name: 'Mike Johnson',
    title: 'Staff Engineer at Amazon',
    rating: 4.7,
    sessions: 203,
    online: false,
  },
]

export const chatMessagesMock = [
  {
    id: '1',
    sender: 'Rahul Sharma',
    isExpert: true,
    time: '2:34 PM',
    text: "Hi Arjun! Ready to help you with system design today. What would you like to focus on?",
  },
  {
    id: '2',
    sender: 'Arjun Singh',
    isExpert: false,
    time: '2:35 PM',
    text: "Hi Rahul! I'd like to practice designing a URL shortener. Can we start with requirements gathering?",
  },
  {
    id: '3',
    sender: 'Rahul Sharma',
    isExpert: true,
    time: '2:36 PM',
    text: "Great choice! Let's begin with functional requirements. What features do you think are essential?",
  },
]

export const whyDevConnect = [
  { title: 'Instant Connections', icon: 'zap' as const },
  { title: 'Expert Mentorship', icon: 'users' as const },
  { title: 'Skill Development', icon: 'trending' as const },
  { title: 'Global Community', icon: 'globe' as const },
]
