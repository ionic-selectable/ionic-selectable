import { Component, Prop, h, Host, ComponentInterface, Element, Event, EventEmitter, Watch, Method, State } from '@stencil/core';
import { CssClassMap, getMode, StyleEventDetail, AnimationBuilder } from '@ionic/core';
import { hostContext, addRippleEffectElement, findItem, findItemLabel, renderHiddenInput, getClassMap } from '../../utils/utils';
import {
  IonicSelectableInfiniteScrolledEvent,
  IonicSelectableSearchingEvent,
  IonicSelectableSearchSuccessedEvent,
  IonicSelectableSearchFailedEvent,
  IonicSelectableSelectedEvent,
  IonicSelectableChangedEvent,
  IonicSelectableItemAddingEvent,
  IonicSelectableClearedEvent,
  IonicSelectableItemsChangedEvent,
  IonicSelectableOpenedEvent,
  IonicSelectableClosedEvent,
  IonicSelectableFocusedEvent,
  IonicSelectableBlurredEvent,
  TemplateRenderFn,
  HasTemplateRenderFn,
} from './ionic-selectable.interfaces.component';

/**
 * @virtualProp {"ios" | "md"} mode - The mode determines which platform styles to use.
 *
 * @part placeholder - The text displayed in the select when there is no value.
 * @part text - The displayed value of the select.
 * @part icon - The select icon container.
 * @part icon-inner - The select icon.
 */
@Component({
  tag: 'ionic-selectable',
  styleUrls: {
    ios: 'ionic-selectable.ios.component.scss',
    md: 'ionic-selectable.md.component.scss',
  },
  shadow: true,
})
export class IonicSelectableComponent implements ComponentInterface {
  @Element() private element!: HTMLIonicSelectableElement;
  private id = this.element.id ? this.element.id : `ionic-selectable-${nextId++}`;
  private isInited = false;
  private isRendered = false;
  private buttonElement?: HTMLButtonElement;
  private modalElement!: HTMLIonModalElement;

  private contentElement: HTMLIonContentElement;
  private infiniteScrollElement: HTMLIonInfiniteScrollElement;
  private virtualScrollElement: HTMLVirtualScrollElement;
  private headerElement: HTMLIonHeaderElement;

  private isChangeInternal = false;
  private virtualItems: any[] = [];
  private groups: Array<{ value: string; text: string; items: any[] }> = [];

  public filteredGroups: Array<{ value: string; text: string; items: any[] }> = [];
  public hasFilteredItems = false;
  public hasObjects = false;
  public hasGroups = false;
  public footerButtonsCount = 0;
  public isSearching = false;
  public isAddItemTemplateVisible = false;
  public isFooterVisible = true;
  public addItemTemplateFooterHeight: string;
  public itemToAdd: any = null;

  @State() public selectedItems: any[] = [];
  @State() private valueItems: any[] = [];
  @State() private itemsToConfirm: any[] = [];
  /**
   * Determines whether Modal is opened.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#isopened).
   *
   * @default false
   * @readonly
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public isOpened = false;

  /**
   * Determines whether the component is disabled.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#isdisabled).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public isDisabled = false;

  /**
   * A placeholder.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#placeholder).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public placeholder?: string | null;

  /**
   * Close button text.
   * The field is only applicable to **iOS** platform, on **Android** only Cross icon is displayed.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#closebuttontext).
   *
   * @default 'Cancel'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public closeButtonText = 'Cancel';

  /**
   * Close button slot. [Ionic slots](https://ionicframework.com/docs/api/buttons) are supported.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#closebuttonslot).
   *
   * @default 'start'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public closeButtonSlot = 'start';

  /**
   * Item icon slot. [Ionic slots](https://ionicframework.com/docs/api/item) are supported.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#itemiconslot).
   *
   * @default 'start'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public itemIconSlot = 'start';

  /**
   * Confirm button text.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#confirmbuttontext).
   *
   * @default 'OK'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public confirmButtonText = 'OK';

  /**
   * Clear button text.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#clearbuttontext).
   *
   * @default 'Clear'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public clearButtonText = 'Clear';

  /**
   * Add button text.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#addbuttontext).
   *
   * @default 'Add'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public addButtonText = 'Add';

  /**
   * The name of the control, which is submitted with the form data.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#name).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public name: string = this.id;

  /**
   * Determines whether multiple items can be selected.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#selectedText).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public selectedText?: string | null;

  /**
   * Determines whether multiple items can be selected.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#ismultiple).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public isMultiple = false;

  /**
   * The value of the component.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#value).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public value?: any | null = null;

  /**
   * Is set to true, the value will be extracted from the itemValueField of the objects.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#shouldStoreItemValue).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public shouldStoreItemValue?: boolean = false;

  /**
   * A list of items.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#items).
   *
   * @default []
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public items: any[] = [];

  /**
   * A list of items to disable.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#disableditems).
   *
   * @default []
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public disabledItems: any[] = [];

  /**
   * Item property to use as a unique identifier, e.g, `'id'`.
   * **Note**: `items` should be an object array.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#itemvaluefield).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public itemValueField: string = null;

  /**
   * Item property to display, e.g, `'name'`.
   * **Note**: `items` should be an object array.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#itemtextfield).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public itemTextField: string = null;

  /**
   * Determines whether Modal should be closed when backdrop is clicked.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#shouldbackdropclose).
   *
   * @default true
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public shouldBackdropClose: boolean;

  /**
   * Modal CSS class.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#modalcssclass).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public modalCssClass: string | string[];

  /**
   * Modal enter animation.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#modalenteranimation).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public modalEnterAnimation: AnimationBuilder = null;

  /**
   * Modal leave animation.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#modalleaveanimation).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public modalLeaveAnimation: AnimationBuilder = null;

  /**
   * Text of [Ionic Label](https://ionicframework.com/docs/api/label).
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#label).
   *
   * @readonly
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public titleText: string = null;

  /**
   *
   * Group property to use as a unique identifier to group items, e.g. `'country.id'`.
   * **Note**: `items` should be an object array.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#groupvaluefield).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public groupValueField: string = null;

  /**
   * Group property to display, e.g. `'country.name'`.
   * **Note**: `items` should be an object array.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#grouptextfield).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public groupTextField: string = null;

  /**
   * Determines whether Ionic [InfiniteScroll](https://ionicframework.com/docs/api/infinite-scroll) is enabled.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hasinfinitescroll).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public hasInfiniteScroll = false;

  /**
   * The threshold distance from the bottom of the content to call the infinite output event when scrolled.
   * Use the value 100px when the scroll is within 100 pixels from the bottom of the page.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#infinite-scroll).
   *
   * @default '100px'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public infiniteScrollThreshold = '100px';

  /**
   * Determines whether VirtualScroll is enabled.
   * (CURRENTLY DISABLED - IN DEVELOPMENT)
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hasvirtualscroll).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public hasVirtualScroll = false;

  /**
   * See Ionic VirtualScroll [approxHeaderHeight](https://ionicframework.com/docs/api/virtual-scroll).
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#virtualscrollheaderfn).
   *
   * @default 30
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public virtualScrollApproxHeaderHeight = 30;

  /**
   * See Ionic VirtualScroll [approxItemHeight](https://ionicframework.com/docs/api/virtual-scroll).
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#virtualscrollheaderfn).
   *
   * @default 45
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public virtualScrollApproxItemHeight = 45;

  /**
   * Determines whether Confirm button is visible for single selection.
   * By default Confirm button is visible only for multiple selection.
   * **Note**: It is always true for multiple selection and cannot be changed.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hasconfirmbutton).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public hasConfirmButton: boolean = false;

  /**
   * Determines whether to allow adding items.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#canadditem).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public canAddItem: boolean = false;

  /**
   * Determines whether to show Clear button.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#canclear).
   * @default false
   * @memberof IonicSelectableComponent
   */
  // Pending - @HostBinding('class.ionic-selectable-can-clear')
  @Prop({ mutable: true }) public canClear: boolean = false;

