import type { MarkType, Node as PMNode, NodeType, ResolvedPos, Attrs, Mark } from "prosemirror-model";
import { InputRule } from "prosemirror-inputrules";
import { lift, setBlockType, toggleMark, wrapIn } from "prosemirror-commands";
import { liftListItem, wrapInList } from "prosemirror-schema-list";
import type { Command, EditorState, Transaction } from "prosemirror-state";

/**
 * Input rule that wraps text in a mark. The regexp must end with `$` and contain two groups:
 * group 1 = the full marked span including delimiters, group 2 = the inner text.
 */
export function markInputRule(regexp: RegExp, markType: MarkType, attrs?: Attrs): InputRule {
  return new InputRule(regexp, (state, match, start, end) => {
    const full = match[1];
    const text = match[2];
    if (!full || !text) return null;
    const fullStart = start + match[0].length - full.length;
    const textStart = fullStart + full.indexOf(text);
    const textEnd = textStart + text.length;
    const $from = state.doc.resolve(fullStart);
    if (!$from.parent.type.allowsMarkType(markType)) return null;
    // Don't apply inside an existing mark of another exclusive type (e.g. inline code).
    let blocked = false;
    state.doc.nodesBetween(fullStart, end, (node) => {
      if (node.marks.some((m) => m.type !== markType && m.type.excludes(markType))) blocked = true;
    });
    if (blocked) return null;
    const tr = state.tr;
    if (textEnd < end) tr.delete(textEnd, end);
    if (textStart > fullStart) tr.delete(fullStart, textStart);
    tr.addMark(fullStart, fullStart + text.length, markType.create(attrs));
    tr.removeStoredMark(markType);
    return tr;
  });
}

/** Runs commands one after another on successive states, combining them into one dispatch. */
export function sequence(...commands: Command[]): Command {
  return (state, dispatch, view) => {
    let current: EditorState = state;
    const trs: Transaction[] = [];
    for (const command of commands) {
      const ok = command(current, (tr) => {
        trs.push(tr);
        current = current.apply(tr);
      }, view);
      if (!ok) return false;
    }
    if (dispatch && trs.length) {
      const tr = state.tr;
      for (const t of trs) for (const step of t.steps) tr.step(step);
      const last = trs[trs.length - 1]!;
      if (last.selectionSet) {
        tr.setSelection(last.selection.map(tr.doc, tr.mapping.slice(tr.steps.length)));
      }
      dispatch(tr.scrollIntoView());
    }
    return true;
  };
}

export function isNodeActive(state: EditorState, type: NodeType, attrs?: Attrs): boolean {
  const { $from, to } = state.selection;
  for (let d = $from.depth; d >= 0; d--) {
    const node = $from.node(d);
    if (node.type !== type) continue;
    if (!attrs || Object.entries(attrs).every(([k, v]) => node.attrs[k] === v)) {
      return to <= $from.end(d);
    }
  }
  return false;
}

/**
 * `match` decides whether the block is "already active" (defaults to `attrs`); pass `{}` to
 * treat any block of `type` as active regardless of its attributes.
 */
export function toggleBlockType(
  type: NodeType,
  fallback: NodeType,
  attrs?: Attrs,
  match: Attrs | undefined = attrs,
): Command {
  return (state, dispatch, view) =>
    isNodeActive(state, type, match)
      ? setBlockType(fallback)(state, dispatch, view)
      : setBlockType(type, attrs)(state, dispatch, view);
}

export function toggleWrap(type: NodeType): Command {
  return (state, dispatch, view) =>
    isNodeActive(state, type) ? lift(state, dispatch, view) : wrapIn(type)(state, dispatch, view);
}

export function toggleMarkCommand(type: MarkType, attrs?: Attrs): Command {
  // Word-processor semantics: a mixed selection gets the mark everywhere; only a fully marked
  // selection has it removed.
  return toggleMark(type, attrs, { removeWhenPresent: false, enterInlineAtoms: true });
}

export interface FoundNode {
  pos: number;
  depth: number;
  node: PMNode;
}

export function findParent($pos: ResolvedPos, predicate: (type: NodeType) => boolean): FoundNode | null {
  for (let d = $pos.depth; d > 0; d--) {
    const node = $pos.node(d);
    if (predicate(node.type)) return { pos: $pos.before(d), depth: d, node };
  }
  return null;
}

const isListType = (type: NodeType) => type.spec.group?.split(" ").includes("list") ?? false;

/** Lifts every selected list item out of all lists. */
const liftOutOfLists: Command = (state, dispatch) => {
  let current = state;
  const trs: Transaction[] = [];
  for (let guard = 0; guard < 20; guard++) {
    const list = findParent(current.selection.$from, isListType);
    if (!list) break;
    const itemType = list.node.firstChild?.type;
    if (!itemType) break;
    const ok = liftListItem(itemType)(current, (tr) => {
      trs.push(tr);
      current = current.apply(tr);
    });
    if (!ok) break;
  }
  if (!trs.length) return false;
  if (dispatch) {
    const tr = state.tr;
    for (const t of trs) for (const step of t.steps) tr.step(step);
    dispatch(tr);
  }
  return true;
};

/**
 * Toggles a list: lifts out when already in this list type, converts between list types
 * (bullet ⇄ ordered keeps items; to/from checklists re-wraps), otherwise wraps.
 */
export function toggleList(listType: NodeType, itemType: NodeType): Command {
  return (state, dispatch, view) => {
    const list = findParent(state.selection.$from, isListType);
    if (list) {
      if (list.node.type === listType) return liftListItem(itemType)(state, dispatch, view);
      if (list.node.firstChild?.type === itemType) {
        if (dispatch) dispatch(state.tr.setNodeMarkup(list.pos, listType, list.node.attrs));
        return true;
      }
      return sequence(liftOutOfLists, wrapInList(listType))(state, dispatch, view);
    }
    return wrapInList(listType)(state, dispatch, view);
  };
}

/** Range of the contiguous text carrying `type` around a position (used to edit links in place). */
export function markRange($pos: ResolvedPos, type: MarkType): { from: number; to: number; mark: Mark } | null {
  const parent = $pos.parent;
  const start = parent.childAfter($pos.parentOffset);
  const child = start.node ?? parent.childBefore($pos.parentOffset).node;
  const mark = child?.marks.find((m) => m.type === type);
  if (!mark) return null;
  let index = $pos.index();
  if (!parent.maybeChild(index)?.marks.some((m) => m.eq(mark))) index--;
  if (index < 0) return null;
  let startIndex = index;
  let endIndex = index + 1;
  while (startIndex > 0 && mark.isInSet(parent.child(startIndex - 1).marks)) startIndex--;
  while (endIndex < parent.childCount && mark.isInSet(parent.child(endIndex).marks)) endIndex++;
  let from = $pos.start();
  for (let i = 0; i < startIndex; i++) from += parent.child(i).nodeSize;
  let to = from;
  for (let i = startIndex; i < endIndex; i++) to += parent.child(i).nodeSize;
  return { from, to, mark };
}

/** Applies `attrs` to every textblock in the selection whose type is listed. */
export function setBlockAttrs(types: string[], attrs: Attrs): Command {
  return (state, dispatch) => {
    const { from, to } = state.selection;
    const tr = state.tr;
    state.doc.nodesBetween(from, to, (node, pos) => {
      if (types.includes(node.type.name) && node.isTextblock) {
        tr.setNodeMarkup(pos, undefined, { ...node.attrs, ...attrs });
      }
      return true;
    });
    if (!tr.docChanged) return false;
    if (dispatch) dispatch(tr);
    return true;
  };
}
