import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import checkIcon from 'iconoir/icons/check.svg?raw';
import xmarkIcon from 'iconoir/icons/xmark.svg?raw';
import settingsIcon from 'iconoir/icons/settings.svg?raw';
import navArrowDownIcon from 'iconoir/icons/nav-arrow-down.svg?raw';
import navArrowRightIcon from 'iconoir/icons/nav-arrow-right.svg?raw';
import noteIconSvg from '/note.svg?raw';
import { dataService, type NoteWidget } from '../services/data.js';

@customElement('fv-notes')
export class Notes extends LitElement {
	@property({ type: Object }) widget!: NoteWidget;
	@state() private isEditing = false;
	@state() private editContent = '';
	@state() private isIconHovered = false;

	static styles = css`
		:host {
			display: flex;
			flex-direction: column;
			height: 100%;
		}

		.header {
			padding: var(--fv-spacing-xs);
			border-bottom: 1px solid var(--fv-border-light);
			display: flex;
			align-items: center;
			justify-content: space-between;
			cursor: grab;
			user-select: none;
		}

		.header:active {
			cursor: grabbing;
		}

		.title {
			font-size: var(--fv-font-size-sm);
			font-weight: 600;
			color: var(--fv-text-primary);
			margin: 0;
		}

		.header-content {
			display: flex;
			align-items: center;
			gap: var(--fv-spacing-sm);
			min-width: 0;
			flex: 1;
		}

		.note-icon {
			width: 20px;
			height: 20px;
			object-fit: contain;
			flex-shrink: 0;
			cursor: pointer;
			transition: var(--fv-transition);
		}

		.note-icon:hover {
			opacity: 0.7;
		}

		.caret-icon {
			width: 20px;
			height: 20px;
			flex-shrink: 0;
			cursor: pointer;
			color: var(--fv-text-secondary);
			transition: var(--fv-transition);
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.caret-icon:hover {
			color: var(--fv-accent-primary);
		}

		.caret-icon svg {
			width: 16px;
			height: 16px;
		}

		:host([data-color='yellow']) .note-icon {
			color: var(--fv-note-yellow-border);
		}

		:host([data-color='green']) .note-icon {
			color: var(--fv-note-green-border);
		}

		:host([data-color='blue']) .note-icon {
			color: var(--fv-note-blue-border);
		}

		:host([data-color='red']) .note-icon {
			color: var(--fv-note-red-border);
		}

		.header-title {
			margin: 0;
			white-space: nowrap;
			overflow: hidden;
			text-overflow: ellipsis;
			flex: 1;
		}

		.header-actions {
			display: flex;
			gap: var(--fv-spacing-xs);
			align-items: center;
		}

		.configure-btn {
			background: none;
			border: none;
			border-radius: var(--fv-border-radius);
			padding: 2px;
			cursor: pointer;
			color: var(--fv-text-secondary);
			transition: var(--fv-transition);
			opacity: 0;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.header:hover .configure-btn,
		.header:focus-within .configure-btn {
			opacity: 1;
		}

		.configure-btn:hover {
			background-color: var(--fv-bg-primary);
			color: var(--fv-accent-primary);
		}

		.configure-btn svg {
			width: 14px;
			height: 14px;
		}

		.content {
			padding: var(--fv-spacing-sm);
			flex: 1;
			overflow-y: auto;
			background-color: var(--note-bg);
			position: relative;
			display: block;
		}

		:host([folded]) .content {
			display: none;
		}

		:host([data-color='yellow']) .content {
			--note-bg: var(--fv-note-yellow);
			border-left: 4px solid var(--fv-note-yellow-border);
		}

		:host([data-color='green']) .content {
			--note-bg: var(--fv-note-green);
			border-left: 4px solid var(--fv-note-green-border);
		}

		:host([data-color='blue']) .content {
			--note-bg: var(--fv-note-blue);
			border-left: 4px solid var(--fv-note-blue-border);
		}

		:host([data-color='red']) .content {
			--note-bg: var(--fv-note-red);
			border-left: 4px solid var(--fv-note-red-border);
		}

		.note-text {
			word-wrap: break-word;
			line-height: var(--fv-line-height);
			margin: 0;
			cursor: pointer;
			font-size: var(--fv-font-size-sm);
			color: var(--fv-text-primary);
		}

		.note-text:hover {
			background-color: rgba(0, 0, 0, 0.02);
			border-radius: var(--fv-border-radius);
		}

		.note-text a {
			color: var(--fv-accent-primary);
			text-decoration: underline;
		}

		.note-text a:hover {
			color: var(--fv-accent-hover);
		}

		.edit-textarea {
			width: 100%;
			height: 100%;
			border: none;
			outline: none;
			resize: none;
			font-family: var(--fv-font-family);
			font-size: var(--fv-font-size-sm);
			line-height: var(--fv-line-height);
			background: transparent;
			color: var(--fv-text-primary);
			padding: 0;
		}

		.edit-controls {
			position: absolute;
			bottom: var(--fv-spacing-sm);
			right: var(--fv-spacing-sm);
			display: flex;
			gap: var(--fv-spacing-xs);
		}

		.edit-btn {
			background: var(--fv-accent-primary);
			border: none;
			border-radius: var(--fv-border-radius);
			padding: var(--fv-spacing-xs) var(--fv-spacing-sm);
			color: white;
			cursor: pointer;
			font-size: var(--fv-font-size-xs);
			transition: var(--fv-transition);
			display: flex;
			align-items: center;
			gap: var(--fv-spacing-xs);
		}

		.edit-btn:hover {
			background-color: var(--fv-accent-hover);
		}

		.edit-btn svg {
			width: 12px;
			height: 12px;
		}

		.cancel-btn {
			background: var(--fv-text-muted);
		}

		.cancel-btn:hover {
			background-color: var(--fv-text-secondary);
		}

		.empty {
			color: var(--fv-text-muted);
			font-style: italic;
			cursor: pointer;
		}
	`;

