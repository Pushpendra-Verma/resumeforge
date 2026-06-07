import { makeBullet, makeEntry, type Resume, SCHEMA_VERSION } from "./schema";

/**
 * Seed content extracted from the uploaded resume (Pushpendra Verma).
 * This is the DEFAULT document so the app opens with a real resume already
 * laid out in the locked premium template — ready to edit or replace via upload.
 *
 * Built as a function so every load gets fresh, independent IDs.
 */
export function getSampleResume(): Resume {
  return {
    version: SCHEMA_VERSION,
    personalInfo: {
      name: "PUSHPENDRA VERMA",
      headline: "M.B.A. 2027",
      email: "pushpendra.verma25-01@iimv.ac.in",
      phone: "",
      linkedin: "linkedin.com/in/pushpendra-verma",
      website: "",
      location: "",
      logoText: "Indian Institute of Management Visakhapatnam",
      logoSrc: "/iimv_logo.png",
    },
    sections: [
      {
        id: "s_education",
        title: "EDUCATIONAL QUALIFICATIONS",
        layout: "table",
        entries: [
          makeEntry({
            title: "M.B.A.",
            organization: "Indian Institute of Management, Visakhapatnam",
            dateRange: "2027",
            location: "Pursuing",
          }),
          makeEntry({
            title: "B.Tech. (Full Time)",
            organization:
              "Sardar Vallabhbhai National Institute of Technology, (NIT) Surat",
            dateRange: "2017 - 2021",
            location: "7.95 / 10",
          }),
          makeEntry({
            title: "CBSE - 12th",
            organization: "St. Don Bosco Senior Secondary School",
            dateRange: "2016",
            location: "79.4%",
          }),
          makeEntry({
            title: "CBSE - 10th",
            organization: "St. Don Bosco Senior Secondary School",
            dateRange: "2014",
            location: "8.4 / 10",
          }),
        ],
      },
      {
        id: "s_experience",
        title: "PROFESSIONAL EXPERIENCE",
        layout: "timeline",
        entries: [
          makeEntry({
            title: "Assistant Manager",
            organization: "Jindal Steel and Power Ltd.",
            dateRange: "Jul 2022 - Jan 2025",
            bullets: [
              "Conducted cost and risk analysis for ₹2700+ Cr, CRM Complex, securing insurance & strengthening risk management for project",
              "Improved capital budgeting & cost control by 12% via budget forecasting and variance analysis for pickling plant operations",
              "Prepared LIE Reports for ₹2700+ Cr CRM Complex, improving lender visibility, enabling timely disbursements & financial reporting",
              "Coordinated with 50+ global and domestic suppliers, ensuring 98% on-time supply, reducing working capital blockage risks",
              "Improved OTIF by 25% through MIS integrating sales & production data, strengthening demand-supply financial alignment",
              "Achieved ₹80 Lakhs cost savings via belt conveyor design changes, improving asset utilization and reuse efficiency by 20%",
              "Led execution of ₹64+ Cr greenfield project - 0.6 MTPA Pickling Line, delivering in 6 months, 20% faster than industry average",
              "Managed 7000+ tons logistics worth ₹2000+ Cr, ensuring >98% OTIF via supply chain transformation & stakeholder alignment",
              "Managed ₹180+ Cr project schedules via SaaS-based platform, Realization, reducing delays by 18% & improving quality",
              "Developed an MIS system for production planning, enabling data-driven decisions and boosting reporting quality by 20%",
              "Implemented QR-based steel coil tracking system, improving material traceability & enhancing operational efficiency by 30%",
              "Managed 1,400+ ton equipment setup with 100% safety compliance, leading operations, risk mitigation & stakeholder alignment",
            ].map(makeBullet),
          }),
          makeEntry({
            title: "Graduate Engineer Trainee",
            organization: "DCM Shriram Ltd.",
            dateRange: "Jul 2021 - Jul 2022",
            bullets: [
              "Optimized plant operations through ₹9 Cr Capex in strategic sourcing & commissioning, boosting production output by 12%",
              "Saved ₹1.2 Cr/year by leading a CFT on the feasibility study of screw vs reciprocating compressors for optimal efficiency",
              "Increased procurement efficiency by 18% and cut ₹50L/year inventory costs through ABC classification & auto-indenting",
              "Enhanced MIS reporting on ₹70 Cr+ projects, providing leadership with actionable insights for financial decision-making",
              "OHS Lead, improved risk identification & reporting by 30% via safety coordination across 5 departments and 6,000+ manpower",
              "Trained shop floor operators on OHS protocols, improving quality compliance and reducing safety-related incidents by 20%",
              "Reduced accident risk by 50% by eliminating safety concerns through the standardization of welding machine carrying trolleys",
              "Conducted HAZOP study and trained operators & workers, enhancing hazard awareness and reducing process safety incidents",
            ].map(makeBullet),
          }),
        ],
      },
      {
        id: "s_internships",
        title: "INTERNSHIPS",
        layout: "timeline",
        entries: [
          makeEntry({
            title: "Mechanical Maintenance",
            organization: "Oil & Natural Gas Corporation (ONGC)",
            dateRange: "Dec 2019 - Jan 2020",
            bullets: [
              'Led a project on "Mechanical seals and their applications in ONGC", optimizing mechanical seals in the oil & gas industry',
            ].map(makeBullet),
          }),
          makeEntry({
            title: "Research & Development",
            organization: "IIT Indore",
            dateRange: "May 2019 - Jul 2019",
            bullets: [
              'Executed research on "Numerical Study of Bottom Jet Impingement," integrating experimental trials with simulation',
              "Planned and coordinated lab experiments, resource allocation, and safety to ensure smooth project execution",
            ].map(makeBullet),
          }),
        ],
      },
      {
        id: "s_por",
        title: "POSITIONS OF RESPONSIBILITY",
        layout: "list",
        entries: [
          makeEntry({
            bullets: [
              "Head – Design, SAE (Society of Automotive Engineers), leading a 24-member student team at SVNIT, Surat",
              'Event Head for Robo-war at "Sparsh – SVNIT Surat", led end-to-end management for 20+ participating teams across India',
              "Mentored 4 Robo-war teams, guiding design and strategy, nurturing talent and teamwork, and enhancing event competitiveness",
              "Led chassis design as Design Head for Formula Bharat 2020, a National-level FSAE event, ensuring performance & reliability",
            ].map(makeBullet),
          }),
        ],
      },
      {
        id: "s_achievements",
        title: "ACHIEVEMENTS",
        layout: "list",
        entries: [
          makeEntry({
            bullets: [
              "Employee of the Month – April 2024, among 6000+ employees at Jindal Steel & Power Ltd, for exceptional leadership skills",
              '"Pat on the Back" Award, DCM Shriram Ltd, recognized for outstanding contribution to process improvement & team collaboration',
            ].map(makeBullet),
          }),
        ],
      },
      {
        id: "s_certifications",
        title: "CERTIFICATIONS",
        layout: "list",
        entries: [
          makeEntry({
            bullets: [
              "Lean Six Sigma Green Belt Certification - by Grant Thornton - Jun 2025",
              "NISM Series XV – Research Analyst Certification, by National Institute of Securities Markets (SEBI) – Aug 2025",
              "Certified in SQL for Finance Professionals - by NASBA (National Association of State Boards of Accountancy)",
              "Certified in Financial Modeling and Forecasting Financial Statements - by National Association of State Boards of Accountancy",
            ].map(makeBullet),
          }),
        ],
      },
      {
        id: "s_extracurricular",
        title: "EXTRA-CURRICULAR ACTIVITIES",
        layout: "list",
        entries: [
          makeEntry({
            bullets: [
              "Represented NIT Surat at Formula Bharat 2020, contributing to the design and engineering of a high-performance formula car",
              "Coordinated crowd management & community services for 5,000+ people at JSP Rath Yatra, fostering community engagement",
              "Designed and launched mba-roi-calculator.vercel.app, a finance website computing ROI and payback on MBA investments",
              "Competed in a Chess tournament, Major Dhyan Chand Trophy - IIM Visakhapatnam",
            ].map(makeBullet),
          }),
        ],
      },
    ],
  };
}
