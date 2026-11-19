import type {Node as ProseMirrorNode, Slice} from '@tiptap/pm/model'

const LIST_ITEM_TYPES = new Set(['listItem', 'taskItem'])

/**
 * Serializes a copied slice as plain text. The default ProseMirror serializer drops
 * list structure entirely ("this\nis\na\nlist"), so list items get their markers back
 * ("- this"), ordered items are numbered, and nested lists are indented.
 */
export function serializeClipboardText(slice: Slice): string {
	const lines: string[] = []
	slice.content.forEach(node => collectNode(node, '', lines))
	return lines.join('\n')
}

function collectNode(node: ProseMirrorNode, indent: string, lines: string[]): void {
	if (node.isTextblock) {
		lines.push(indent + blockText(node))
		return
	}

	if (node.isLeaf) {
		if (node.textContent) {
			lines.push(indent + node.textContent)
		}
		return
	}

	if (node.type.name === 'orderedList') {
		node.forEach((item, _offset, index) => collectListItem(item, indent, `${index + 1}. `, lines))
		return
	}

	if (node.type.name === 'bulletList' || node.type.name === 'taskList') {
		node.forEach(item => collectListItem(item, indent, '- ', lines))
		return
	}

	node.forEach(child => collectNode(child, indent, lines))
}

function collectListItem(item: ProseMirrorNode, indent: string, marker: string, lines: string[]): void {
	if (!LIST_ITEM_TYPES.has(item.type.name)) {
		collectNode(item, indent, lines)
		return
	}

	const nestedIndent = indent + ' '.repeat(marker.length)
	item.forEach((child, _offset, index) => {
		if (index === 0 && child.isTextblock) {
			lines.push(indent + marker + blockText(child))
			return
		}
		collectNode(child, nestedIndent, lines)
	})
}

function blockText(node: ProseMirrorNode): string {
	return node.textBetween(0, node.content.size, undefined, '\n')
}
