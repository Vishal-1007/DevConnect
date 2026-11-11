export type MessageAttachment = {
  id: string
  name: string
  fileType: 'PDF' | 'DOC' | 'IMAGE'
  size: string
  url?: string
}

export type ChatMessage = {
  id: string
  sender: 'recruiter' | 'candidate'
  text: string
  time: string
  dateLabel?: string
  read?: boolean
  attachment?: MessageAttachment
}

export type ConversationInterviewStage = {
  type: string
  date: string
  time: string
  platform: string
  meetingLink?: string
}

export type RecruiterConversation = {
  id: string
  candidateId: string
  candidateName: string
  candidateAvatar: string
  role: string
  verified: boolean
  devScore: number
  percentile: string
  location: string
  status: 'Open to Work' | 'Interviewing' | 'Not Looking'
  skills: string[]
  lastMessage: string
  lastMessageTime: string
  unreadCount: number
  starred: boolean
  messages: ChatMessage[]
  interviewStage?: ConversationInterviewStage
  recruiterNotes?: string
}

function daysFromToday(offset: number): string {
  const d = new Date()
  d.setDate(d.getDate() + offset)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export const RECRUITER_CONVERSATIONS: RecruiterConversation[] = [
  {
    id: 'conv-1',
    candidateId: 'c1',
    candidateName: 'Vishal Gupta',
    candidateAvatar: 'VG',
    role: 'Java Backend Developer',
    verified: true,
    devScore: 925,
    percentile: 'Top 3%',
    location: 'Bangalore, India',
    status: 'Open to Work',
    skills: ['Java', 'Spring Boot', 'MySQL', 'AWS', 'REST API', 'Docker', 'Microservices', 'Kafka', 'Redis'],
    lastMessage: 'Yes, that works for me.',
    lastMessageTime: '4:32 PM',
    unreadCount: 2,
    starred: true,
    interviewStage: {
      type: 'Technical Round',
      date: daysFromToday(2),
      time: '15:00',
      platform: 'Google Meet',
      meetingLink: 'https://meet.google.com/abc-defg-hij',
    },
    recruiterNotes: 'Strong DevScore. Recommended for technical round.',
    messages: [
      {
        id: 'm1',
        sender: 'candidate',
        text: "Hi Infosys Recruiter,\n\nThank you for considering my profile.\nI'm excited about the opportunity.",
        time: '10:30 AM',
        dateLabel: '13 June 2026',
      },
      {
        id: 'm2',
        sender: 'recruiter',
        text: "Hi Vishal,\n\nThank you for your interest.\n\nWe would like to schedule a technical round tomorrow at 3 PM.",
        time: '11:02 AM',
        read: true,
      },
      {
        id: 'm3',
        sender: 'candidate',
        text: 'Yes, that works for me.',
        time: '11:15 AM',
      },
      {
        id: 'm4',
        sender: 'recruiter',
        text: "Great!\n\nYour technical interview has been scheduled.\n\nGoogle Meet link will be shared shortly.",
        time: '11:18 AM',
        read: true,
      },
      {
        id: 'm5',
        sender: 'candidate',
        text: 'Thank you! I have attached my updated resume for your reference.',
        time: '4:30 PM',
        attachment: {
          id: 'att-1',
          name: 'Vishal_Gupta_Resume.pdf',
          fileType: 'PDF',
          size: '1.2 MB',
          url: '#',
        },
      },
    ],
  },
  {
    id: 'conv-2',
    candidateId: 'c2',
    candidateName: 'Ananya Singh',
    candidateAvatar: 'AS',
    role: 'Full Stack Developer',
    verified: true,
    devScore: 898,
    percentile: 'Top 5%',
    location: 'Hyderabad, India',
    status: 'Open to Work',
    skills: ['React', 'Node.js', 'PostgreSQL', 'TypeScript', 'GraphQL', 'Redis'],
    lastMessage: 'Thank you for considering my profile...',
    lastMessageTime: '2:15 PM',
    unreadCount: 1,
    starred: false,
    messages: [
      {
        id: 'm6',
        sender: 'candidate',
        text: 'Thank you for considering my profile. I am very interested in the Full Stack Engineer role at Infosys.',
        time: '2:10 PM',
        dateLabel: '12 June 2026',
      },
      {
        id: 'm7',
        sender: 'recruiter',
        text: 'Hi Ananya, your DevScore of 898 and AI interview results look excellent. We would like to discuss next steps.',
        time: '2:12 PM',
        read: true,
      },
      {
        id: 'm8',
        sender: 'candidate',
        text: 'Thank you for considering my profile...',
        time: '2:15 PM',
      },
    ],
  },
  {
    id: 'conv-3',
    candidateId: 'c3',
    candidateName: 'Rahul Kumar',
    candidateAvatar: 'RK',
    role: 'Java Developer',
    verified: true,
    devScore: 872,
    percentile: 'Top 8%',
    location: 'Pune, India',
    status: 'Interviewing',
    skills: ['Java', 'Spring Boot', 'MySQL', 'Docker', 'JUnit', 'Maven'],
    lastMessage: 'Looking forward to the interview.',
    lastMessageTime: 'Yesterday',
    unreadCount: 0,
    starred: false,
    interviewStage: {
      type: 'HR Round',
      date: daysFromToday(5),
      time: '11:00',
      platform: 'Zoom',
    },
    messages: [
      {
        id: 'm9',
        sender: 'recruiter',
        text: 'Hi Rahul, we reviewed your coding challenge score (850) and mentor rating. Would you be available for an HR round next week?',
        time: '3:00 PM',
        dateLabel: '10 June 2026',
        read: true,
      },
      {
        id: 'm10',
        sender: 'candidate',
        text: 'Looking forward to the interview.',
        time: '3:45 PM',
      },
    ],
  },
  {
    id: 'conv-4',
    candidateId: 'c4',
    candidateName: 'Sneha Iyer',
    candidateAvatar: 'SI',
    role: 'Frontend Developer',
    verified: true,
    devScore: 845,
    percentile: 'Top 12%',
    location: 'Bangalore, India',
    status: 'Open to Work',
    skills: ['React', 'Next.js', 'Tailwind', 'GraphQL', 'TypeScript', 'Figma'],
    lastMessage: 'I can start within 2 weeks notice period.',
    lastMessageTime: 'Mon',
    unreadCount: 0,
    starred: true,
    messages: [
      {
        id: 'm11',
        sender: 'candidate',
        text: 'Hi, I saw the Frontend Developer opening. My DevScore is 845 with verified React and Next.js projects.',
        time: '9:20 AM',
        dateLabel: '9 June 2026',
      },
      {
        id: 'm12',
        sender: 'recruiter',
        text: 'Thanks Sneha! Your portfolio projects scored well in our AI review. What is your notice period?',
        time: '10:05 AM',
        read: true,
      },
      {
        id: 'm13',
        sender: 'candidate',
        text: 'I can start within 2 weeks notice period.',
        time: '10:30 AM',
      },
    ],
  },
  {
    id: 'conv-5',
    candidateId: 'c5',
    candidateName: 'Rahul Verma',
    candidateAvatar: 'RV',
    role: 'DevOps Engineer',
    verified: false,
    devScore: 831,
    percentile: 'Top 15%',
    location: 'Chennai, India',
    status: 'Open to Work',
    skills: ['AWS', 'Kubernetes', 'CI/CD', 'Terraform', 'Docker', 'Linux'],
    lastMessage: 'Happy to share my infrastructure project details.',
    lastMessageTime: 'Sun',
    unreadCount: 3,
    starred: false,
    messages: [
      {
        id: 'm14',
        sender: 'recruiter',
        text: 'Hi Rahul, we are hiring DevOps engineers with strong AWS and Kubernetes experience. Interested?',
        time: '4:00 PM',
        dateLabel: '8 June 2026',
        read: true,
      },
      {
        id: 'm15',
        sender: 'candidate',
        text: 'Happy to share my infrastructure project details.',
        time: '5:10 PM',
      },
    ],
  },
]
