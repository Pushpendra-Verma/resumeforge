import { makeBullet, makeEntry, type Resume, SCHEMA_VERSION } from "@/lib/schema";
import { uid } from "@/lib/id";

/**
 * Prefilled example content for "IIM Style Professional Resume 2".
 * Mirrors the reference (Jagat Jain) resume, including the Paytm role's
 * labeled sub-groups rendered via the `grouped` layout. Each role is its own
 * section with a `dateRange` shown on the gray bar — exactly like the reference.
 *
 * Built as a function so every call gets fresh, independent ids.
 */
export function getIim2Sample(): Resume {
  return {
    version: SCHEMA_VERSION,
    personalInfo: {
      name: "Jagat Jain",
      headline: "",
      email: "p13jagatjain@iima.ac.in",
      phone: "+91 8447742941",
      linkedin: "",
      website: "",
      location: "72, JLN Marg, Jaipur-302004, Rajasthan, India",
      logoText: "Indian Institute of Management, Ahmedabad",
      logoSrc: "",
    },
    sections: [
      {
        id: uid("s"),
        title: "Global Business Development at Larsen & Toubro Infotech (LTI), Mumbai",
        layout: "list",
        dateRange: "March, 2018 – Current",
        entries: [
          makeEntry({
            bullets: [
              "As part of the organization's flagship Global Sales Leadership Program, underwent a structured training program understanding the nuances of the sales in technology industry",
              "Responsible for pre-sales and sales farming and hunting efforts for BFS sector in North America geography",
            ].map(makeBullet),
          }),
        ],
      },
      {
        id: uid("s"),
        title: "Business Development at Paytm, Noida",
        layout: "grouped",
        dateRange: "May, 2015 – March, 2018",
        entries: [
          makeEntry({
            title: "Alliances",
            bullets: [
              "Expanding user base and transacting users via strategic alliances with corporates in FMCG, consumer durables, entertainment and media (print, radio and TV), movie integrations",
              "Operationalized 21 cobranded campaigns leading to acquisition of 0.5 million new users",
            ].map(makeBullet),
          }),
          makeEntry({
            title: "Government business",
            bullets: [
              "Hunting for new business opportunities in government to citizen and citizen to government payment transaction space",
              "Successfully operationalized Paytm payments platform for Central Government's Direct benefits transfer scheme (PFMS), AP Road transport corporation, stamp duty vendors of SHCIL, campuses of certain state universities, traffic challan payment in Chandigarh city",
            ].map(makeBullet),
          }),
          makeEntry({
            title: "Vendor management",
            bullets: [
              "Strategized, planned and executed Paytm Mall's seller base activation project resulting in the activation of more than 3,000 sellers",
              "Owner for the conceptualization and developmental execution related to product, content and marketing of Paytmgobig.com (Paytm Mall seller centric platform) which currently is one of the key Paytm Mall property with over 7,000 daily unique visits",
              "Planning & operational execution of District Outreach program during demonetization period where 1,000 villages were made cashless across the country by conducting vendors and organizing awareness camps in coordination with local district administration",
            ].map(makeBullet),
          }),
          makeEntry({
            title: "Category management",
            bullets: [
              "As category manager for Paytm Mall seller services category, developed the cataloguing sub-category to 40 orders per day (GMV of INR 40,000 per day), compliance registration services sub category to 60 orders per day (GMV of INR 5,00,000 per day)",
              "Launched the B2B sales category on Paytm Mall, expanded the category to a daily GMV of over 0.5 million INR",
            ].map(makeBullet),
          }),
        ],
      },
      {
        id: uid("s"),
        title: "Intern – Sony Entertainment Television (Multi Screen Media, Mumbai)",
        layout: "list",
        dateRange: "May 2014 – July 2014",
        entries: [
          makeEntry({
            bullets: [
              "Worked on production Cost Comparison of Regional TV shows with respect to Hindi National soaps",
              "Successfully derived innovative ways thereby reducing production cost of National Hindi soaps by 20 %",
            ].map(makeBullet),
          }),
        ],
      },
      {
        id: uid("s"),
        title: "Founder – JanmPatrika.com (Marketplace for vedic astrology)",
        layout: "list",
        dateRange: "September 2011 – February 2013",
        entries: [
          makeEntry({
            bullets: [
              "Conceptualized and developed the web based product to enable real time telephonic connection of customers to the astrologers listed on the platform",
              "Broke even in 1st month of operations and remained cash flow positive operationally",
              "Built a 10 membered team with a stable state order count of 100 / month and on boarded astrologer count of 50",
            ].map(makeBullet),
          }),
        ],
      },
      {
        id: uid("s"),
        title: "Educational Background",
        layout: "table",
        entries: [
          makeEntry({
            title: "B.Tech",
            organization: "National Institute of Technology, Jaipur",
            location: "Mechanical Engineering",
            dateRange: "2011",
          }),
          makeEntry({
            title: "PGPM",
            organization: "Indian Institute of Management, Ahmedabad",
            location:
              "2.86 / 4.33 (overall CGPA), 99.05th percentile (VA+LR, CAT 2012), Batch rank 7th in Marketing II course",
            dateRange: "2015",
          }),
          makeEntry({
            title: "Class XII",
            organization: "SMS School, Jaipur, CBSE",
            location:
              "90% (Subjects – Physics, Chemistry, Mathematics, Information Practices)",
            dateRange: "2007",
          }),
          makeEntry({
            title: "Class X",
            organization: "SMS School, Jaipur, CBSE",
            location: "85% aggregate score, 100% score in Mathematics",
            dateRange: "2005",
          }),
        ],
      },
      {
        id: uid("s"),
        title: "Extra-Curricular Activities",
        layout: "list",
        entries: [
          makeEntry({
            bullets: [
              "1st Runners-up among 150 teams in World Gold Council's National Level Strategy Case Challenge '14",
              "1st Runners-up among 24 participating teams in RPG Blizzard-2014 campus round",
              "National Finalist in the Cognizant Imperatoria 14' case competition, among 609 teams across top 20 B-schools",
              "1st Position in competitive event of Solstice at Neuron-09 (National Level Technical Festival) at MNIT Jaipur",
            ].map(makeBullet),
          }),
        ],
      },
    ],
  };
}
