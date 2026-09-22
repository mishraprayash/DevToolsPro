import { describe, it, expect } from 'vitest';
import { generateGitCommand, GitCommandType } from '../utils';

describe('Git Generator Utilities', () => {
  describe('Commit Commands', () => {
    it('should generate commit with addAll', () => {
      const res = generateGitCommand({ type: 'commit', message: 'feat: add test', addAll: true });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.command).toBe('git add . && git commit -m "feat: add test"');
      }
    });

    it('should generate amend commit with addAll and without addAll', () => {
      const amendAll = generateGitCommand({ type: 'commit', amend: true, addAll: true });
      expect(amendAll.success).toBe(true);
      if (amendAll.success) {
        expect(amendAll.data.command).toBe('git add . && git commit --amend --no-edit');
      }

      const amendMsg = generateGitCommand({ type: 'commit', amend: true, message: 'fix msg' });
      expect(amendMsg.success).toBe(true);
      if (amendMsg.success) {
        expect(amendMsg.data.command).toBe('git commit --amend -m "fix msg"');
      }
    });

    it('should generate default commit message if no message supplied', () => {
      const res = generateGitCommand({ type: 'commit' });
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.command).toBe('git commit -m "commit message"');
      }
    });
  });

  describe('Branch Commands', () => {
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

      const checkoutBranch = generateGitCommand({ type: 'branch', branchName: 'main' });
      expect(checkoutBranch.success).toBe(true);
      if (checkoutBranch.success) {
        expect(checkoutBranch.data.command).toBe('git checkout main');
      }
    });
  });

  describe('Remote Commands', () => {
    it('should generate add remote and list remotes commands', () => {
      const remote = generateGitCommand({
        type: 'remote',
        addRemote: true,
        remoteName: 'origin',
        remoteUrl: 'https://github.com/a/b.git',
      });
      expect(remote.success).toBe(true);
      if (remote.success) {
        expect(remote.data.command).toBe('git remote add origin https://github.com/a/b.git');
      }

      const listRemote = generateGitCommand({ type: 'remote' });
      expect(listRemote.success).toBe(true);
      if (listRemote.success) {
        expect(listRemote.data.command).toBe('git remote -v');
      }
    });
  });

  describe('Reset Commands', () => {
    it('should generate hard, soft, and mixed reset commands', () => {
      const resetHard = generateGitCommand({ type: 'reset', resetMode: 'hard', resetTarget: 'HEAD~2' });
      expect(resetHard.success).toBe(true);
      if (resetHard.success) {
        expect(resetHard.data.command).toBe('git reset --hard HEAD~2');
        expect(resetHard.data.explanation).toContain('DISCARDS');
      }

      const resetSoft = generateGitCommand({ type: 'reset', resetMode: 'soft', resetTarget: 'HEAD~1' });
      expect(resetSoft.success).toBe(true);
      if (resetSoft.success) {
        expect(resetSoft.data.command).toBe('git reset --soft HEAD~1');
        expect(resetSoft.data.explanation).toContain('keeps changes staged');
      }

      const resetDefault = generateGitCommand({ type: 'reset' });
      expect(resetDefault.success).toBe(true);
      if (resetDefault.success) {
        expect(resetDefault.data.command).toBe('git reset --mixed HEAD~1');
        expect(resetDefault.data.explanation).toContain('keeps changes unstaged');
      }
    });
  });

  describe('Stash Commands', () => {
    it('should generate stash save, pop, apply, list, and clear commands', () => {
      const save = generateGitCommand({ type: 'stash', stashAction: 'save', stashMessage: 'wip' });
      expect(save.success).toBe(true);
      if (save.success) expect(save.data.command).toBe('git stash save "wip"');

      const saveDefault = generateGitCommand({ type: 'stash', stashAction: 'save' });
      expect(saveDefault.success).toBe(true);
      if (saveDefault.success) expect(saveDefault.data.command).toBe('git stash');

      const pop = generateGitCommand({ type: 'stash', stashAction: 'pop' });
      expect(pop.success).toBe(true);
      if (pop.success) expect(pop.data.command).toBe('git stash pop');

      const apply = generateGitCommand({ type: 'stash', stashAction: 'apply' });
      expect(apply.success).toBe(true);
      if (apply.success) expect(apply.data.command).toBe('git stash apply');

      const list = generateGitCommand({ type: 'stash', stashAction: 'list' });
      expect(list.success).toBe(true);
      if (list.success) expect(list.data.command).toBe('git stash list');

      const clear = generateGitCommand({ type: 'stash', stashAction: 'clear' });
      expect(clear.success).toBe(true);
      if (clear.success) expect(clear.data.command).toBe('git stash clear');
    });
  });

  describe('Error Handling', () => {
    it('should return error for unknown command type', () => {
      const result = generateGitCommand({ type: 'unknown' as GitCommandType });
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error).toBe('Unknown command type');
      }
    });
  });
});
