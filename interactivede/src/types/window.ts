import { Event, Logging } from '../logging';

declare global {
  // eslint-disable-next-line @typescript-eslint/naming-convention
  interface Window {
    LOGGER: Logging;
    logs: Event[];
  }
}
