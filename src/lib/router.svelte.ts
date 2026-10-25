/** 'tasks' is not a screen of its own: it opens Habits on its Tasks tab. */
export type Route = 'home' | 'tasks' | 'calls' | 'calendar' | 'notes' | 'habits' | 'health' | 'finance' | 'focus';
export type HabitsTab = 'habits' | 'tasks';
const ROUTES: Route[] = ['home', 'tasks', 'calls', 'calendar', 'notes', 'habits', 'health', 'finance', 'focus'];

const parse = (): Route => {
  const r = location.hash.replace(/^#\/?/, '') as Route;
  return ROUTES.includes(r) ? r : 'home';
};

class Router {
  route = $state<Route>(parse() === 'tasks' ? 'habits' : parse());
  /** Which half of the Habits screen is open. */
  tab = $state<HabitsTab>(parse() === 'tasks' ? 'tasks' : 'habits');
  constructor() {
    window.addEventListener('hashchange', () => {
      const r = parse();
      if (r === 'tasks') this.tab = 'tasks';
      this.route = r === 'tasks' ? 'habits' : r;
    });
  }
  go(r: Route) {
    if (r === 'tasks') { this.tab = 'tasks'; r = 'habits'; }
    if (r !== this.route) { this.route = r; location.hash = r === 'home' ? '/' : `/${r}`; }
  }
}

export const router = new Router();