	connectedCallback() {
		super.connectedCallback();
		(this as HTMLElement).dataset.color = this.widget.color;
		if (this.widget.folded) {
			this.setAttribute('folded', '');
		}
	}

	private startEditing() {
		this.isEditing = true;
		this.editContent = this.widget.content;
	}

	private cancelEditing() {
		this.isEditing = false;
		this.editContent = '';
	}

	private async saveNote() {
		const updatedWidget: NoteWidget = {
			...this.widget,
			content: this.editContent,
		};

		await dataService.updateWidget(updatedWidget);

		this.dispatchEvent(
			new CustomEvent('widget-updated', {
				detail: updatedWidget,
				bubbles: true,
			}),
		);

		this.isEditing = false;
		this.editContent = '';
	}

	private async handleKeydown(event: KeyboardEvent) {
		if (event.key === 'Escape') {
			this.cancelEditing();
		} else if (event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
			await this.saveNote();
		}
	}

	private parseContent(content: string) {
		if (!content.trim()) {
			return html`<span class="empty">Click to add a note...</span>`;
		}

		const contentLines = content.split('\n');

		return html`${contentLines.map((line, lineIndex) => {
			const parsedLine = this.parseLinksInText(line);
			return html`${parsedLine}${lineIndex < contentLines.length - 1 ? html`<br />` : ''}`;
		})}`;
	}

	private parseLinksInText(text: string) {
		const linkRegex = /(https?:\/\/\S+)/g;
		const textParts = text.split(linkRegex);

		return textParts.map((part) => {
			if (linkRegex.test(part)) {
				return html`<a href="${part}" target="_blank" rel="noopener noreferrer">${part}</a>`;
			}

			return part;
		});
	}

	private handleConfigure(e: Event) {
		e.stopPropagation();
		this.dispatchEvent(
			new CustomEvent('configure-widget', {
				detail: this.widget,
				bubbles: true,
				composed: true,
			}),
		);
	}

	private handleIconMouseEnter() {
		this.isIconHovered = true;
	}

	private handleIconMouseLeave() {
		this.isIconHovered = false;
	}

	private handleToggleFold(e: Event) {
		e.stopPropagation();
		const updatedWidget: NoteWidget = {
			...this.widget,
			folded: !this.widget.folded,
		};

		if (updatedWidget.folded) {
			this.setAttribute('folded', '');
		} else {
			this.removeAttribute('folded');
		}

		this.dispatchEvent(
			new CustomEvent('widget-updated', {
				detail: updatedWidget,
				bubbles: true,
			}),
		);
	}

	render() {
		return html`
			<div class="header">
				<span class="header-content">
					${this.isIconHovered
						? html`
								<span
									class="caret-icon"
									role="button"
									tabindex="0"
									aria-label="${this.widget.folded ? 'Unfold widget' : 'Fold widget'}"
									@click=${this.handleToggleFold}
									@mouseenter=${this.handleIconMouseEnter}
									@mouseleave=${this.handleIconMouseLeave}
								>
									${this.widget.folded ? unsafeSVG(navArrowRightIcon) : unsafeSVG(navArrowDownIcon)}
								</span>
							`
						: html`
								<span
									class="note-icon"
									@mouseenter=${this.handleIconMouseEnter}
									@mouseleave=${this.handleIconMouseLeave}
								>
									${unsafeSVG(noteIconSvg)}
								</span>
							`}
					<h2 class="title header-title">${this.widget.title}</h2>
				</span>
				<div class="header-actions">
					<button class="configure-btn" @click=${this.handleConfigure} title="Configure widget">
						${unsafeSVG(settingsIcon)}
					</button>
				</div>
			</div>
			<div class="content">
				${this.isEditing
					? html`
							<textarea
								class="edit-textarea"
								.value=${this.editContent}
								@input=${(e: Event) => (this.editContent = (e.target as HTMLTextAreaElement).value)}
								@keydown=${this.handleKeydown}
								placeholder="Enter your note here..."
								autofocus
							>
							</textarea>
							<div class="edit-controls">
								<button class="edit-btn cancel-btn" @click=${this.cancelEditing}>${unsafeSVG(xmarkIcon)} Cancel</button>
								<button class="edit-btn" @click=${this.saveNote}>${unsafeSVG(checkIcon)} Save</button>
							</div>
						`
					: html` <div class="note-text" @click=${this.startEditing}>${this.parseContent(this.widget.content)}</div> `}
			</div>
		`;
	}
}