  /**
   * Determines whether to show [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#cansearch).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public canSearch = false;

  /**
   * Determines the search is delegate to event, and not handled internally.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#cansearch).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public shouldDelegateSearchToEvent = false;

  /**
   * How long, in milliseconds, to wait to filter items or to trigger `onSearch` event after each keystroke.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#searchdebounce).
   *
   * @default 250
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public searchDebounce: number = 250;

  /**
   * A placeholder for [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#searchplaceholder).
   *
   * @default 'Search'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public searchPlaceholder = 'Search';

  /**
   * Text in [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#searchtext).
   *
   * @default ''
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public searchText = '';

  /**
   * Text to display when no items have been found during search.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#searchfailtext).
   *
   * @default 'No items found.'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public searchFailText = 'No items found.';

  /**
   * Determines whether Searchbar should receive focus when Modal is opened.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#shouldfocussearchbar).
   *
   * @default false
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public shouldFocusSearchbar = false;

  /**
   * Determines whether user has typed anything in [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hassearchtext).
   *
   * @default false
   * @readonly
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public hasSearchText: boolean;

  /**
   * Set the cancel button icon of the [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * Only applies to md mode. Defaults to "arrow-back-sharp".
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hassearchtext).
   *
   * @default 'arrow-back-sharp'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public searchCancelButtonIcon: string = 'arrow-back-sharp';

  /**
   * Set the the cancel button text of the [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * Only applies to ios mode.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hassearchtext).
   *
   * @default 'Cancel'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public searchCancelButtonText: string = 'Cancel';

  /**
   * Set the clear icon of the [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * Defaults to "close-circle" for ios and "close-sharp" for md.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hassearchtext).
   *
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public searchClearIcon: string = getMode() === 'ios' ? 'close-circle' : 'close-sharp';

  /**
   * A hint to the browser for which keyboard to display.
   * Possible values: "none", "text", "tel", "url", "email", "numeric", "decimal", and "search".
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hassearchtext).
   * @default 'none'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public searchInputmode: 'none' | 'text' | 'tel' | 'url' | 'email' | 'numeric' | 'decimal' | 'search' = 'none';

  /**
   * The icon to use as the search icon in the [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * Defaults to "search-outline" in ios mode and "search-sharp" in md mode.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hassearchtext).
   * @default 'none'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public searchIcon: string = getMode() === 'ios' ? 'search-outline' : 'search-sharp';

  /**
   * Sets the behavior for the cancel button of the [Searchbar](https://ionicframework.com/docs/api/searchbar).
   * Defaults to "never".
   * Setting to "focus" shows the cancel button on focus.
   * Setting to "never" hides the cancel button.
   * Setting to "always" shows the cancel button regardless of focus state.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hassearchtext).
   * @default 'none'
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public searchShowCancelButton: 'always' | 'focus' | 'never' = 'never';

  /**
   * Determines whether Confirm button is enabled.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#isconfirmbuttonenabled).
   *
   * @default true
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public isConfirmButtonEnabled: boolean = true;

  /**
   * Header color. [Ionic colors](https://ionicframework.com/docs/theming/advanced#colors) are supported.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#headercolor).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public headerColor: string = null;

  /**
   * Group color. [Ionic colors](https://ionicframework.com/docs/theming/advanced#colors) are supported.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#groupcolor).
   *
   * @default null
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public groupColor: string = null;

  /**
   * Fires when the user has scrolled to the end of the list.
   * **Note**: `hasInfiniteScroll` has to be enabled.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#oninfinitescroll).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public infiniteScrolled: EventEmitter<IonicSelectableInfiniteScrolledEvent<string>>;

  /**
   * Fires when the user is typing in Searchbar.
   * **Note**: `canSearch` and `shouldDelegateSearchToEvent` has to be enabled.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onsearch).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public searching: EventEmitter<IonicSelectableSearchingEvent<string>>;

  /**
   * Fires when no items have been found.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onsearchfail).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public searchFailed: EventEmitter<IonicSelectableSearchFailedEvent<string>>;

  /**
   * Fires when some items have been found.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onsearchsuccess).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public searchSuccessed: EventEmitter<IonicSelectableSearchSuccessedEvent<string>>;

  /**
   * Fires when Add item button has been clicked.
   * When the button has been clicked `ionicSelectableAddItemTemplate` will be shown. Use the template to create
   * a form to add item.
   * **Note**: `canAddItem` has to be enabled.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#itemAdding).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public itemAdding: EventEmitter<IonicSelectableItemAddingEvent<any[]>>;

  /**
   * Fires when Clear button has been clicked.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onclear).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public cleared: EventEmitter<IonicSelectableClearedEvent<any[]>>;

  /**
   * Fires when item/s has been selected and Modal closed.
   * if isMultiple is set to true 'value' is an array else is a object
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onChanged).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public changed!: EventEmitter<IonicSelectableChangedEvent<any[]>>;

  /**
   * Fires when items has changed.
   * if isMultiple is set to true 'value' is an array else is a object
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onChanged).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public itemsChanged!: EventEmitter<IonicSelectableItemsChangedEvent<any[]>>;

  /**
   * Fires when an item has been selected or unselected.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onselect).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public selected: EventEmitter<IonicSelectableSelectedEvent<any>>;

  /**
   * Fires when Modal has been opened.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onopen).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public opened: EventEmitter<IonicSelectableOpenedEvent<any[]>>;

  /**
   * Fires when Modal has been closed.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onclose).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public closed: EventEmitter<IonicSelectableClosedEvent<any[]>>;

  /**
   * Fires when has focus
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onFocused).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public focused!: EventEmitter<IonicSelectableFocusedEvent<any[]>>;

  /**
   * Fires when loses focus.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#onBlurred).
   *
   * @memberof IonicSelectableComponent
   */
  @Event() public blurred!: EventEmitter<IonicSelectableBlurredEvent<any[]>>;

