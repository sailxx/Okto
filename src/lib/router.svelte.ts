export type Route = 'home' | 'tasks' | 'calendar' | 'focus';
const ROUTES: Route[] = ['home', 'tasks', 'calendar', 'focus'];

const parse = (): Route => {
  const r = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'home';
};

class Router {
  route = $state<Route>(parse());
  constructor() { window.addEventListener('hashchange', () => { this.route = parse(); }); }
  go(r: Route) { if (r !== this.route) location.hash = r === 'home' ? '/' : `/${r}`; }
}

export const router = new Router();
