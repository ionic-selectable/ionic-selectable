import { Component, h, Host, ComponentInterface, Method, State, Element } from '@stencil/core';
import { IonicSelectableComponent } from '../ionic-selectable/ionic-selectable.component';

/**
 * @internal
 */
@Component({
  tag: 'ionic-selectable-modal',
  styleUrls: {
    ios: 'ionic-selectable-modal.ios.component.scss',
    md: 'ionic-selectable-modal.md.component.scss',
  },
  scoped: true,
})
export class IonicSelectableModalComponent implements ComponentInterface {
  @Element() public element!: HTMLIonicSelectableModalElement;
  private selectableComponent: IonicSelectableComponent;
  private headerElement: HTMLIonHeaderElement;

  @State() private toggleUpdate: boolean = false;

  public infiniteScrollElement: HTMLIonInfiniteScrollElement;
  public virtualScrollElement: HTMLVirtualScrollElement;
  public contentElement: HTMLIonContentElement;
  /**
   * Rerender the component
   */
  @Method()
  public async update(): Promise<void> {
    this.toggleUpdate = !this.toggleUpdate;
  }

  public connectedCallback(): void {
    const modalElement = document.querySelector('ion-modal');
    this.selectableComponent = modalElement.componentProps.selectableComponent;
  }

  public componentDidLoad(): void {
    this.infiniteScrollElement = this.element.querySelector('ion-infinite-scroll');
    this.virtualScrollElement = this.element.querySelector('ion-virtual-scroll');
    this.contentElement = this.element.querySelector('ion-content');
    this.headerElement = this.element.querySelector('ion-header');
    if (this.selectableComponent.shouldFocusSearchbar) {
      const searchBarElement = this.element.querySelector('ion-searchbar');
      searchBarElement.setFocus();
      // Focus after a delay because focus doesn't work without it.
      setTimeout(() => {
        searchBarElement.setFocus();
      }, 1000);
    }
  }

  private renderItem(item: any): any {
    return (
      <ion-item
        button={true}
        onClick={(): void => this.selectableComponent.selectItem(item)}
        disabled={this.selectableComponent.isItemDisabled(item)}
      >
        {this.selectableComponent.hasTemplateRender && this.selectableComponent.hasTemplateRender('item') ? (
          <span
            ref={element => {
              this.selectableComponent.templateRender(element, {
                type: 'item',
                value: item,
                isItemSelected: this.selectableComponent.isItemSelected(item),
                isItemDisabled: this.selectableComponent.isItemDisabled(item),
              });
            }}
          ></span>
        ) : (
          <ion-label>{this.selectableComponent.getItemText(item)}</ion-label>
        )}
        {this.selectableComponent.hasTemplateRender && this.selectableComponent.hasTemplateRender('itemEnd') && (
          <div
            slot="end"
            ref={element => {
              this.selectableComponent.templateRender(element, {
                type: 'itemEnd',
                value: item,
                isItemSelected: this.selectableComponent.isItemSelected(item),
                isItemDisabled: this.selectableComponent.isItemDisabled(item),
              });
            }}
          ></div>
        )}
        {this.selectableComponent.hasTemplateRender && this.selectableComponent.hasTemplateRender('itemIcon') ? (
          <span
            ref={element => {
              this.selectableComponent.templateRender(element, {
                type: 'itemIcon',
                value: item,
                isItemSelected: this.selectableComponent.isItemSelected(item),
                isItemDisabled: this.selectableComponent.isItemDisabled(item),
              });
            }}
          ></span>
        ) : (
          <ion-icon
            name={this.selectableComponent.isItemSelected(item) ? 'checkmark-circle' : 'radio-button-off'}
            size="small"
            slot={this.selectableComponent.itemIconSlot}
          ></ion-icon>
        )}
      </ion-item>
    );
  }

  private renderHeader(header: any): any {
    return (
      <ion-item-divider color={this.selectableComponent.groupColor}>
        {/* Need ion-label for text ellipsis. */}
        <ion-label>{header}</ion-label>
      </ion-item-divider>
    );
  }