  /**
   * Emitted when the styles change.
   * @internal
   */
  @Event() public ionStyle!: EventEmitter<StyleEventDetail>;

  /**
   * NOTE: only Vanilla JS API.
   */
  @Prop({ mutable: true }) public templateRender?: TemplateRenderFn;

  /**
   * NOTE: only Vanilla JS API.
   */
  @Prop({ mutable: true }) public hasTemplateRender?: HasTemplateRenderFn;

  /**
   * See Ionic VirtualScroll [headerFn](https://ionicframework.com/docs/api/virtual-scroll).
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#virtualscrollheaderfn).
   *
   * @memberof IonicSelectableComponent
   */
  @Prop({ mutable: true }) public virtualScrollHeaderFn: any = () => null;

  @Watch('shouldStoreItemValue')
  protected onShouldStoreItemValueChanged(value: boolean): void {
    if (!value && !this.hasObjects) {
      throw new Error(`If items contains primitive elements, shouldStoreItemValue must be null or true: ${this.element.id}`);
    }
  }

  @Watch('itemValueField')
  protected onItemValueFieldChanged(value: string): void {
    if (this.hasObjects && this.isNullOrWhiteSpace(value)) {
      throw new Error(`If items contains object elements, itemValueField must be non null or non whitespace : ${this.element.id}`);
    } else if (!this.hasObjects && !this.isNullOrWhiteSpace(value)) {
      throw new Error(`If items contains primitive elements, itemValueField must be null: ${this.element.id}`);
    }
  }

  @Watch('itemTextField')
  protected onItemTextFieldChanged(value: string): void {
    if (this.hasObjects && this.isNullOrWhiteSpace(value)) {
      throw new Error(`If items contains object elements, itemTextField must be non null or non whitespace : ${this.element.id}`);
    } else if (!this.hasObjects && !this.isNullOrWhiteSpace(value)) {
      throw new Error(`If items contains primitive elements, itemTextField must be null: ${this.element.id}`);
    }
  }

  @Watch('items')
  protected onItemsChanged(value: []): void {
    this.setItems(value);
  }

  @Watch('isDisabled')
  @Watch('placeholder')
  protected onDisabledChanged(): void {
    this.emitStyle();
  }

  @Watch('value')
  protected onValueChanged(newValue: any | any[]): void {
    if (!this.isChangeInternal) {
      this.emitStyle();
      if (this.isInited) {
        this.setValue(newValue, false);
      }
    }
    this.isChangeInternal = false;
  }

  @Watch('searchText')
  protected onSearchTextChanged(newValue: string): void {
    if (!this.isChangeInternal) {
      if (this.isOpened) {
        this.startSearch();
        this.filterItems(newValue, false);
        this.endSearch();
      }
    }
    this.isChangeInternal = false;
  }

  @Watch('isMultiple')
  @Watch('canClear')
  @Watch('canAddItem')
  @Watch('hasConfirmButton')
  protected onIsMultipleChanged(): void {
    this.countFooterButtons();
  }

  @Watch('disabledItems')
  protected onDisabledItemsChanged(): void {
    //
  }

  public async connectedCallback(): Promise<void> {
    this.emitStyle();
  }

  public componentWillLoad(): void {
    this.setItems(this.items);
    this.setValue(this.value);
    this.countFooterButtons();
    this.isInited = true;
  }

