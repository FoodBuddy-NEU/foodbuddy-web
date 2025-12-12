import { act } from 'react';
import { render, screen } from '@testing-library/react';
import BookmarkButton from './BookmarkButton';

const addBookmark = jest.fn();
const removeBookmark = jest.fn();
const subscribeState = { called: false, ids: [] as string[] };
let subscribeBookmarksMock = (_uid: string, cb: (ids: Set<string>) => void): (() => void) => {
  // Only call cb on first mount, not on subsequent renders
  setTimeout(() => {
    if (!subscribeState.called) {
      cb(new Set(subscribeState.ids));
      subscribeState.called = true;
    }
  }, 0);
  return () => {};
};
beforeEach(() => {
  addBookmark.mockClear();
  removeBookmark.mockClear();
  subscribeState.called = false;
  subscribeState.ids = [];
  subscribeBookmarksMock = (_uid: string, cb: (ids: Set<string>) => void): (() => void) => {
    if (!subscribeState.called) {
      cb(new Set(subscribeState.ids));
      subscribeState.called = true;
    }
    return () => {};
  };
});

jest.mock('next/navigation', () => ({ useRouter: () => ({ push: jest.fn() }) }));
jest.mock('@/lib/AuthProvider', () => ({
  useAuth: () => ({ user: { uid: 'u1' }, loading: false }),
}));
jest.mock('@/lib/bookmarks', () => ({
  addBookmark: (uid: string, rid: string) => addBookmark(uid, rid),
  removeBookmark: (uid: string, rid: string) => removeBookmark(uid, rid),
  subscribeBookmarks: (uid: string, cb: (ids: Set<string>) => void) =>
    subscribeBookmarksMock(uid, cb),
}));

describe('BookmarkButton', () => {
  beforeEach(() => {
    addBookmark.mockClear();
    removeBookmark.mockClear();
    subscribeBookmarksMock = (_uid: string, cb: (ids: Set<string>) => void) => {
      if (!subscribeState.called) {
        subscribeState.called = true;
        setTimeout(() => {
          cb(new Set(subscribeState.ids));
        }, 0);
      }
      return () => {};
    };
  });

  it('renders as not bookmarked by default', () => {
    render((<BookmarkButton restaurantId="r1" />) as React.ReactElement);
    expect(screen.getByText('Bookmark')).toBeInTheDocument();
    expect(screen.getByText('☆')).toBeInTheDocument();
  });

  it('toggles to bookmarked on click', () => {
    render((<BookmarkButton restaurantId="r1" />) as React.ReactElement);
    const btn = screen.getByRole('button');
    act(() => {
      btn.click();
    });
    expect(screen.getByText('Saved')).toBeInTheDocument();
    expect(screen.getByText('★')).toBeInTheDocument();
  });

  it('calls addBookmark when not bookmarked', () => {
    render((<BookmarkButton restaurantId="r2" />) as React.ReactElement);
    const btn = screen.getByRole('button');
    act(() => {
      btn.click();
    });
    expect(addBookmark).toHaveBeenCalledWith('u1', 'r2');
  });

  it('renders as bookmarked if already bookmarked', async () => {
    subscribeState.ids = ['r3'];
    render((<BookmarkButton restaurantId="r3" />) as React.ReactElement);
    expect(await screen.findByText('Saved')).toBeInTheDocument();
    expect(await screen.findByText('★')).toBeInTheDocument();
  });

  it('calls removeBookmark when already bookmarked', async () => {
    subscribeState.ids = ['r4'];
    render((<BookmarkButton restaurantId="r4" />) as React.ReactElement);
    // Wait for button to show as bookmarked
    await screen.findByText('Saved');
    const btn = screen.getByRole('button');
    act(() => {
      btn.click();
    });
    expect(removeBookmark).toHaveBeenCalledWith('u1', 'r4');
  });
});
