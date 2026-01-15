export const API_ROUTES = {
  auth: {
    login: '/auth/login',
    register: '/auth/register',
  },
  projects: {
    base: '/projects',
    download: (id: number) => `/projects/${id}/download`,
  },
} as const;
