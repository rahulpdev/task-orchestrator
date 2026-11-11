/**
 * Finds what the user is editing, so the vault adapter never writes over unsaved changes.
 *
 * @packageDocumentation
 */
import { MarkdownView } from 'obsidian';
import type { TFile, Workspace } from 'obsidian';

/**
 * Reads the text of every Markdown editor that has the file open.
 *
 * @param workspace - The app's workspace.
 * @param file - The file to look for.
 * @returns One text per open editor, including unsaved changes; empty when the file is not open.
 */
export function readOpenEditorTexts(
	workspace: Pick<Workspace, 'getLeavesOfType'>,
	file: TFile,
): string[] {
	return workspace.getLeavesOfType('markdown').flatMap((leaf) => {
		const view = leaf.view;
		return view instanceof MarkdownView && view.file?.path === file.path
			? [view.editor.getValue()]
			: [];
	});
}