  /**
   * Determines whether any item has been selected.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hasvalue).
   *
   * @returns A boolean determining whether any item has been selected.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async hasValue(): Promise<boolean> {
    return this.parseValue() !== '';
  }

  /**
   * Opens Modal.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#open).
   *
   * @returns Promise that resolves when Modal has been opened.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async open(): Promise<void> {
    if (this.isDisabled || this.isOpened) {
      return Promise.reject(`IonicSelectable is disabled or already opened: ${this.element.id}`);
    }

    const label = findItemLabel(this.element);
    if (label && !this.titleText) {
      this.titleText = label.textContent;
    }

    this.modalElement.isOpen = true;
    this.infiniteScrollElement = this.modalElement.querySelector('ion-infinite-scroll');
    this.virtualScrollElement = this.modalElement.querySelector('virtual-scroll'); //this.modalElement.querySelector('ion-virtual-scroll');
    //TODO: implement virtual scroll
    if(this.hasVirtualScroll){
      this.virtualScrollElement.addEventListener('update', (event: any) => {
        console.log('update')
        this.virtualItems = event.detail;
      });
    }
    this.contentElement = this.modalElement.querySelector('ion-content');
    this.headerElement = this.modalElement.querySelector('ion-header');
    this.setItems(this.items);
    this.isOpened = true;
    this.setFocus();
    this.whatchModalEvents();
    this.emitOpened();
    return Promise.resolve();
  }

  /**
   * Closes Modal.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#close).
   *
   * @returns Promise that resolves when Modal has been closed.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async close(): Promise<void> {
    if (this.isDisabled || !this.isOpened) {
      return Promise.reject(`IonicSelectable is disabled or already closed: ${this.element.id}`);
    }

    this.modalElement.isOpen = false;
    this.itemToAdd = null;
    this.hideAddItemTemplate();

    if (!this.shouldDelegateSearchToEvent) {
      this.setHasSearchText('');
    }

    this.emitClosed();

    return Promise.resolve();
  }

  /**
   * Return a list of items that are selected and awaiting confirmation by user, when he has clicked Confirm button.
   * After the user has clicked Confirm button items to confirm are cleared.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#itemstoconfirm).
   *
   * @returns a promise whit de list of items that are selected and awaiting confirmation by user
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async getItemsToConfirm(): Promise<any[]> {
    return this.itemsToConfirm;
  }

  /**
   * Confirms selected items by updating value.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#confirm).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async confirm(): Promise<void> {
    if (this.isMultiple) {
      this.setValue(this.selectedItems);
    } else if (this.hasConfirmButton || (this.hasTemplateRender && this.hasTemplateRender('footer'))) {
      this.setValue(this.selectedItems[0] || null);
    }
  }

  /**
   * Clears value.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#clear).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async clear(): Promise<void> {
    this.clearItems();
  }

  /**
   * Enables infinite scroll.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#enableinfinitescroll).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async enableInfiniteScroll(): Promise<void> {
    if (!this.hasInfiniteScroll) {
      return;
    }

    this.infiniteScrollElement.disabled = false;
  }

  /**
   * Disables infinite scroll.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#disableinfinitescroll).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async disableInfiniteScroll(): Promise<void> {
    if (!this.hasInfiniteScroll) {
      return;
    }

    this.infiniteScrollElement.disabled = true;
  }

  /**
   * Ends infinite scroll.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#endinfinitescroll).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async endInfiniteScroll(): Promise<void> {
    if (!this.hasInfiniteScroll) {
      return;
    }
    this.infiniteScrollElement.complete();
    this.setItems(this.items);
  }

  /**
   * Scrolls to the top of Modal content.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#scrolltotop).
   *
   * @returns Promise that resolves when scroll has been completed.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async scrollToTop(): Promise<any> {
    if (!this.isOpened) {
      return Promise.reject(`IonicSelectable content cannot be scrolled: ${this.element.id}`);
    }
    await this.contentElement.scrollToTop();
    return Promise.resolve();
  }

  /**
   * Scrolls to the bottom of Modal content.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#scrolltobottom).
   *
   * @returns Promise that resolves when scroll has been completed.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async scrollToBottom(): Promise<any> {
    if (!this.isOpened) {
      return Promise.reject(`IonicSelectable content cannot be scrolled: ${this.element.id}`);
    }
    await this.contentElement.scrollToBottom();
    return Promise.resolve();
  }

  /**
   * Starts search process by showing Loading spinner.
   * Use it together with `onSearch` event to indicate search start.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#startsearch).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async startSearch(): Promise<void> {
    if (this.isDisabled) {
      return;
    }

    this.showLoading();
  }

  /**
   * Ends search process by hiding Loading spinner and refreshing items.
   * Use it together with `onSearch` event to indicate search end.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#endsearch).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async endSearch(): Promise<void> {
    if (this.isDisabled) {
      return;
    }

    this.hideLoading();

    // Refresh items manually.
    // Pending - this.setItems(this.items);
    this.emitOnSearchSuccessedOrFailed(this.hasFilteredItems);
  }

  /**
   * Shows Loading spinner.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#showloading).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async showLoading(): Promise<void> {
    if (this.isDisabled) {
      return;
    }

    this.isSearching = true;
  }

  /**
   * Hides Loading spinner.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hideloading).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async hideLoading(): Promise<void> {
    if (this.isDisabled) {
      return;
    }

    this.isSearching = false;
  }

  /**
   * Adds item.
   * **Note**: If you want an item to be added to the original array as well use two-way data binding syntax on `[(items)]` field.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#additem).
   *
   * @param item Item to add.
   * @returns Promise that resolves when item has been added.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async addItem(item: any): Promise<any> {
    // Adding item triggers onItemsChange.
    // Return a promise that resolves when onItemsChange finishes.
    // We need a promise or user could do something after item has been added,
    // e.g. use search() method to find the added item.
    this.items.push(item);
    this.setItems(this.items);

    return Promise.resolve();
  }

  /**
   * Deletes item.
   * **Note**: If you want an item to be deleted from the original array as well use two-way data binding syntax on `[(items)]` field.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#deleteitem).
   *
   * @param item Item to delete.
   * @returns Promise that resolves when item has been deleted.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async deleteItem(item: any): Promise<any> {
    let hasValueChanged = false;

    // Remove deleted item from selected items.
    if (this.selectedItems) {
      this.selectedItems = this.selectedItems.filter(_item => this.getItemValue(item) !== this.getStoredItemValue(_item));
    }

    // Remove deleted item from value.
    if (this.value) {
      if (this.isMultiple) {
        const values = this.value.filter(value => {
          return value.id !== item.id;
        });

        if (values.length !== this.value.length) {
          this.value = values;
          hasValueChanged = true;
        }
      } else {
        if (item === this.value) {
          this.value = null;
          hasValueChanged = true;
        }
      }
    }

    if (hasValueChanged) {
      this.emitChanged();
    }

    // Remove deleted item from list.
    const items = this.items.filter(_item => {
      return _item.id !== item.id;
    });

    // Refresh items on parent component.
    // Pending - this.itemsChange.emit(items);

    // Refresh list.
    this.setItems(items);

    return Promise.resolve();
  }

  /**
   * Selects or deselects all or specific items.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#toggleitems).
   *
   * @param isSelect Determines whether to select or deselect items.
   * @param [items] Items to toggle. If items are not set all items will be toggled.
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async toggleItems(isSelect: boolean, items?: any[]): Promise<void> {
    if (isSelect) {
      const hasItems = items && items.length;
      let itemsToToggle = this.groups.reduce((allItems, group) => {
        return allItems.concat(group.items);
      }, []);

      // Don't allow to select all items in single mode.
      if (!this.isMultiple && !hasItems) {
        itemsToToggle = [];
      }

      // Toggle specific items.
      if (hasItems) {
        itemsToToggle = itemsToToggle.filter(itemToToggle => {
          return (
            items.find(item => {
              return this.getItemValue(itemToToggle) === this.getItemValue(item);
            }) !== undefined
          );
        });

        // Take the first item for single mode.
        if (!this.isMultiple) {
          itemsToToggle.splice(0, 1);
        }
      }

      itemsToToggle.forEach(item => {
        this.addSelectedItem(item);
      });
    } else {
      const hasItems = items && items.length;
      if (hasItems) {
        items.forEach(item => {
          this.deleteSelectedItem(item);
        });
      } else {
        this.selectedItems = [];
      }
    }

    this.itemsToConfirm = [...this.selectedItems];
  }

  /**
   * Shows `ionicSelectableAddItemTemplate`.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#showadditemtemplate).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async showAddItemTemplate(): Promise<void> {
    this.toggleAddItemTemplate(true);
  }

  /**
   * Hides `ionicSelectableAddItemTemplate`.
   * See more on [GitHub](https://github.com/ionic-selectable/ionic-selectable/wiki#hideadditemtemplate).
   *
   * @memberof IonicSelectableComponent
   */
  @Method()
  public async hideAddItemTemplate(): Promise<void> {
    // Clean item to add as it's no longer needed once Add Item Modal has been closed.
    this.itemToAdd = null;
    this.toggleAddItemTemplate(false);
  }

