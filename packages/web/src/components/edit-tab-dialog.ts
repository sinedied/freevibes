import { LitElement, html, css } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import { unsafeSVG } from 'lit/directives/unsafe-svg.js';
import trashIcon from 'iconoir/icons/trash.svg?raw';
import { type Tab } from '../services/data.js';

@customElement('fv-edit-tab-dialog')
export class EditTabDialog extends LitElement {
	@property({ type: Boolean }) open = false;
	@property({ type: Object }) tab: Tab | undefined = undefined;
	@property({ type: Boolean }) canDelete = true;
	@state() private tabName = '';
	@state() private showDeleteConfirm = false;

	static styles = css`
		:host {
			display: block;
		}

		.overlay {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.5);
			z-index: 1000;
			display: flex;
			align-items: center;
			justify-content: center;
			opacity: 0;
			visibility: hidden;
			transition: var(--fv-transition);
		}

		:host([open]) .overlay {
			opacity: 1;
			visibility: visible;
		}

		.modal {
			background-color: var(--fv-bg-secondary);
			border-radius: var(--fv-border-radius-lg);
			box-shadow: 0 20px 60px var(--fv-shadow);
			max-width: 400px;
			width: 90%;
			max-height: 80vh;
			overflow-y: auto;
			transform: scale(0.9);
			transition: var(--fv-transition);
		}

		:host([open]) .modal {
			transform: scale(1);
		}

		.header {
			padding: var(--fv-spacing-lg);
			border-bottom: 1px solid var(--fv-border);
			display: flex;
			align-items: center;
			justify-content: space-between;
		}

		.title {
			font-size: var(--fv-font-size-xl);
			font-weight: 600;
			margin: 0;
			color: var(--fv-text-primary);
		}

		.close-btn {
			background: none;
			border: none;
			font-size: var(--fv-font-size-xl);
			cursor: pointer;
			color: var(--fv-text-muted);
			padding: var(--fv-spacing-xs);
			line-height: 1;
			transition: var(--fv-transition);
		}

		.close-btn:hover {
			color: var(--fv-text-primary);
		}

		.content {
			padding: var(--fv-spacing-lg);
		}

		.form-group {
			margin-bottom: var(--fv-spacing-md);
		}

		.form-label {
			display: block;
			font-size: var(--fv-font-size-sm);
			font-weight: 500;
			color: var(--fv-text-primary);
			margin-bottom: var(--fv-spacing-xs);
		}

		.form-input {
			width: 100%;
			padding: var(--fv-spacing-sm);
			font-size: var(--fv-font-size-sm);
			border: 1px solid var(--fv-border);
			border-radius: var(--fv-border-radius);
			background-color: var(--fv-bg-primary);
			color: var(--fv-text-primary);
			box-sizing: border-box;
		}

		.form-input:focus {
			outline: none;
			border-color: var(--fv-accent-primary);
			box-shadow: 0 0 0 3px rgba(0, 123, 255, 0.1);
		}

		.footer {
			padding: var(--fv-spacing-lg);
			border-top: 1px solid var(--fv-border);
			display: flex;
			justify-content: space-between;
			gap: var(--fv-spacing-sm);
		}

		.footer-left {
			display: flex;
			gap: var(--fv-spacing-sm);
		}

		.footer-right {
			display: flex;
			gap: var(--fv-spacing-sm);
			margin-left: auto;
		}

		.btn {
			padding: var(--fv-spacing-sm) var(--fv-spacing-lg);
			border: none;
			border-radius: var(--fv-border-radius);
			font-size: var(--fv-font-size-sm);
			cursor: pointer;
			transition: var(--fv-transition);
		}

		.btn-cancel {
			background-color: var(--fv-bg-tertiary);
			color: var(--fv-text-primary);
			border: 1px solid var(--fv-border);
		}

		.btn-cancel:hover {
			background-color: var(--fv-bg-primary);
		}

		.btn-primary {
			background-color: var(--fv-accent-primary);
			color: white;
		}

		.btn-primary:hover {
			background-color: var(--fv-accent-hover);
		}

		.btn-primary:disabled {
			opacity: 0.5;
			cursor: not-allowed;
		}

		.btn-danger {
			background-color: var(--fv-danger);
			color: white;
			display: flex;
			align-items: center;
			gap: var(--fv-spacing-xs);
		}

		.btn-danger:hover {
			filter: brightness(0.9);
		}

		.btn-danger svg {
			width: 16px;
			height: 16px;
		}

		.confirm-overlay {
			position: fixed;
			top: 0;
			left: 0;
			right: 0;
			bottom: 0;
			background-color: rgba(0, 0, 0, 0.7);
			z-index: 1001;
			display: flex;
			align-items: center;
			justify-content: center;
		}

		.confirm-modal {
			background-color: var(--fv-bg-secondary);
			border-radius: var(--fv-border-radius-lg);
			box-shadow: 0 20px 60px var(--fv-shadow);
			max-width: 400px;
			width: 90%;
			padding: var(--fv-spacing-lg);
		}

		.confirm-title {
			font-size: var(--fv-font-size-lg);
			font-weight: 600;
			margin: 0 0 var(--fv-spacing-md) 0;
			color: var(--fv-text-primary);
		}

		.confirm-message {
			font-size: var(--fv-font-size-sm);
			color: var(--fv-text-primary);
			margin: 0 0 var(--fv-spacing-lg) 0;
			line-height: var(--fv-line-height);
		}

		.confirm-actions {
			display: flex;
			gap: var(--fv-spacing-sm);
			justify-content: flex-end;
		}
	`;

