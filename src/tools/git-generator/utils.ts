export type GitCommandType = 'commit' | 'branch' | 'remote' | 'reset' | 'stash';

export interface GitCommandState {
  type: GitCommandType;
  // commit
  message?: string;
  addAll?: boolean;
  amend?: boolean;
  // branch
  branchName?: string;
  newBranch?: boolean;
  deleteBranch?: boolean;
  // remote
  remoteName?: string;
  remoteUrl?: string;
  addRemote?: boolean;
  // reset
  resetMode?: 'soft' | 'mixed' | 'hard';
  resetTarget?: string;
  // stash
  stashMessage?: string;
  stashAction?: 'save' | 'pop' | 'apply' | 'list' | 'clear';
}

export function generateGitCommand(state: GitCommandState): { success: true; data: { command: string; explanation: string } } | { success: false; error: string } {
  try {
    let command = '';
    let explanation = '';

    switch (state.type) {
      case 'commit':
        if (state.addAll && !state.amend) {
          command = `git add . && git commit -m "${state.message || 'commit message'}"`;
          explanation = 'Stages all changed files and creates a new commit with the provided message.';
        } else if (state.amend) {
          command = state.addAll 
            ? `git add . && git commit --amend --no-edit` 
            : `git commit --amend -m "${state.message || 'updated message'}"`;
          explanation = state.addAll 
            ? 'Stages all files and adds them to the previous commit without changing its message.'
            : 'Modifies the most recent commit, updating its message.';
        } else {
          command = `git commit -m "${state.message || 'commit message'}"`;
          explanation = 'Creates a new commit with the staged changes.';
        }
        break;

      case 'branch':
        if (state.deleteBranch) {
          command = `git branch -d ${state.branchName || 'branch-name'}`;
          explanation = `Safely deletes the branch '${state.branchName || 'branch-name'}'. Use -D to force delete.`;
        } else if (state.newBranch) {
          command = `git checkout -b ${state.branchName || 'new-branch'}`;
          explanation = `Creates a new branch named '${state.branchName || 'new-branch'}' and switches to it.`;
        } else {
          command = `git checkout ${state.branchName || 'branch-name'}`;
          explanation = `Switches to the branch named '${state.branchName || 'branch-name'}'.`;
        }
        break;

      case 'remote':
        if (state.addRemote) {
          command = `git remote add ${state.remoteName || 'origin'} ${state.remoteUrl || 'https://github.com/user/repo.git'}`;
          explanation = `Adds a new remote repository named '${state.remoteName || 'origin'}'.`;
        } else {
          command = `git remote -v`;
          explanation = 'Lists all configured remote repositories and their URLs.';
        }
        break;

      case 'reset':
        command = `git reset --${state.resetMode || 'mixed'} ${state.resetTarget || 'HEAD~1'}`;
        const modeDesc = state.resetMode === 'hard' 
          ? 'DISCARDS all changes (dangerous)' 
          : state.resetMode === 'soft' 
            ? 'keeps changes staged' 
            : 'keeps changes unstaged';
        explanation = `Moves the current branch pointer to '${state.resetTarget || 'HEAD~1'}' and ${modeDesc}.`;
        break;

      case 'stash':
        if (state.stashAction === 'save') {
          command = state.stashMessage 
            ? `git stash save "${state.stashMessage}"`
            : `git stash`;
          explanation = 'Temporarily shelves (stashes) changes you\'ve made to your working copy so you can work on something else.';
        } else if (state.stashAction === 'pop') {
          command = `git stash pop`;
          explanation = 'Restores the most recently stashed files and removes them from the stash list.';
        } else if (state.stashAction === 'apply') {
          command = `git stash apply`;
          explanation = 'Restores the most recently stashed files but keeps them in the stash list.';
        } else if (state.stashAction === 'list') {
          command = `git stash list`;
          explanation = 'Lists all the stashed changes.';
        } else if (state.stashAction === 'clear') {
          command = `git stash clear`;
          explanation = 'Removes all stashed entries. Warning: this cannot easily be undone.';
        }
        break;

      default:
        return { success: false, error: `Unknown command type: ${String(state.type)}` };
    }

    return { success: true, data: { command, explanation } };
  } catch (error: unknown) {
    return { success: false, error: error instanceof Error ? error.message : 'Failed to generate command' };
  }
}
