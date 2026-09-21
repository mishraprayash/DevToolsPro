import { describe, it, expect } from 'vitest';
import { generateGitCommand } from '../utils';

describe('Git Generator Utilities', () => {
  it('should generate commit commands', () => {
    const res = generateGitCommand({ type: 'commit', message: 'feat: add test', addAll: true });
    expect(res.success).toBe(true);
    if (res.success) {
      expect(res.data.command).toBe('git add . && git commit -m "feat: add test"');
    }
  });

  it('should generate branch creation and deletion commands', () => {
    const newBranch = generateGitCommand({ type: 'branch', branchName: 'feature/login', newBranch: true });
    expect(newBranch.success).toBe(true);
    if (newBranch.success) {
      expect(newBranch.data.command).toBe('git checkout -b feature/login');
    }

    const delBranch = generateGitCommand({ type: 'branch', branchName: 'feature/login', deleteBranch: true });
    expect(delBranch.success).toBe(true);
    if (delBranch.success) {
      expect(delBranch.data.command).toBe('git branch -d feature/login');
    }
  });

  it('should generate stash, reset, and remote commands', () => {
    const stash = generateGitCommand({ type: 'stash', stashAction: 'save', stashMessage: 'wip' });
    expect(stash.success).toBe(true);
    if (stash.success) expect(stash.data.command).toBe('git stash save "wip"');

    const reset = generateGitCommand({ type: 'reset', resetMode: 'hard', resetTarget: 'HEAD~2' });
    expect(reset.success).toBe(true);
    if (reset.success) expect(reset.data.command).toBe('git reset --hard HEAD~2');

    const remote = generateGitCommand({ type: 'remote', addRemote: true, remoteName: 'origin', remoteUrl: 'https://github.com/a/b.git' });
    expect(remote.success).toBe(true);
    if (remote.success) expect(remote.data.command).toBe('git remote add origin https://github.com/a/b.git');
  });

  it('should handle amend commit options', () => {
    const amendWithAddAll = generateGitCommand({ type: 'commit', amend: true, addAll: true });
    expect(amendWithAddAll.success).toBe(true);
    if (amendWithAddAll.success) {
      expect(amendWithAddAll.data.command).toBe('git add . && git commit --amend --no-edit');
    }

    const amendWithMessage = generateGitCommand({ type: 'commit', amend: true, message: 'updated' });
    expect(amendWithMessage.success).toBe(true);
    if (amendWithMessage.success) {
      expect(amendWithMessage.data.command).toBe('git commit --amend -m "updated"');
    }
  });

  it('should fallback to defaults when options are missing', () => {
    const defaultCommit = generateGitCommand({ type: 'commit' });
    expect(defaultCommit.success).toBe(true);
    if (defaultCommit.success) expect(defaultCommit.data.command).toBe('git commit -m "commit message"');

    const defaultCheckout = generateGitCommand({ type: 'branch' });
    expect(defaultCheckout.success).toBe(true);
    if (defaultCheckout.success) expect(defaultCheckout.data.command).toBe('git checkout branch-name');

    const defaultRemoteList = generateGitCommand({ type: 'remote' });
    expect(defaultRemoteList.success).toBe(true);
    if (defaultRemoteList.success) expect(defaultRemoteList.data.command).toBe('git remote -v');

    const defaultReset = generateGitCommand({ type: 'reset' });
    expect(defaultReset.success).toBe(true);
    if (defaultReset.success) expect(defaultReset.data.command).toBe('git reset --mixed HEAD~1');
  });

  it('should handle all stash actions correctly', () => {
    const actions = ['save', 'pop', 'apply', 'list', 'clear'] as const;
    for (const action of actions) {
      const res = generateGitCommand({ type: 'stash', stashAction: action });
      expect(res.success).toBe(true);
    }
  });

  it('should return error for unknown command type', () => {
    // @ts-expect-error - testing invalid command type
    const res = generateGitCommand({ type: 'unknown-type' });
    expect(res.success).toBe(false);
    if (!res.success) {
      expect(res.error).toBe('Unknown command type');
    }
  });
});