  public clearItems(): void {
    this.setValue(null);
    this.emitCleared();
  }

  public closeModal(): void {
    this.close();
  }

  public addItemClick(): void {
    if (this.hasTemplateRender && this.hasTemplateRender('addItem')) {
      this.showAddItemTemplate();
    } else {
      this.emitItemAdding();
    }
  }

  public onSearchbarValueChanged(event: CustomEvent): void {
    this.startSearch();
    this.filterItems(event.detail.value);
    this.endSearch();
  }

  public isItemSelected(item: any): boolean {
    return (
      this.selectedItems.find(selectedItem => {
        return this.getItemValue(item) === this.getStoredItemValue(selectedItem);
      }) !== undefined
    );
  }

  public isItemDisabled(item: any): boolean {
    if (!this.disabledItems) {
      return;
    }

    return this.disabledItems.some(_item => {
      return this.getItemValue(_item) === this.getItemValue(item);
    });
  }

  public selectItem(item: any): void {
    const isItemSelected = this.isItemSelected(item);
    if (this.isMultiple) {
      if (isItemSelected) {
        this.deleteSelectedItem(item);
      } else {
        this.addSelectedItem(item);
      }

      this.itemsToConfirm = [...this.selectedItems];

      // Emit onSelect event after setting items to confirm so they could be used inside the event.
      this.emitSelected(item, !isItemSelected);
    } else {
      if (this.hasConfirmButton /* || this.footerTemplate*/) {
        // Don't close Modal and keep track on items to confirm.
        // When footer template is used it's up to developer to close Modal.
        this.selectedItems = [];

        if (isItemSelected) {
          this.deleteSelectedItem(item);
        } else {
          this.addSelectedItem(item);
        }

        this.itemsToConfirm = [...this.selectedItems];

        // Emit onSelect event after setting items to confirm so they could be used inside the event.
        this.emitSelected(item, !isItemSelected);
      } else {
        if (!isItemSelected) {
          this.selectedItems = [];
          this.addSelectedItem(item);

          // Emit onSelect before onChange.
          this.emitSelected(item, true);

          this.setValue(item);
        }

        this.close();
      }
    }
  }

  public confirmSelection(): void {
    this.confirm();
    this.close();
  }

  public getMoreItems(): void {
    this.emitIonInfiniteScrolled();
  }

