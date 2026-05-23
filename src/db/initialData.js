// Realistic seed data for Citizen Journalism Verification & Story Publishing Platform

export const PERSONAS = {
  reporter: {
    id: "user_reporter_01",
    name: "Jane Doe",
    username: "jane_reporter",
    role: "reporter",
    avatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    location: "Metro East",
    reputation: 88,
    bio: "Hyperlocal citizen journalist passionate about safety, transport, and municipal integrity."
  },
  verifier: {
    id: "user_verifier_01",
    name: "David Smith",
    username: "david_verifier",
    role: "verifier",
    avatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    location: "Central District",
    reputation: 99,
    bio: "Senior fact-checker and editor with 10+ years in community investigative reporting."
  },
  admin: {
    id: "user_admin_01",
    name: "Elena Rostova",
    username: "elena_admin",
    role: "admin",
    avatar: "https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=150",
    location: "HQ Secretariat",
    reputation: 100,
    bio: "System Administrator and Director of Media Compliance."
  },
  reader: {
    id: "user_reader_01",
    name: "Sarah Connor",
    username: "sarah_reads",
    role: "reader",
    avatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
    location: "South Suburbs",
    reputation: 15,
    bio: "Active community reader. Always cross-checking sources and advocating for facts."
  }
};

export const CATEGORIES = [
  { id: "infrastructure", name: "Infrastructure & Roads", icon: "🚧", color: "#3182ce" },
  { id: "safety", name: "Public Safety", icon: "🚨", color: "#e53e3e" },
  { id: "environment", name: "Environment & Ecology", icon: "🌱", color: "#38a169" },
  { id: "healthcare", name: "Healthcare & Sanitation", icon: "🏥", color: "#319795" },
  { id: "events", name: "Community & Events", icon: "🎉", color: "#d69e2e" }
];

