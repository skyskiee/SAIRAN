// SAIRAN navigation. Role-aware menu builder.
// `role` is optional — pass the logged-in user's role to show admin links.

export type SubChildren = {
  href: string;
  label: string;
  active: boolean;
  children?: SubChildren[];
};
export type Submenu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus?: Submenu[];
  children?: SubChildren[];
};

export type Menu = {
  href: string;
  label: string;
  active: boolean;
  icon: any;
  submenus: Submenu[];
  id: string;
};

export type Group = {
  groupLabel: string;
  menus: Menu[];
  id: string;
};

type Role = "ORG_USER" | "ORG_ADMIN" | "SYSTEM_ADMIN" | undefined;

export function getMenuList(pathname: string, t?: any, role?: Role): Group[] {
  const groups: Group[] = [
    {
      groupLabel: "Main",
      id: "main",
      menus: [
        {
          id: "dashboard",
          href: "/sairan/dashboard",
          label: "Dashboard",
          active: pathname.includes("/sairan/dashboard"),
          icon: "heroicons-outline:home",
          submenus: [],
        },
        {
          id: "assessments",
          href: "/sairan/assessments",
          label: "My Assessments",
          active: pathname.includes("/sairan/assessments"),
          icon: "heroicons-outline:clipboard-list",
          submenus: [],
        },
        {
          id: "recommendations",
          href: "/sairan/recommendations",
          label: "Recommendations",
          active: pathname.includes("/sairan/recommendations"),
          icon: "heroicons-outline:light-bulb",
          submenus: [],
        },
        {
          id: "reports",
          href: "/sairan/reports",
          label: "Reports",
          active: pathname.includes("/sairan/reports"),
          icon: "heroicons-outline:document-text",
          submenus: [],
        },
      ],
    },
  ];

  if (role === "ORG_ADMIN" || role === "SYSTEM_ADMIN") {
    groups.push({
      groupLabel: "Administration",
      id: "admin",
      menus: [
        {
          id: "users",
          href: "/sairan/admin/users",
          label: "User Management",
          active: pathname.includes("/sairan/admin/users"),
          icon: "heroicons-outline:users",
          submenus: [],
        },
        ...(role === "ORG_ADMIN"
          ? [{
              id: "org-settings",
              href: "/sairan/admin/organization",
              label: "Organization Settings",
              active: pathname.includes("/sairan/admin/organization"),
              icon: "heroicons-outline:office-building",
              submenus: [],
            }]
          : []),
      ],
    });
  }

  if (role === "SYSTEM_ADMIN") {
    groups.push({
      groupLabel: "System Admin",
      id: "system",
      menus: [
        {
          id: "organizations",
          href: "/sairan/admin/organizations",
          label: "Organizations",
          active: pathname.includes("/sairan/admin/organizations"),
          icon: "heroicons-outline:office-building",
          submenus: [],
        },
        {
          id: "questions",
          href: "/sairan/admin/questions",
          label: "Question Bank",
          active: pathname.includes("/sairan/admin/questions"),
          icon: "heroicons-outline:question-mark-circle",
          submenus: [],
        },
        {
          id: "scoring",
          href: "/sairan/admin/scoring",
          label: "Scoring Configuration",
          active: pathname.includes("/sairan/admin/scoring"),
          icon: "heroicons-outline:adjustments",
          submenus: [],
        },
      ],
    });
  }

  return groups;
}

// Keep for template compatibility — horizontal header menu just mirrors sidebar
export function getHorizontalMenuList(pathname: string, t?: any, role?: Role): Group[] {
  return getMenuList(pathname, t, role);
}
