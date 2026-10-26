import type { Project } from "@/types/project";

export const projects: Project[] = [
  {
    slug: "sidsneaks",
    number: "01",
    name: "SIDSNEAKS",
    category: "Dashboard Design System",
    year: "2026",
    description:
      "A sneaker e-commerce admin dashboard designed to bring consistency to operational interfaces through a reusable component system.",
    about:
      "SIDSNEAKS is a sneaker e-commerce project focused on its admin dashboard. The goal was to establish a consistent interface that supports day-to-day operations while making future design updates easier to manage.",
    challenge:
      "The existing UI Kit needed to be adapted into a more consistent system. Without reusable components and shared design rules, maintaining visual consistency across dashboard interfaces could become difficult as the product grew.",
    solution:
      "Adapted the existing UI Kit into a structured design system, establishing shared color tokens and reusable components. Built a library of 30+ components to create consistent UI patterns across the dashboard.",
    result:
      "Established a reusable component foundation for the dashboard, making interface patterns more consistent and providing a clearer reference for future design work and implementation.",
    role: "UI/UX Designer",
    tech: ["Figma", "Design Tokens", "Component Library", "Dashboard UI"],
    links: [
      { label: "Live", href: "#" },
      { label: "Case Study", href: "#" },
    ],
    theme: "bg-[#d7d9d5]",
    accent: "bg-[#252822]",
    images: [
      "/projects/sidsneaks-1.webp",
      "/projects/sidsneaks-2.webp",
      "/projects/sidsneaks-3.webp",
    ],
  },
  {
    slug: "common-ground-fight",
    number: "02",
    name: "Common Ground Fight",
    category: "Combat Sports Platform",
    year: "2026",
    description:
      "An event management platform for combat sports, covering the workflows behind event operations, ticketing, and administration.",
    about:
      "Common Ground Fight is a combat sports event management platform developed through Kala Loop. The project focuses on connecting event operations and administrative workflows in one platform, with interfaces for both mobile and desktop.",
    challenge:
      "One key challenge was designing the ticket-scanning flow to meet the client's operational requirements without adding unnecessary complexity for developers. The platform also required clear, consistent interactions across more than 10 features and workflows.",
    solution:
      "Designed 50+ screens across mobile and desktop for user-facing and administrative interfaces. Broke down the ticket-scanning flow by evaluating user needs, client requirements, and technical feasibility before refining the interaction.",
    result:
      "Delivered a broader set of interfaces for the platform and refined the ticket-scanning flow to balance operational needs with implementation feasibility, without adding unnecessary complexity to the development process.",
    role: "UI/UX Designer",
    tech: ["Figma", "Brand Identity", "Web Design", "Prototyping"],
    links: [
      { label: "Live", href: "#" },
      { label: "Case Study", href: "#" },
    ],
    theme: "bg-[#242522]",
    accent: "bg-[#d8ff62]",
    images: [
      "/projects/CGF-1.webp",
      "/projects/CGF-2.webp",
      "/projects/CGF-3.webp",
    ],
  },
  {
    slug: "levi-camp",
    number: "03",
    name: "Levi Camp",
    category: "Reservation Platform",
    year: "2025",
    description:
      "A camping reservation platform designed to make exploring accommodation options and completing a booking feel straightforward.",
    about:
      "Levi Camp is a reservation platform project developed with Heulaulabs. The focus was on designing a clear booking experience for users looking to explore and reserve a place to stay in a nature-oriented setting.",
    challenge:
      "The reservation experience needed to present essential accommodation details while keeping the booking process easy to follow. Each step had to provide enough information for users to make decisions without making the overall flow feel complicated.",
    solution:
      "Designed 20+ screens across four key user flows, organizing accommodation information and booking interactions into a clear interface. Focused on information hierarchy, consistent UI patterns, and a straightforward reservation journey.",
    result:
      "Delivered a set of interfaces covering the core reservation experience, with four defined user flows and a consistent foundation for the platform's booking journey.",
    role: "UI/UX Designer",
    tech: ["Figma", "UX Research", "Web Design", "Booking Flow"],
    links: [
      { label: "Live", href: "#" },
      { label: "Case Study", href: "#" },
    ],
    theme: "bg-[#d9e0df]",
    accent: "bg-[#536d69]",
    images: [
      "/projects/LEVI-1.webp",
      "/projects/LEVI-2.webp",
      "/projects/LEVI-3.webp",
    ],
  },
];

export function getAllProjects(): Project[] {
  return projects;
}

export function getProjectBySlug(slug: string): Project | undefined {
  return projects.find((project) => project.slug === slug);
}