export const INITIAL_STORIES = [
  {
    id: "story_01",
    title: "Structural Cracks Widening on Main Street Flyover",
    description: "During my daily commute across the Main Street Flyover (directly above the Metro Rail Line), I observed that structural cracks on Pier 42 have widened significantly over the last month. The expansion joints appear stressed, and small concrete chunks have fallen onto the service lane below. I've included visual close-ups and wide angles to verify the scale. Heavy municipal vehicle traffic continues unrestricted.",
    category: "infrastructure",
    location: "Metro East, Pier 42 Crossing",
    media: [
      {
        url: "https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=800",
        caption: "Close-up of widening structural fissure on concrete pillar 42"
      },
      {
        url: "https://images.unsplash.com/photo-1590069261209-f8e9b8642343?w=800",
        caption: "Wide view showing heavy freight trucks passing over the affected span"
      }
    ],
    reporterId: "user_reporter_01",
    reporterName: "Jane Doe",
    reporterAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    date: "2026-05-20T14:30:00Z",
    status: "approved",
    upvotes: 142,
    upvotedBy: ["user_reader_01"],
    comments: [
      {
        id: "c_1",
        userId: "user_reader_01",
        userName: "Sarah Connor",
        userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
        content: "This is terrifying! I drive past Pier 42 every single morning. Thank you for reporting this, hope the city acts immediately.",
        date: "2026-05-20T15:10:00Z"
      },
      {
        id: "c_2",
        userId: "user_verifier_01",
        userName: "David Smith (Verifier)",
        userAvatar: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
        content: "We have cross-referenced this with municipal repair schedules. No structural maintenance was listed. This report is highly accurate and critical.",
        date: "2026-05-20T16:45:00Z"
      }
    ],
    flags: [],
    sourceReferences: ["Municipal Infrastructure Blueprint (Section 4A)", "Local Resident Committee Forum Bulletin (May 2026)"],
    reviewerComments: "Verified via photographic evidence matching geolocations. High public priority.",
    verifiedAt: "2026-05-20T16:40:00Z",
    verifiedBy: "David Smith"
  },
  {
    id: "story_02",
    title: "Unmarked Construction Trench on Ring Road Causes Multiple Near-Misses",
    description: "An open, completely unmarked utility trench has been excavated across the shoulder of Outer Ring Road (near the North Gate Highway merge). There are no safety barriers, glowing reflectors, or warning signs. Last night, two motorcyclists barely swerved in time, and one bicycle rider suffered minor injuries. This is a severe threat to public safety, especially under poor street lighting.",
    category: "safety",
    location: "North Suburbs, Ring Road Merge",
    media: [
      {
        url: "https://images.unsplash.com/photo-1517649763962-0c623066013b?w=800",
        caption: "Deep uncovered trench running parallel to high-speed lane"
      }
    ],
    reporterId: "user_reporter_01",
    reporterName: "Jane Doe",
    reporterAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    date: "2026-05-21T09:15:00Z",
    status: "approved",
    upvotes: 94,
    upvotedBy: [],
    comments: [
      {
        id: "c_3",
        userId: "user_reader_01",
        userName: "Sarah Connor",
        userAvatar: "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=150",
        content: "Passed by this an hour ago, someone has thrown a plastic bucket inside it to make it visible. Still highly unsafe!",
        date: "2026-05-21T10:00:00Z"
      }
    ],
    flags: [],
    sourceReferences: ["Visual inspection", "Local Ward 8 WhatsApp Emergency Group Logs"],
    reviewerComments: "Confirmed by community reports. Contacted Municipal Safety Division.",
    verifiedAt: "2026-05-21T11:00:00Z",
    verifiedBy: "David Smith"
  },
  {
    id: "story_03",
    title: "Foaming Green Chemical Discharge in Greenbelt Nature Preserve",
    description: "During a nature hike at the Greenbelt Reserve, I discovered a thick, foaming green liquid spilling from a culvert directly into the freshwater creek. The discharge smells strongly of sulfur and industrial solvents. Dead frogs and insects are visible near the runoff zone. The culvert runs under the neighboring Industrial Phase-II cluster, suggesting illegal waste dumping by a manufacturing unit.",
    category: "environment",
    location: "South Suburbs, Greenbelt reserve sector 3",
    media: [
      {
        url: "https://images.unsplash.com/photo-1508962914676-134849a727f0?w=800",
        caption: "Toxic runoff forming chemical scum over natural creek waters"
      }
    ],
    reporterId: "user_reporter_02",
    reporterName: "Marcus Vance",
    reporterAvatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
    date: "2026-05-22T00:10:00Z",
    status: "pending",
    upvotes: 45,
    upvotedBy: [],
    comments: [],
    flags: [],
    sourceReferences: ["Water odor and acidity tests (litmus turned heavily acidic)", "Coordinates matching Reserve Culvert #12B"],
    reviewerComments: "",
    verifiedAt: null,
    verifiedBy: null
  },
  {
    id: "story_04",
    title: "Hyperlocal Health Clinic Vaccine Shortage Forces Seniors Away",
    description: "The municipal health clinic in Ward 4 had announced a major booster dose camp for senior citizens this week. However, upon arriving with my grandmother, clinic staff informed us that they had run out of vaccines by 10 AM. Over 80 senior citizens, many of whom traveled long distances, were sent home. The clinic's online booking dashboard still lists 200+ open slots, causing mass confusion and distress.",
    category: "healthcare",
    location: "Central District, Ward 4 Clinic",
    media: [
      {
        url: "https://images.unsplash.com/photo-1584515979956-d9f6e5d09982?w=800",
        caption: "Distressed crowd waiting in queue outside locked vaccination gate"
      }
    ],
    reporterId: "user_reporter_01",
    reporterName: "Jane Doe",
    reporterAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    date: "2026-05-21T08:00:00Z",
    status: "needs_edits",
    upvotes: 18,
    upvotedBy: [],
    comments: [],
    flags: [],
    sourceReferences: ["Clinic Official Notice Board photo", "Digital booking confirmation email PDF"],
    reviewerComments: "Jane, please upload a clear photograph of the locked notice board indicating 'no stock' to substantiate the booking slots discrepancy, and confirm if there was any later shipment received.",
    verifiedAt: null,
    verifiedBy: null
  },
  {
    id: "story_05",
    title: "Grassroots Farmer's Market Breaks All-Time Attendance Record",
    description: "The community-led organic farmer's market held at Central Green has broken all previous attendance records, drawing over 3,000 visitors this Sunday. The market was established to help local farmers bypass middlemen, and featured 62 unique stalls selling organic greens, handmade cheeses, and sustainable home items. Organized entirely by citizen volunteers, it represents a massive success for local green commerce.",
    category: "events",
    location: "Central District, Central Green Plaza",
    media: [
      {
        url: "/grassroots_coop.png",
        caption: "Grass Roots Farmers Co-op - Community Organic Marketplace"
      }
    ],
    reporterId: "user_reporter_03",
    reporterName: "Amina Al-Mansoor",
    reporterAvatar: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    date: "2026-05-18T18:00:00Z",
    status: "approved",
    upvotes: 215,
    upvotedBy: ["user_reader_01", "user_reporter_01"],
    comments: [
      {
        id: "c_4",
        userId: "user_reporter_01",
        userName: "Jane Doe",
        userAvatar: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
        content: "I bought the sourdough bread and fresh honey there! Highly recommend this to everyone. Wonderful event.",
        date: "2026-05-18T20:10:00Z"
      }
    ],
    flags: [],
    sourceReferences: ["Market Committee Entry Log Book", "Volunteer Registration Database"],
    reviewerComments: "Confirmed by regional event organizers. Positive grassroots story.",
    verifiedAt: "2026-05-19T09:30:00Z",
    verifiedBy: "David Smith"
  },
  {
    id: "story_06",
    title: "Local Public Fountain Water Randomly Swapped with High-Sugar Soda",
    description: "A hilarious prank took place at the municipal park fountain last night! Some local pranksters managed to disconnect the water supply and pump thousands of liters of sweet, carbonated cherry soda into the public fountain instead! Hundreds of kids are running around drinking directly from the fountain and splashing in sweet sticky soda!",
    category: "events",
    location: "Metro East, Central Fountain Park",
    media: [
      {
        url: "https://images.unsplash.com/photo-1595151838531-b1d34114226e?w=800",
        caption: "Fountain with pinkish-looking liquid bubbling out"
      }
    ],
    reporterId: "user_reporter_04",
    reporterName: "PranksterPete",
    reporterAvatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150",
    date: "2026-05-21T16:00:00Z",
    status: "rejected",
    upvotes: 2,
    upvotedBy: [],
    comments: [],
    flags: [
      {
        id: "f_1",
        userId: "user_reader_01",
        userName: "Sarah Connor",
        reason: "Dangerous misinformation. The fountain water was actually treated with a non-toxic pink tracer dye by the water utility department for leak inspection. Pranksters did not pump soda, and it is highly unsafe for kids to drink chemical-treated water.",
        date: "2026-05-21T18:00:00Z"
      }
    ],
    sourceReferences: ["Personal eyewitness TikTok video link"],
    reviewerComments: "Rejected after cross-verification with the Water & Sewage Board. The pink liquid is standard leak-tracer dye, NOT soda. Spreading claims encouraging children to drink the liquid poses a severe health hazard. Story rejected as fake news.",
    verifiedAt: null,
    verifiedBy: "David Smith"
  }
];

