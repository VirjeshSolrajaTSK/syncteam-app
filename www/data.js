// Team Task Tracker - Default Mock Data (Global Variables)
// Stored on window object to support file:// protocol preview without CORS issues.

window.initialTeam = [
  {
    id: "tm-1",
    name: "Sarah Jenkins",
    role: "Lead Frontend Engineer",
    email: "sarah.j@company.com",
    avatarColor: "#8b5cf6", // Violet
    status: "active",
    timezone: "GMT-5"
  },
  {
    id: "tm-2",
    name: "Alex Rivera",
    role: "Backend Architect",
    email: "alex.r@company.com",
    avatarColor: "#3b82f6", // Blue
    status: "active",
    timezone: "GMT-8"
  },
  {
    id: "tm-3",
    name: "Elena Rostova",
    role: "UI/UX Designer",
    email: "elena.r@company.com",
    avatarColor: "#ec4899", // Pink
    status: "away",
    timezone: "GMT+2"
  },
  {
    id: "tm-4",
    name: "Marcus Chen",
    role: "QA Automation Engineer",
    email: "marcus.c@company.com",
    avatarColor: "#10b981", // Emerald
    status: "active",
    timezone: "GMT+8"
  },
  {
    id: "tm-5",
    name: "David Kross",
    role: "DevOps Specialist",
    email: "david.k@company.com",
    avatarColor: "#f59e0b", // Amber
    status: "offline",
    timezone: "GMT+1"
  }
];

window.initialTasks = [
  {
    id: "task-1",
    title: "Implement OAuth2 Authentication Flow",
    description: "Integrate Google and GitHub OAuth sign-in options on the main portal. Ensure JWT sessions are secured and tokens refresh properly.",
    priority: "high",
    status: "in_progress",
    assigneeId: "tm-2", // Alex Rivera
    dueDate: "2026-06-25",
    dateCreated: "2026-06-18",
    history: [
      {
        id: "hist-1",
        timestamp: "2026-06-18T14:30:00Z",
        type: "system",
        message: "Task created and assigned to Alex Rivera"
      }
    ]
  },
  {
    id: "task-2",
    title: "Redesign Settings Dashboard Panel",
    description: "Update the user profile and application settings pages to align with the new glassmorphism theme guidelines. Add dark mode toggle animations.",
    priority: "medium",
    status: "blocked",
    assigneeId: "tm-3", // Elena Rostova
    dueDate: "2026-06-22",
    dateCreated: "2026-06-15",
    history: [
      {
        id: "hist-2",
        timestamp: "2026-06-15T10:00:00Z",
        type: "system",
        message: "Task created and assigned to Elena Rostova"
      },
      {
        id: "hist-3",
        timestamp: "2026-06-16T11:20:00Z",
        type: "status_update",
        message: "Status updated to Blocked"
      }
    ]
  },
  {
    id: "task-3",
    title: "Write Cypress E2E Tests for Checkout Flow",
    description: "Cover user registration, adding items to cart, promo code application, credit card validation, and final payment receipt generation.",
    priority: "high",
    status: "todo",
    assigneeId: "tm-4", // Marcus Chen
    dueDate: "2026-06-28",
    dateCreated: "2026-06-19",
    history: [
      {
        id: "hist-4",
        timestamp: "2026-06-19T09:15:00Z",
        type: "system",
        message: "Task created and assigned to Marcus Chen"
      }
    ]
  },
  {
    id: "task-4",
    title: "Optimize SVG Icons and Web Assets",
    description: "Compress all layout graphic components and convert assets to WebP format. Set up bundle configuration rules to compress assets at build time.",
    priority: "low",
    status: "done",
    assigneeId: "tm-1", // Sarah Jenkins
    dueDate: "2026-06-18",
    dateCreated: "2026-06-14",
    history: [
      {
        id: "hist-5",
        timestamp: "2026-06-14T16:00:00Z",
        type: "system",
        message: "Task created and assigned to Sarah Jenkins"
      },
      {
        id: "hist-6",
        timestamp: "2026-06-18T15:45:00Z",
        type: "status_update",
        message: "Status updated to Done"
      }
    ]
  },
  {
    id: "task-5",
    title: "Configure Production K8s Cluster Routing",
    description: "Establish ingress controllers, load balancing policies, and TLS termination certificates for the new microservices cluster.",
    priority: "high",
    status: "todo",
    assigneeId: "tm-5", // David Kross
    dueDate: "2026-06-30",
    dateCreated: "2026-06-19",
    history: [
      {
        id: "hist-7",
        timestamp: "2026-06-19T13:00:00Z",
        type: "system",
        message: "Task created and assigned to David Kross"
      }
    ]
  }
];

window.statusReplies = {
  todo: {
    low: [
      "I haven't got a chance to look at this one yet. I have a couple of higher priority items ahead of it, but plan to start it later this week.",
      "Not started yet. I am finishing up some tasks in my current sprint, then I'll pick this up. Let me know if you need to expedite it!"
    ],
    medium: [
      "I'm planning to kick this one off tomorrow morning. I've reviewed the specs and everything looks clear.",
      "This is next on my list. Just wrapping up my current item, should start this in a few hours."
    ],
    high: [
      "I haven't started coding this yet, but since it is high priority, I'm shifting my focus to it right now. I'll give you a solid progress update by the end of today.",
      "Just saw this priority flag. I'm stopping my current task to dive into this now. I will let you know once I finish setting up the environment."
    ]
  },
  in_progress: {
    low: [
      "Currently working on it. Making steady progress, it should be ready for QA by tomorrow.",
      "Making some minor edits on this. No issues so far, wrapping it up slowly alongside my main tasks."
    ],
    medium: [
      "Active on this right now! The core code is written; I am just adding unit tests and cleaning up the code. I expect to open a PR by late this afternoon.",
      "I am about 60% done. Currently working through the middle layers. I should be able to demo this by tomorrow morning."
    ],
    high: [
      "Working on this full-time. The main implementation is coming along nicely. I'm aiming to complete it by tonight so QA can take a look first thing tomorrow.",
      "Highly focused on this. I've finished the core integration and am currently debugging a small issue with session storage. I will push updates within 2 hours."
    ]
  },
  blocked: {
    low: [
      "I'm blocked on this because the design spec seems to have changed. I left a comment on Figma, but haven't received a reply yet.",
      "I ran into some installation issues on local environment. Since it's low priority, I haven't spent too much time debugging. I'll get back to it soon."
    ],
    medium: [
      "I'm blocked by a lack of access to the staging database credentials. I've requested DevOps for permission, but they are currently offline. Hoping to resume tomorrow.",
      "I have hit a roadblock with the third-party API limits. I've emailed their support team. In the meantime, I'm working on another ticket."
    ],
    high: [
      "CRITICAL BLOCKER: The auth server keeps returning 500 errors. I need help from Backend or DevOps to inspect the token endpoint logs. Can we jump on a call?",
      "Blocked! The API payload structure doesn't match the documentation we received. I've raised an issue in our repository. We need to clarify this ASAP to meet the deadline."
    ]
  },
  done: {
    low: [
      "This is actually fully completed and merged. Let me know if there's anything else!",
      "Finished this yesterday. PR has been approved and deployed to production."
    ],
    medium: [
      "Completed! I've ran all tests and merged the changes. You can review it on the staging environment.",
      "All done. The documentation has also been updated accordingly."
    ],
    high: [
      "Yes, this is completed and fully tested! I worked overtime to push this to main. The deployment is live and working.",
      "Completed and verified in production! I've monitored the logs and error rates look clean. Ready for final review."
    ]
  }
};
