import {
  Bot,
  LayoutDashboard,
  PlaneTakeoff,
  Settings2,
} from "lucide-react"

export const menuItem = {
  user: {
    name: "shadcn",
    email: "m@example.com",
    avatar: "/avatars/shadcn.jpg",
  },
  navMain: [
    {
      title: "Dashboard",
      url: "/dashboard",
      icon: LayoutDashboard,
    },
    {
      title: "Models",
      url: "#",
      icon: Bot,
      items: [
        {
          title: "Genesis",
          url: "#",
        },
        {
          title: "Explorer",
          url: "#",
        },
        {
          title: "Quantum",
          url: "#",
        },
      ],
    },
    {
      title: "Perjalanan Dinas",
      url: "#",
      icon: PlaneTakeoff,
      items: [
        {
          title: "Nota Dinas",
          url: "/dashboard/perdin/nodin",
        },
        {
          title: "Surat Tugas",
          url: "#",
        },
        {
          title: "SPD",
          url: "#",
        },
        {
          title: "History",
          url: "#",
        },
      ],
    },
    {
      title: "Settings",
      url: "#",
      icon: Settings2,
      items: [
        {
          title: "User",
          url: "/dashboard/settings/user",
        },
        {
          title: "Pegawai",
          url: "/dashboard/settings/pegawai",
        },
      ],
    },
  ],
}