  public render(): void {
    return (
      <Host
        class={{
          'ionic-selectable-modal-is-add-item-template-visible ': this.selectableComponent.isAddItemTemplateVisible,
        }}
      >
        <ion-header>
          {this.selectableComponent.hasTemplateRender && this.selectableComponent.hasTemplateRender('header') ? (
            <div
              ref={element => {
                this.selectableComponent.templateRender(element, {
                  type: 'header',
                });
              }}
            ></div>
          ) : (
            <ion-toolbar color={this.selectableComponent.headerColor}>
              <ion-title>
                {this.selectableComponent.hasTemplateRender && this.selectableComponent.hasTemplateRender('title') ? (
                  <span
                    ref={element => {
                      this.selectableComponent.templateRender(element, {
                        type: 'title',
                      });
                    }}
                  ></span>
                ) : (
                  <span>{this.selectableComponent.titleText}</span>
                )}
              </ion-title>
              <ion-buttons slot={this.selectableComponent.closeButtonSlot}>
                <ion-button onClick={(): void => this.selectableComponent.closeModal()}>
                  {this.selectableComponent.hasTemplateRender &&
                  this.selectableComponent.hasTemplateRender('closeButton') ? (
                    <span
                      ref={element => {
                        this.selectableComponent.templateRender(element, {
                          type: 'closeButton',
                        });
                      }}
                    ></span>
                  ) : (
                    <span>{this.selectableComponent.closeButtonText}</span>
                  )}
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          )}
          {this.selectableComponent.canSearch ||
            (this.selectableComponent.hasTemplateRender && this.selectableComponent.hasTemplateRender('message') && (
              <ion-toolbar>
                <ion-searchbar
                  value={this.selectableComponent.searchText}
                  placeholder={this.selectableComponent.searchPlaceholder}
                  debounce={this.selectableComponent.searchDebounce}
                  cancelButtonIcon={this.selectableComponent.searchCancelButtonIcon}
                  cancelButtonText={this.selectableComponent.searchCancelButtonText}
                  clearIcon={this.selectableComponent.searchClearIcon}
                  inputmode={this.selectableComponent.searchInputmode}
                  searchIcon={this.selectableComponent.searchIcon}
                  showCancelButton={this.selectableComponent.searchShowCancelButton}
                  onIonChange={(event): void => this.selectableComponent.onSearchbarValueChanged(event)}
                ></ion-searchbar>
                {this.selectableComponent.hasTemplateRender && this.selectableComponent.hasTemplateRender('message') && (
                  <div
                    class="ionic-selectable-message"
                    ref={element => {
                      this.selectableComponent.templateRender(element, {
                        type: 'message',
                      });
                    }}
                  ></div>
                )}
              </ion-toolbar>
            ))}
        </ion-header>
        <ion-content>
          {this.selectableComponent.isSearching && (
            <div class="ionic-selectable-spinner">
              <div class="ionic-selectable-spinner-background"></div>
              <ion-spinner></ion-spinner>
            </div>
          )}
          {!this.selectableComponent.hasFilteredItems &&
            this.selectableComponent.hasTemplateRender &&
            this.selectableComponent.hasTemplateRender('searchFail') && (
              <span
                ref={element => {
                  this.selectableComponent.templateRender(element, {
                    type: 'searchFail',
                  });
                }}
              ></span>
            )}
          {!this.selectableComponent.hasFilteredItems &&
            (!this.selectableComponent.hasTemplateRender ||
              !this.selectableComponent.hasTemplateRender('searchFail')) && (
              <div class="ion-margin ion-text-center">{this.selectableComponent.searchFailText}</div>
            )}
          {!this.selectableComponent.hasVirtualScroll && this.selectableComponent.hasFilteredItems && (
            <ion-list>
              {this.selectableComponent.filteredGroups.map(group => {
                return (
                  <ion-item-group>
                    {this.selectableComponent.hasGroups && (
                      <ion-item-divider color={this.selectableComponent.groupColor}>
                        {this.selectableComponent.hasTemplateRender &&
                        this.selectableComponent.hasTemplateRender('group') ? (
                          <span
                            ref={element => {
                              this.selectableComponent.templateRender(element, {
                                type: 'group',
                              });
                            }}
                          ></span>
                        ) : (
                          <ion-label>{group.text}</ion-label>
                        )}
                        {this.selectableComponent.hasTemplateRender &&
                          this.selectableComponent.hasTemplateRender('groupEnd') && (
                            <div
                              ref={element => {
                                this.selectableComponent.templateRender(element, {
                                  type: 'groupEnd',
                                  value: group,
                                });
                              }}
                              slot="end"
                            ></div>
                          )}
                      </ion-item-divider>
                    )}
                    {group.items.map(item => this.renderItem(item))}
                  </ion-item-group>
                );
              })}
            </ion-list>
          )}
          {this.selectableComponent.hasVirtualScroll && this.selectableComponent.hasFilteredItems && (
            <ion-virtual-scroll
              items={this.selectableComponent.filteredGroups[0].items}
              approxHeaderHeight={this.selectableComponent.virtualScrollApproxHeaderHeight}
              approxItemHeight={this.selectableComponent.virtualScrollApproxItemHeight}
              renderItem={(item): void => this.renderItem(item)}
              renderHeader={(header): void => this.renderHeader(header)}
              headerFn={this.selectableComponent.virtualScrollHeaderFn}
            ></ion-virtual-scroll>
          )}
          {this.selectableComponent.hasInfiniteScroll && (
            <ion-infinite-scroll
              threshold={this.selectableComponent.infiniteScrollThreshold}
              onIonInfinite={(): void => this.selectableComponent.getMoreItems()}
            >
              <ion-infinite-scroll-content></ion-infinite-scroll-content>
            </ion-infinite-scroll>
          )}
        </ion-content>
        {this.selectableComponent.isAddItemTemplateVisible && (
          <div
            class="ionic-selectable-add-item-template"
            style={{ top: this.headerElement.offsetHeight + 'px' }}
            ref={element => {
              this.selectableComponent.templateRender(element, {
                type: 'addItem',
                value: this.selectableComponent.itemToAdd,
                isAdd: this.selectableComponent.itemToAdd == null,
              });
            }}
          ></div>
        )}
        {(this.selectableComponent.footerButtonsCount > 0 ||
          (this.selectableComponent.hasTemplateRender && this.selectableComponent.hasTemplateRender('footer'))) && (
          <ion-footer style={{ visibility: this.selectableComponent.isFooterVisible ? 'initial' : 'hidden' }}>
            {this.selectableComponent.hasTemplateRender && this.selectableComponent.hasTemplateRender('footer') ? (
              <div
                ref={element => {
                  this.selectableComponent.templateRender(element, {
                    type: 'footer',
                  });
                }}
              ></div>
            ) : (
              <ion-toolbar>
                <ion-row>
                  {this.selectableComponent.canClear && (
                    <ion-col>
                      <ion-button
                        onClick={(): void => this.selectableComponent.clearItems()}
                        disabled={!(this.selectableComponent.selectedItems.length > 0)}
                        expand="full"
                      >
                        {this.selectableComponent.clearButtonText}
                      </ion-button>
                    </ion-col>
                  )}
                  {this.selectableComponent.canAddItem && (
                    <ion-col>
                      <ion-button onClick={(): void => this.selectableComponent.addItemClick()} expand="full">
                        {this.selectableComponent.addButtonText}
                      </ion-button>
                    </ion-col>
                  )}
                  {(this.selectableComponent.isMultiple ||
                    this.selectableComponent.hasConfirmButton ||
                    this.selectableComponent.canClear) && (
                    <ion-col>
                      <ion-button
                        onClick={(): void => this.selectableComponent.confirmSelection()}
                        disabled={!this.selectableComponent.isConfirmButtonEnabled}
                        expand="full"
                      >
                        {this.selectableComponent.confirmButtonText}
                      </ion-button>
                    </ion-col>
                  )}
                </ion-row>
              </ion-toolbar>
            )}
          </ion-footer>
        )}
      </Host>
    );
  }
}
