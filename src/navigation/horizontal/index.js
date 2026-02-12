export default [
  {
    title: 'Home',
    to: { name: 'home' },
    icon: { icon: 'tabler-smart-home' },
  },
  {
    title: 'Roles & Permissions',
    icon: { icon: 'tabler-settings' },
    children: [
      { title: 'Roles', to: 'roles' },

      // { title: 'Permissions', to: 'roles' },
    ],
  },
]