export const MAP_PINS = [
  { id: "story_01", title: "Main Street Flyover Structural Cracks", lat: 35, lng: 70, category: "infrastructure" },
  { id: "story_02", title: "Unmarked Construction Trench", lat: 15, lng: 25, category: "safety" },
  { id: "story_03", title: "Chemical Discharge in Reserve", lat: 80, lng: 30, category: "environment" },
  { id: "story_04", title: "Vaccine Shortage at Clinic", lat: 50, lng: 55, category: "healthcare" },
  { id: "story_05", title: "Grassroots Farmer's Market Success", lat: 45, lng: 50, category: "events" }
];

export const LITERACY_QUIZ = [
  {
    id: "q_1",
    question: "A viral message on social media claims that municipal drinking water has been contaminated and calls on citizens to instantly buy a specific brand of water purifier. What should you do first?",
    options: [
      "Share the warning immediately to save your friends and family from food poisoning.",
      "Check the official website or social media channels of your local water supply board/PIB to see if an alert has been issued.",
      "Directly purchase the purifier brand before it sells out in stores."
    ],
    answer: 1,
    explanation: "Standard fact-checking guidelines dictate verification through authoritative bodies (like water boards or government fact-check desks) before taking action or magnifying sensational retail promotions disguised as emergencies."
  },
  {
    id: "q_2",
    question: "You see a video showing a bridge collapsing under the title 'Local Bridge Collapse Just Now!'. How do you verify if the video is current and local?",
    options: [
      "Trust it, since it contains video proof and has thousands of shares and likes.",
      "Take a screenshot of a unique frame and run a Reverse Image Search to see if the video has been uploaded in previous years or refers to a different location.",
      "Assume it's fake because the weather in the video looks slightly different."
    ],
    answer: 1,
    explanation: "Reverse Image Search is the most powerful tool to detect recycled or out-of-context media. Misinformation often repurposes old disaster videos to create panic or gain viral clicks."
  },
  {
    id: "q_3",
    question: "Which of the following describes an IFCN (International Fact-Checking Network) core principle?",
    options: [
      "Fact-checkers should support political parties that promote facts.",
      "A commitment to non-partisanship, transparency of sources, and a transparent corrections policy.",
      "Fact-checkers should remove all content that is not approved by government ministries."
    ],
    answer: 1,
    explanation: "IFCN standards emphasize non-partisanship, transparency of funding and sources, and a clear corrections policy. Independent, unbiased journalism must welcome auditability."
  },
  {
    id: "q_4",
    question: "A citizen reporter submits a story claiming a local school is closing permanently, citing 'a conversation with a neighbor who knows the teacher'. Does this meet verification standards?",
    options: [
      "Yes, eyewitnesses and hearsay are the primary pillars of rapid local news.",
      "No. It lacks concrete secondary confirmation (e.g., official school board circular, official comment, or named school spokesperson).",
      "Yes, as long as the reporter has a high reputation score."
    ],
    answer: 1,
    explanation: "Reliable news must be substantiated by official statements or verified written evidence. Hearsay or double-removed anecdotes do not meet professional journalistic verification criteria."
  }
];