	private isEditMode(): boolean {
		return this.tab !== undefined;
	}

	private resetForm() {
		this.tabName = '';
		this.showDeleteConfirm = false;
	}

	private initializeForm() {
		if (this.tab) {
			this.tabName = this.tab.name || '';
		} else {
			this.resetForm();
		}
	}

	updated(changedProperties: Map<string, unknown>) {
		const dialogOpened = changedProperties.has('open') && this.open;
		const tabChanged = changedProperties.has('tab') && this.open;

		if (dialogOpened || tabChanged) {
			this.initializeForm();
		}
	}

	private handleClose() {
		this.resetForm();
		this.dispatchEvent(new CustomEvent('close', { bubbles: true }));
	}

	private handleSave() {
		if (!this.tabName.trim()) return;

		const eventDetail = {
			name: this.tabName.trim(),
		};

		if (this.isEditMode() && this.tab) {
			this.dispatchEvent(
				new CustomEvent('edit-tab', {
					detail: { id: this.tab.id, ...eventDetail },
					bubbles: true,
				}),
			);
		} else {
			this.dispatchEvent(
				new CustomEvent('add-tab', {
					detail: eventDetail,
					bubbles: true,
				}),
			);
		}

		this.handleClose();
	}

	private handleDeleteClick() {
		this.showDeleteConfirm = true;
	}

	private handleDeleteConfirm() {
		if (!this.tab) return;

		this.dispatchEvent(
			new CustomEvent('delete-tab', {
				detail: { id: this.tab.id },
				bubbles: true,
			}),
		);
		this.handleClose();
	}

	private handleDeleteCancel() {
		this.showDeleteConfirm = false;
	}

	private isFormValid(): boolean {
		return this.tabName.trim().length > 0;
	}

	private handleOverlayClick(e: Event) {
		if ((e.target as HTMLElement).classList.contains('overlay')) {
			this.handleClose();
		}
	}

	render() {
		return html`
			<div class="overlay" @click=${this.handleOverlayClick}>
				<div class="modal">
					<div class="header">
						<h2 class="title">${this.isEditMode() ? 'Edit Tab' : 'Add Tab'}</h2>
						<button class="close-btn" @click=${this.handleClose}>×</button>
					</div>
					<div class="content">
						<div class="form-group">
							<label class="form-label">Name</label>
							<input
								type="text"
								class="form-input"
								.value=${this.tabName}
								@input=${(e: Event) => (this.tabName = (e.target as HTMLInputElement).value)}
								placeholder="Tab name"
								autofocus
							/>
						</div>
					</div>
					<div class="footer">
						<div class="footer-left">
							${this.isEditMode() && this.canDelete
								? html`
										<button class="btn btn-danger" @click=${this.handleDeleteClick}>
											${unsafeSVG(trashIcon)} Delete
										</button>
									`
								: ''}
						</div>
						<div class="footer-right">
							<button class="btn btn-cancel" @click=${this.handleClose}>Cancel</button>
							<button class="btn btn-primary" @click=${this.handleSave} ?disabled=${!this.isFormValid()}>
								${this.isEditMode() ? 'Save' : 'Add Tab'}
							</button>
						</div>
					</div>
				</div>
			</div>
			${this.showDeleteConfirm
				? html`
						<div
							class="confirm-overlay"
							@click=${(e: Event) => {
								if ((e.target as HTMLElement).classList.contains('confirm-overlay')) {
									this.handleDeleteCancel();
								}
							}}
						>
							<div class="confirm-modal">
								<h3 class="confirm-title">Delete Tab</h3>
								<p class="confirm-message">
									Are you sure you want to delete this tab? All widgets in this tab will also be deleted. This action
									cannot be undone.
								</p>
								<div class="confirm-actions">
									<button class="btn btn-cancel" @click=${this.handleDeleteCancel}>Cancel</button>
									<button class="btn btn-danger" @click=${this.handleDeleteConfirm}>
										${unsafeSVG(trashIcon)} Delete
									</button>
								</div>
							</div>
						</div>
					`
				: ''}
		`;
	}
}