  private setValue(value: any | any[], isChangeInternal = true): void {
    this.isChangeInternal = isChangeInternal;
    if (value) {
      // If type is string convert to object
      value = typeof value === 'string' ? JSON.parse((value as string).replace(/\'/gi, '"')) : value;
      const isArray = Array.isArray(value);
      if (!isArray) {
        value = [value];
      }

      if (this.isMultiple && !isArray) {
        throw new Error(`If isMultiple is set to true, value must be array: ${this.element.id}`);
      }
      if (!this.isMultiple && isArray) {
        throw new Error(`If isMultiple is set to false, value must be object: ${this.element.id}`);
      }
      this.valueItems = [];
      (value as []).forEach(_item => {
        if (this.shouldStoreItemValue && typeof _item === 'object') {
          throw new Error(`If shouldStoreItemValue is set to true, value must be primitive: ${this.element.id}`);
        } else if (!this.shouldStoreItemValue && typeof _item !== 'object') {
          throw new Error(`If shouldStoreItemValue is set to false, value must be object: ${this.element.id}`);
        }
        const itemFind = this.items.find(item => this.getItemValue(item) === this.getStoredItemValue(_item));
        if (itemFind) {
          this.valueItems.push(this.getItem(itemFind));
        }
      });
      if (!this.isMultiple) {
        this.valueItems = (this.valueItems as []).pop();
        this.selectedItems = [this.valueItems];
      } else {
        this.selectedItems = [...this.valueItems];
      }
      if (this.isChangeInternal) {
        this.value = this.valueItems;
      }
    } else {
      this.valueItems = [];
      this.selectedItems = [];
      if (this.isChangeInternal) {
        this.value = this.isMultiple ? [] : null;
      }
    }
    this.itemsToConfirm = [];
    if (this.isInited) {
      this.emitChanged();
    }
  }

  private setItems(items: any[]): void {
    if (!Array.isArray(items)) {
      throw new Error(`items must be array: ${this.element.id}`);
    }

    this.items.forEach(item => {
      if (typeof item === 'object') {
        this.hasObjects = true;
      }
    });

    // If items contains primitive elements, isValuePrimitive is set to true
    if (!this.hasObjects) {
      this.shouldStoreItemValue = true;
    }

    this.onItemValueFieldChanged(this.itemValueField);
    this.onItemTextFieldChanged(this.itemTextField);
    this.onShouldStoreItemValueChanged(this.shouldStoreItemValue);

    // Grouping is supported for objects only.
    // Ionic VirtualScroll has it's own implementation of grouping.
    this.hasGroups = Boolean(this.hasObjects && (this.groupValueField || this.groupTextField) && !this.hasVirtualScroll);

    /* It's important to have an empty starting group with empty items (groups[0].items),
     * because we bind to it when using VirtualScroll.
     * See https://github.com/ionic-selectable/ionic-selectable/issues/70.
     */
    let groups: any[] = [
      {
        items: items || [],
      },
    ];
    if (items && items.length) {
      if (this.hasGroups) {
        groups = [];

        items.forEach(item => {
          const groupValue = this.getPropertyValue(item, this.groupValueField || this.groupTextField);
          const group = groups.find(_group => _group.value === groupValue);

          if (group) {
            group.items.push(item);
          } else {
            groups.push({
              value: groupValue,
              text: this.getPropertyValue(item, this.groupTextField),
              items: [item],
            });
          }
        });
      }
    }
    this.groups = groups;
    this.filteredGroups = this.groups;
    this.hasFilteredItems = !this.areGroupsEmpty(this.filteredGroups);
    if (this.hasVirtualScroll) {
      // Rerender Virtual Scroll List After Adding New Data
      this.virtualScrollElement.list = this.filteredGroups[0].items;
      this.virtualScrollElement?.setInfinateOn();
    }
    if (this.isInited) {
      this.emitItemsChanged();
    }
  }

  private filterItems(searchText: string, isChangeInternal = true): void {
    this.isChangeInternal = isChangeInternal;
    this.setHasSearchText(searchText);
    if (this.shouldDelegateSearchToEvent) {
      // Delegate filtering to the event.
      this.emitSearching();
    } else {
      // Default filtering.
      let groups = [];

      if (this.searchText === '') {
        groups = this.groups;
      } else {
        this.groups.forEach(group => {
          const items = group.items.filter(item => {
            const itemText = (this.itemTextField ? item[this.itemTextField] : item).toString().toLowerCase();
            return itemText.indexOf(this.searchText.trim().toLowerCase()) !== -1;
          });

          if (items.length) {
            groups.push({
              value: group.value,
              text: group.text,
              items: items,
            });
          }
        });

        // No items found.
        if (!groups.length) {
          groups.push({
            items: [],
          });
        }
      }

      this.filteredGroups = groups;
      this.hasFilteredItems = !this.areGroupsEmpty(groups);
      this.emitOnSearchSuccessedOrFailed(this.hasFilteredItems);
    }
  }

  private addSelectedItem(item: any): void {
    const exist = this.selectedItems.find(_item => this.getItemValue(item) === this.getStoredItemValue(_item));
    if (!exist) {
      this.selectedItems.push(this.getItem(item));
    }
  }

  private deleteSelectedItem(item: any) {
    let itemToDeleteIndex;

    this.selectedItems.forEach((selectedItem, itemIndex) => {
      if (this.getItemValue(item) === this.getStoredItemValue(selectedItem)) {
        itemToDeleteIndex = itemIndex;
      }
    });
    this.selectedItems.splice(itemToDeleteIndex, 1);
  }

  private getItem(item: any): any {
    if (!this.hasObjects) {
      return item;
    }
    return this.shouldStoreItemValue ? item[this.itemValueField] : item;
  }

  private getItemValue(item: any): any {
    if (!this.hasObjects) {
      return item;
    }

    return item[this.itemValueField];
  }

  private getStoredItemValue(item: any): any {
    if (!this.hasObjects) {
      return item;
    }

    return this.shouldStoreItemValue ? item : item[this.itemValueField];
  }

  private toggleAddItemTemplate(isVisible: boolean): void {
    // It should be possible to show/hide the template regardless
    // - canAddItem or canSaveItem parameters, so we could implement some
    // - custom behavior. E.g. adding item when search fails using onSearchFail event.
    if (this.hasTemplateRender && this.hasTemplateRender('addItem')) {
      // To make SaveItemTemplate visible we just position it over list using CSS.
      // We don't hide list with *ngIf or [hidden] to prevent its scroll position.
      this.isAddItemTemplateVisible = isVisible;
      this.isFooterVisible = !isVisible;
    }
  }

  private emitSelected(item: any, isSelected: boolean): void {
    this.selected.emit(new IonicSelectableSelectedEvent(item, isSelected, this.element));
  }

  private emitChanged(): void {
    this.changed.emit(new IonicSelectableChangedEvent(this.valueItems, this.element));
  }

  private emitOpened(): void {
    this.opened.emit(new IonicSelectableOpenedEvent(this.valueItems, this.element));
  }

  private emitClosed(): void {
    this.closed.emit(new IonicSelectableClosedEvent(this.valueItems, this.element));
  }

  private emitCleared(): void {
    this.cleared.emit(new IonicSelectableClearedEvent(this.selectedItems, this.element));
  }

  private emitItemAdding(): void {
    this.itemAdding.emit(new IonicSelectableItemAddingEvent(this.valueItems, this.element));
  }

  private emitItemsChanged(): void {
    this.itemsChanged.emit({ component: this.element, value: this.items });
  }

  private emitSearching(): void {
    this.searching.emit(new IonicSelectableSearchingEvent(this.searchText, this.element));
  }

  private emitIonInfiniteScrolled(): void {
    this.infiniteScrolled.emit(new IonicSelectableInfiniteScrolledEvent(this.searchText, this.element));
  }

  private emitOnSearchSuccessedOrFailed(isSuccess: boolean): void {
    if (isSuccess) {
      this.searchSuccessed.emit(new IonicSelectableSearchSuccessedEvent(this.searchText, this.element));
    } else {
      this.searchFailed.emit(new IonicSelectableSearchFailedEvent(this.searchText, this.element));
    }
  }

  private isNullOrWhiteSpace(value: any): boolean {
    if (value === null || value === undefined) {
      return true;
    }

    // Convert value to string in case if it's not.
    return value.toString().replace(/\s/g, '').length < 1;
  }

  public setHasSearchText(searchText: string): void {
    this.hasSearchText = !this.isNullOrWhiteSpace(searchText);
    if (this.hasSearchText) {
      this.searchText = searchText.trim();
    } else {
      this.searchText = '';
    }
  }

  private countFooterButtons(): void {
    let footerButtonsCount = 0;

    if (this.canClear) {
      footerButtonsCount++;
    }

    if (this.isMultiple || this.hasConfirmButton) {
      footerButtonsCount++;
    }

    if (this.canAddItem) {
      footerButtonsCount++;
    }

    this.footerButtonsCount = footerButtonsCount;
  }

  private areGroupsEmpty(groups: any[]): boolean {
    return (
      groups.length === 0 ||
      groups.every(group => {
        return !group.items || group.items.length === 0;
      })
    );
  }

  public getItemText(item: any): string {
    if (!this.hasObjects) {
      return item ?? '';
    }
    return this.getPropertyValue(item, this.itemTextField);
  }

  private getPropertyValue(object: any, property: string): any {
    if (!property) {
      return '';
    }

    return property.split('.').reduce((_object, _property) => {
      return _object ? _object[_property] : null;
    }, object);
  }

  private parseValue(): any {
    return JSON.stringify(this.valueItems);
  }

  private generateText(): string {
    if (Array.isArray(this.valueItems)) {
      return this.valueItems
        .map(_item => {
          const itemFind = this.items.find(item => this.getItemValue(item) === this.getStoredItemValue(_item));
          return itemFind ? this.getItemText(itemFind) : '';
        })
        .filter(opt => opt !== null)
        .join(', ');
    } else {
      const itemFind = this.items.find(item => this.getItemValue(item) === this.getStoredItemValue(this.valueItems));
      return itemFind ? this.getItemText(itemFind) : '';
    }
  }

  private getText(): string {
    const selectedText = this.selectedText;
    if (selectedText != null && selectedText !== '') {
      return selectedText;
    }
    return this.generateText();
  }

  private async emitStyle(): Promise<void> {
    this.ionStyle.emit({
      'interactive': true,
      'ionic-selectable': true,
      'has-placeholder': this.placeholder != null,
      'has-value': await this.hasValue(),
      'interactive-disabled': this.isDisabled,
      'ionic-selectable-is-disabled': this.isDisabled,
    });
  }

  private whatchModalEvents(): void {
    this.modalElement.onDidDismiss().then(event => {
      this.isOpened = false;
      this.setFocus();
      this.itemsToConfirm = [];

      // Closed by clicking on backdrop outside modal.
      if (event.role === 'backdrop') {
        this.emitClosed();
      }
    });
  }

  private setFocus(): void {
    if (this.buttonElement) {
      this.buttonElement.focus();
    }
  }

  private onClick = async (): Promise<void> => {
    this.setFocus();
    this.open();
  };

  private onFocus = (): void => {
    this.focused.emit();
  };

  private onBlur = (): void => {
    this.blurred.emit();
  };

  private renderItem(item: any): any {
    return (
      <ion-item button={true} onClick={(): void => this.selectItem(item)} disabled={this.isItemDisabled(item)}>
        {this.hasTemplateRender && this.hasTemplateRender('item') ? (
          <span
            ref={element => {
              this.templateRender(element, {
                type: 'item',
                value: item,
                isItemSelected: this.isItemSelected(item),
                isItemDisabled: this.isItemDisabled(item),
              });
            }}
          ></span>
        ) : (
          <ion-label>{this.getItemText(item)}</ion-label>
        )}
        {this.hasTemplateRender && this.hasTemplateRender('itemEnd') && (
          <div
            slot="end"
            ref={element => {
              this.templateRender(element, {
                type: 'itemEnd',
                value: item,
                isItemSelected: this.isItemSelected(item),
                isItemDisabled: this.isItemDisabled(item),
              });
            }}
          ></div>
        )}
        {this.hasTemplateRender && this.hasTemplateRender('itemIcon') ? (
          <span
            ref={element => {
              this.templateRender(element, {
                type: 'itemIcon',
                value: item,
                isItemSelected: this.isItemSelected(item),
                isItemDisabled: this.isItemDisabled(item),
              });
            }}
          ></span>
        ) : (
          <ion-icon name={this.isItemSelected(item) ? 'checkmark-circle' : 'radio-button-off'} size="small" slot={this.itemIconSlot}></ion-icon>
        )}
      </ion-item>
    );
  }

/*   private renderHeader(header: any): any {
    return (
      <ion-item-divider color={this.groupColor}>
        <ion-label>{header}</ion-label>
      </ion-item-divider>
    );
  }
 */

  private renderContent() {
    return (
      <div style={{ width: '100%' }}>
        {this.isSearching && (
          <div class="ionic-selectable-spinner">
            <div class="ionic-selectable-spinner-background"></div>
            <ion-spinner></ion-spinner>
          </div>
        )}
        {!this.hasFilteredItems && this.hasTemplateRender && this.hasTemplateRender('searchFail') && (
          <span
            ref={element => {
              this.templateRender(element, {
                type: 'searchFail',
              });
            }}
          ></span>
        )}
        {!this.hasFilteredItems && (!this.hasTemplateRender || !this.hasTemplateRender('searchFail')) && <div class="ion-margin ion-text-center">{this.searchFailText}</div>}
        {!this.hasVirtualScroll && this.hasFilteredItems && (
          <ion-list>
            {this.filteredGroups.map(group => {
              return (
                <ion-item-group>
                  {this.hasGroups && (
                    <ion-item-divider color={this.groupColor}>
                      {this.hasTemplateRender && this.hasTemplateRender('group') ? (
                        <span
                          ref={element => {
                            this.templateRender(element, {
                              type: 'group',
                            });
                          }}
                        ></span>
                      ) : (
                        <ion-label>{group.text}</ion-label>
                      )}
                      {this.hasTemplateRender && this.hasTemplateRender('groupEnd') && (
                        <div
                          ref={element => {
                            this.templateRender(element, {
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
        {this.hasVirtualScroll && this.hasFilteredItems && (
          /* <ion-virtual-scroll
            items={this.filteredGroups[0].items}
            approxHeaderHeight={this.virtualScrollApproxHeaderHeight}
            approxItemHeight={this.virtualScrollApproxItemHeight}
            renderItem={(item): void => this.renderItem(item)}
            renderHeader={(header): void => this.renderHeader(header)}
            headerFn={this.virtualScrollHeaderFn}
          ></ion-virtual-scroll> */
          <div class="virtual-container">
            <virtual-scroll bottom-offset="20" virtual-ratio="15" selector="">
              <div slot="virtual" class="virtual-slot">
                {this.virtualItems.map(item => (
                  <div class="offer virtual-item" id={item.id}>
                    {this.renderItem(item)}
                  </div>
                ))}
              </div>
            </virtual-scroll>
          </div>
        )}
        {this.hasInfiniteScroll && (
          <ion-infinite-scroll threshold={this.infiniteScrollThreshold} onIonInfinite={(): void => this.getMoreItems()}>
            <ion-infinite-scroll-content></ion-infinite-scroll-content>
          </ion-infinite-scroll>
        )}
      </div>
    );
  }

  private renderModal() {
    return (
      <ion-modal
        ref={modalElement => (this.modalElement = modalElement)}
        class={{
          ...getClassMap(this.modalCssClass),
          'ionic-selectable-modal-is-add-item-template-visible ': this.isAddItemTemplateVisible,
        }}
        backdropDismiss={this.shouldBackdropClose}
        enterAnimation={this.modalEnterAnimation}
        leaveAnimation={this.modalLeaveAnimation}
      >
        <ion-header>
          {this.hasTemplateRender && this.hasTemplateRender('header') ? (
            <div
              ref={element => {
                this.templateRender(element, {
                  type: 'header',
                });
              }}
            ></div>
          ) : (
            <ion-toolbar color={this.headerColor}>
              <ion-title>
                {this.hasTemplateRender && this.hasTemplateRender('title') ? (
                  <span
                    ref={element => {
                      this.templateRender(element, {
                        type: 'title',
                      });
                    }}
                  ></span>
                ) : (
                  <span>{this.titleText}</span>
                )}
              </ion-title>
              <ion-buttons slot={this.closeButtonSlot}>
                <ion-button onClick={(): void => this.closeModal()}>
                  {this.hasTemplateRender && this.hasTemplateRender('closeButton') ? (
                    <span
                      ref={element => {
                        this.templateRender(element, {
                          type: 'closeButton',
                        });
                      }}
                    ></span>
                  ) : (
                    <span>{this.closeButtonText}</span>
                  )}
                </ion-button>
              </ion-buttons>
            </ion-toolbar>
          )}
          {this.canSearch ||
            (this.hasTemplateRender && this.hasTemplateRender('message') && (
              <ion-toolbar>
                <ion-searchbar
                  value={this.searchText}
                  placeholder={this.searchPlaceholder}
                  debounce={this.searchDebounce}
                  cancelButtonIcon={this.searchCancelButtonIcon}
                  cancelButtonText={this.searchCancelButtonText}
                  clearIcon={this.searchClearIcon}
                  inputmode={this.searchInputmode}
                  searchIcon={this.searchIcon}
                  showCancelButton={this.searchShowCancelButton}
                  onIonChange={(event): void => this.onSearchbarValueChanged(event)}
                ></ion-searchbar>
                {this.hasTemplateRender && this.hasTemplateRender('message') && (
                  <div
                    class="ionic-selectable-message"
                    ref={element => {
                      this.templateRender(element, {
                        type: 'message',
                      });
                    }}
                  ></div>
                )}
              </ion-toolbar>
            ))}
        </ion-header>
        <ion-content>{this.renderContent()}</ion-content>
        {this.isAddItemTemplateVisible && (
          <div
            class="ionic-selectable-add-item-template"
            style={{ top: this.headerElement.offsetHeight + 'px' }}
            ref={element => {
              this.templateRender(element, {
                type: 'addItem',
                value: this.itemToAdd,
                isAdd: this.itemToAdd == null,
              });
            }}
          ></div>
        )}
        {(this.footerButtonsCount > 0 || (this.hasTemplateRender && this.hasTemplateRender('footer'))) && (
          <ion-footer style={{ visibility: this.isFooterVisible ? 'initial' : 'hidden' }}>
            {this.hasTemplateRender && this.hasTemplateRender('footer') ? (
              <div
                ref={element => {
                  this.templateRender(element, {
                    type: 'footer',
                  });
                }}
              ></div>
            ) : (
              <ion-toolbar>
                <ion-row>
                  {this.canClear && (
                    <ion-col>
                      <ion-button onClick={(): void => this.clearItems()} disabled={!(this.selectedItems.length > 0)} expand="full">
                        {this.clearButtonText}
                      </ion-button>
                    </ion-col>
                  )}
                  {this.canAddItem && (
                    <ion-col>
                      <ion-button onClick={(): void => this.addItemClick()} expand="full">
                        {this.addButtonText}
                      </ion-button>
                    </ion-col>
                  )}
                  {(this.isMultiple || this.hasConfirmButton || this.canClear) && (
                    <ion-col>
                      <ion-button onClick={(): void => this.confirmSelection()} disabled={!this.isConfirmButtonEnabled} expand="full">
                        {this.confirmButtonText}
                      </ion-button>
                    </ion-col>
                  )}
                </ion-row>
              </ion-toolbar>
            )}
          </ion-footer>
        )}
      </ion-modal>
    );
  }

  public render(): void {
    const { placeholder, name, isDisabled, isOpened, element /* isMultiple */ } = this;
    const mode = getMode();

    if (!this.isRendered) {
      // Add ripple efect
      if (mode === 'md') {
        addRippleEffectElement(element);
      }
    }

    const item = findItem(element);
    if (item) {
      item.classList.add('ion-activatable');
      if (isOpened) {
        item.classList.add('item-has-focus');
      } else {
        item.classList.remove('item-has-focus');
      }
    }

    const labelId = this.id + '-lbl';
    let labelPosition = 'item-label-default';
    const label = findItemLabel(element);
    if (label) {
      label.id = labelId;
      labelPosition = `item-label-${label.getAttribute('position') ? label.getAttribute('position') : 'default'}`;
    }

    renderHiddenInput(true, element, name, this.parseValue(), isDisabled);

    let addPlaceholderClass = false;
    let selectText = this.getText();

    if (selectText === '' && (placeholder != null || (this.hasTemplateRender && this.hasTemplateRender('placeholder')))) {
      selectText = placeholder;
      addPlaceholderClass = true;
    }

    const selectTextClasses: CssClassMap = {
      'ionic-selectable-text': true,
      'ionic-selectable-placeholder': addPlaceholderClass,
    };

    const textPart = addPlaceholderClass ? 'placeholder' : 'text';

    let valueRender: any;

    if (addPlaceholderClass && this.hasTemplateRender && this.hasTemplateRender('placeholder')) {
      valueRender = (
        <div
          class={selectTextClasses}
          ref={element => {
            this.templateRender(element, {
              type: 'placeholder',
            });
          }}
        ></div>
      );
    } else if (this.hasTemplateRender && this.hasTemplateRender('value')) {
      valueRender = (
        <div
          class={selectTextClasses}
          ref={element => {
            this.templateRender(element, {
              type: 'value',
              value: this.value,
            });
          }}
        ></div>
      );
    } else {
      valueRender = (
        <div class={selectTextClasses} part={textPart}>
          {selectText}
        </div>
      );
    }
    this.isRendered = true;
    // return this.renderContent();

    return (
      <Host
        id={this.id}
        onClick={this.onClick}
        role="combobox"
        aria-haspopup="dialog"
        aria-disabled={isDisabled ? 'true' : null}
        aria-expanded={`${isOpened}`}
        aria-labelledby={labelId}
        class={{
          [mode]: true,
          'in-item': hostContext('ion-item', element),
          [labelPosition]: true,
          // 'item-multiple-inputs': isMultiple, // review
          'ionic-selectable-is-disabled': isDisabled,
        }}
      >
        {valueRender}

        {this.hasTemplateRender && this.hasTemplateRender('icon') ? (
          <div
            class="ionic-selectable-icon-template"
            ref={element => {
              this.templateRender(element, {
                type: 'icon',
              });
            }}
          ></div>
        ) : (
          <div class="ionic-selectable-icon" role="presentation" part="icon">
            <div class="ionic-selectable-icon-inner" part="icon-inner"></div>
          </div>
        )}
        <button type="button" onFocus={this.onFocus} onBlur={this.onBlur} disabled={isDisabled} ref={buttonElement => (this.buttonElement = buttonElement)} />
        {this.renderModal()}
      </Host>
    );
  }
}
let nextId = 0;
