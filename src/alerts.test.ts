import {
  buildAlertMessage,
  shouldAlert,
  createAlertEvent,
  dispatchAlerts,
  AlertConfig,
} from './alerts';

describe('buildAlertMessage', () => {
  it('includes port and event type in message', () => {
    const msg = buildAlertMessage(3000, 'opened');
    expect(msg).toContain('3000');
    expect(msg).toContain('opened');
  });

  it('mentions closed for close events', () => {
    const msg = buildAlertMessage(8080, 'closed');
    expect(msg).toContain('closed');
  });
});

describe('shouldAlert', () => {
  it('returns true by default for opened events', () => {
    expect(shouldAlert('opened', {})).toBe(true);
  });

  it('returns false when onOpen is disabled', () => {
    expect(shouldAlert('opened', { onOpen: false })).toBe(false);
  });

  it('returns false when onClose is disabled', () => {
    expect(shouldAlert('closed', { onClose: false })).toBe(false);
  });

  it('returns true for closed when onClose is not set', () => {
    expect(shouldAlert('closed', {})).toBe(true);
  });
});

describe('createAlertEvent', () => {
  it('creates event with correct fields', () => {
    const event = createAlertEvent(4000, 'opened', 'warn');
    expect(event.port).toBe(4000);
    expect(event.event).toBe('opened');
    expect(event.level).toBe('warn');
    expect(event.timestamp).toBeInstanceOf(Date);
    expect(event.message).toContain('4000');
  });

  it('defaults level to info', () => {
    const event = createAlertEvent(5000, 'closed');
    expect(event.level).toBe('info');
  });
});

describe('dispatchAlerts', () => {
  it('returns events for opened and closed ports', async () => {
    const config: AlertConfig = { onOpen: true, onClose: true };
    const events = await dispatchAlerts({ opened: [3000], closed: [8080] }, config);
    expect(events).toHaveLength(2);
    expect(events[0].event).toBe('opened');
    expect(events[1].event).toBe('closed');
  });

  it('skips events when alerts are disabled', async () => {
    const config: AlertConfig = { onOpen: false, onClose: false };
    const events = await dispatchAlerts({ opened: [3000], closed: [8080] }, config);
    expect(events).toHaveLength(0);
  });

  it('returns empty array when no changes', async () => {
    const events = await dispatchAlerts({ opened: [], closed: [] }, {});
    expect(events).toHaveLength(0);
  });
});
