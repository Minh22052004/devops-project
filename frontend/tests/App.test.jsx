import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import App from '../src/App';

// Mock fetch so tests do not need a running backend
beforeEach(() => {
  global.fetch = jest.fn();
});
afterEach(() => {
  jest.resetAllMocks();
});

// Helper: make fetch return a list of bugs
function mockFetchBugs(bugs = []) {
  global.fetch.mockResolvedValue({
    ok: true,
    json: async () => bugs,
  });
}

// ---------------------------------------------------------------------------
// CORE TESTS — must all pass after fixing backend bugs
// ---------------------------------------------------------------------------

test('renders the app heading', async () => {
  mockFetchBugs();
  render(<App />);
  expect(screen.getByText(/Bug Tracker/i)).toBeInTheDocument();
});

test('renders Report button', async () => {
  mockFetchBugs();
  render(<App />);
  expect(screen.getByRole('button', { name: /report/i })).toBeInTheDocument();
});

test('renders input with correct placeholder', async () => {
  mockFetchBugs();
  render(<App />);
  expect(screen.getByPlaceholderText(/describe the bug/i)).toBeInTheDocument();
});

test('shows empty-state message when no bugs', async () => {
  mockFetchBugs([]);
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText(/no bugs reported/i)).toBeInTheDocument();
  });
});

test('displays bugs fetched from API', async () => {
  mockFetchBugs([
    { id: 1, title: 'Wrong database password', status: 'open' },
    { id: 2, title: 'DELETE endpoint missing', status: 'in_progress' },
  ]);
  render(<App />);
  await waitFor(() => {
    expect(screen.getByText('Wrong database password')).toBeInTheDocument();
    expect(screen.getByText('DELETE endpoint missing')).toBeInTheDocument();
  });
});

test('does not call API when Report is clicked with empty input', async () => {
  mockFetchBugs();
  render(<App />);
  await waitFor(() => {});

  const callsBefore = global.fetch.mock.calls.length;
  fireEvent.click(screen.getByRole('button', { name: /report/i }));
  expect(global.fetch.mock.calls.length).toBe(callsBefore);
});

test('calls POST /api/bugs when a valid title is submitted', async () => {
  mockFetchBugs();
  global.fetch
    .mockResolvedValueOnce({ ok: true, json: async () => [] })
    .mockResolvedValueOnce({ ok: true, json: async () => ({ id: 1, title: 'New bug', status: 'open' }) })
    .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 1, title: 'New bug', status: 'open' }] });

  render(<App />);
  await waitFor(() => {});

  fireEvent.change(screen.getByPlaceholderText(/describe the bug/i), {
    target: { value: 'New bug' },
  });
  fireEvent.click(screen.getByRole('button', { name: /report/i }));

  await waitFor(() => {
    const postCall = global.fetch.mock.calls.find(
      ([url, opts]) => opts && opts.method === 'POST'
    );
    expect(postCall).toBeDefined();
    expect(JSON.parse(postCall[1].body).title).toBe('New bug');
  });
});

// ---------------------------------------------------------------------------
// OPTIONAL CHALLENGE TESTS
// Uncomment each block when you are ready to implement that feature.
// ---------------------------------------------------------------------------

// CHALLENGE 1: Delete button
// Each bug should have a Delete button that calls DELETE /api/bugs/:id
//
// test('Delete button calls DELETE /api/bugs/:id', async () => {
//   mockFetchBugs([{ id: 5, title: 'Bug to delete', status: 'open' }]);
//   global.fetch
//     .mockResolvedValueOnce({ ok: true, json: async () => [{ id: 5, title: 'Bug to delete', status: 'open' }] })
//     .mockResolvedValueOnce({ ok: true, json: async () => ({}) })
//     .mockResolvedValueOnce({ ok: true, json: async () => [] });
//   render(<App />);
//   await waitFor(() => expect(screen.getByText('Bug to delete')).toBeInTheDocument());
//   fireEvent.click(screen.getByRole('button', { name: /delete/i }));
//   await waitFor(() => {
//     const deleteCall = global.fetch.mock.calls.find(
//       ([url, opts]) => opts && opts.method === 'DELETE'
//     );
//     expect(deleteCall).toBeDefined();
//   });
// });

// CHALLENGE 2: Status cycle / severity filter
//
// A) Status cycle button cycles open → in_progress → closed → open
// test('Status button cycles bug status via PUT', async () => {
//   mockFetchBugs([{ id: 1, title: 'My bug', status: 'open' }]);
//   render(<App />);
//   await waitFor(() => expect(screen.getByText('My bug')).toBeInTheDocument());
//   fireEvent.click(screen.getByRole('button', { name: /open|in.progress|closed/i }));
//   await waitFor(() => {
//     const putCall = global.fetch.mock.calls.find(([url, opts]) => opts && opts.method === 'PUT');
//     expect(putCall).toBeDefined();
//   });
// });
//
// B) Severity filter shows only bugs matching selected severity
// test('severity filter hides non-matching bugs', async () => {
//   mockFetchBugs([
//     { id: 1, title: 'Critical issue', status: 'open', severity: 'critical' },
//     { id: 2, title: 'Minor typo',    status: 'open', severity: 'low' },
//   ]);
//   render(<App />);
//   await waitFor(() => expect(screen.getByText('Critical issue')).toBeInTheDocument());
//   fireEvent.change(screen.getByRole('combobox', { name: /severity/i }), { target: { value: 'critical' } });
//   expect(screen.getByText('Critical issue')).toBeInTheDocument();
//   expect(screen.queryByText('Minor typo')).not.toBeInTheDocument();
// });
