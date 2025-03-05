import {
  HomeIcon,
  UserIcon,
  ClipboardDocumentListIcon,
  ChartBarIcon,
  Cog6ToothIcon,
  UsersIcon
} from '@heroicons/react/24/outline'

const routes = [
  {
    label: 'Dashboard',
    icon: HomeIcon,
    href: '/dashboard',
    color: 'text-sky-500',
  },
  {
    label: 'Profile',
    icon: UserIcon,
    href: '/profile',
    color: 'text-violet-500',
  },
  {
    label: 'Workouts',
    icon: ClipboardDocumentListIcon,
    color: 'text-pink-700',
    href: '/workouts',
  },
  {
    label: 'Progress',
    icon: ChartBarIcon,
    color: 'text-orange-700',
    href: '/progress',
  },
  {
    label: 'Social',
    icon: UsersIcon,
    color: 'text-green-700',
    href: '/social',
  },
  {
    label: 'Settings',
    icon: Cog6ToothIcon,
    href: '/settings',
  },
] 