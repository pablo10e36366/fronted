const browserHost =
  typeof window !== 'undefined' && window.location?.hostname
    ? window.location.hostname
    : 'localhost';

export const environment = {
  production: false,
  apiUrl: `http://${browserHost}:3000/api`,
};