export const initializeDatabase = () => {
  let stories = localStorage.getItem("citizen_news_stories");
  if (!stories || stories === "undefined") {
    localStorage.setItem("citizen_news_stories", JSON.stringify(INITIAL_STORIES));
  } else {
    // Migration: ensure Grassroots story uses the offline /grassroots_coop.png image
    try {
      const parsedStories = JSON.parse(stories);
      let updated = false;
      const newStories = parsedStories.map(story => {
        if (story.id === "story_05") {
          if (!story.media || story.media.length === 0 || story.media[0].url !== "/grassroots_coop.png") {
            story.media = [
              {
                url: "/grassroots_coop.png",
                caption: "Grass Roots Farmers Co-op - Community Organic Marketplace"
              }
            ];
            updated = true;
          }
        }
        return story;
      });
      if (updated) {
        localStorage.setItem("citizen_news_stories", JSON.stringify(newStories));
      }
    } catch (e) {
      console.error("Migration error:", e);
    }
  }
  const users = localStorage.getItem("citizen_news_users");
  if (!users || users === "undefined") {
    localStorage.setItem("citizen_news_users", JSON.stringify(PERSONAS));
  }
  const curUser = localStorage.getItem("citizen_news_current_user");
  if (!curUser || curUser === "undefined") {
    localStorage.setItem("citizen_news_current_user", JSON.stringify(PERSONAS.reader)); // default user is Reader
  }
};

const safeParse = (key, fallback) => {
  try {
    const val = localStorage.getItem(key);
    if (!val || val === "undefined") return fallback;
    return JSON.parse(val);
  } catch (e) {
    console.error(`Error parsing localStorage key "${key}":`, e);
    // Reset to fallback if corrupted
    try {
      localStorage.setItem(key, JSON.stringify(fallback));
    } catch (writeErr) {
      console.error(`Failed to repair key "${key}" in localStorage:`, writeErr);
    }
    return fallback;
  }
};

export const getStories = () => {
  initializeDatabase();
  return safeParse("citizen_news_stories", INITIAL_STORIES);
};

export const saveStories = (stories) => {
  localStorage.setItem("citizen_news_stories", JSON.stringify(stories));
  window.dispatchEvent(new Event("citizen_db_update"));
};

export const getCurrentUser = () => {
  initializeDatabase();
  const sessionUser = safeParse("citizen_news_current_user", null);
  if (!sessionUser) return null;
  const allUsers = safeParse("citizen_news_users", PERSONAS);
  if (allUsers) {
    const latest = Object.values(allUsers).find(u => u.id === sessionUser.id || u.username === sessionUser.username);
    if (latest) return latest;
  }
  return sessionUser;
};

export const setCurrentUser = (user) => {
  if (user === undefined) {
    localStorage.removeItem("citizen_news_current_user");
  } else {
    localStorage.setItem("citizen_news_current_user", JSON.stringify(user));
  }
  window.dispatchEvent(new Event("citizen_user_update"));
};

export const getUsers = () => {
  initializeDatabase();
  return safeParse("citizen_news_users", PERSONAS);
};

export const saveUsers = (users) => {
  localStorage.setItem("citizen_news_users", JSON.stringify(users));
  window.dispatchEvent(new Event("citizen_user_update"));
};
