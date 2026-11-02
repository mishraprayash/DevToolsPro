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
});
