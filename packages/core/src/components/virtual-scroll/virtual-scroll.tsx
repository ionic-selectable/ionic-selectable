/*
logic of this component base on
...
*/

import { Component, Prop, h, State, Element, Watch, Event, EventEmitter, Method } from '@stencil/core';

@Component({
  tag: 'virtual-scroll',
  styleUrl: 'virtual-scroll.scss'
})
export class VirtualScrollWebComponent {

  //list og imported values
  @Prop() list: Array<any> = [];

  //class selector
  @Prop() selector: string = '';

  //offset bottom event
  @Prop() bottomOffset: number = 0;

  //reserve of the bootom rows
  @Prop() virtualRatio = 3;

  //change detection strategy
  @State() changed: string[] = [];

  /*ROOT DIMENSIONS*/
  //root html
  @Element() el: HTMLElement;
  //content element
  private contentEl: HTMLElement;
  //position of scroll element
  private position: number = 0;
  //scrolled html element
  private parentScroll: any;
  private parentScrollHeight: number = 0;
  //offset of scroll
  private vscrollOffsetTop: number = 0;
  //private contentOffsetTop: number = 0;
  private elementOffsetTop: number = 0;
  /*ROOT DIMENSIONS^^^*/

  /*EVENTS*/
  @Event() toBottom: EventEmitter<number>;
  @Event() update: EventEmitter<Array<any>>;
  /*EVENTS^^^*/

  /*LAZYLOAD*/
  //state to enable bottom infinate event
  private infinateOn: boolean = true;
  //state to common disable bottom infinate event
  private infinateFinally: boolean = false;
  /*LAZYLOAD^^^*/

  //full height of component
  private totalHeight: number = 0;

  //first and last viewed rows
  private first: any;
  private last: any;

  //list items dimensions
  private listDimensions: Array<any> = [];

  //bool state to detect init render
  private initRender: boolean = false;

  private toNextUpdateDimensions: boolean = false;
  // private stackToDelete: Array<number> = [];

  private scrollEventDispatch = () => undefined;

  //change list event2
  @Watch('list')
  watchHandler(newValue: Array<any>, oldValue: Array<any>) {

    if (oldValue.length > 0) {

      let deleted = oldValue.filter(f => newValue.filter(f2 => f2.index == f.index).length == 0);
      if (deleted.length > 0) {
        deleted.map(m => {
          this._deleteDimension(m.index);
        })
      }
    }
    //let edited = newValue.filter(f => oldValue.filter(f2 => f2.index == f.index).length == 0);
    //console.log('let deleted', deleted);
    //console.log('let edited', edited);
    //console.log('let list', edited);

    this.list.map((m, i) => {
      if (!m.index) {
        m.index = i;
      }
    })
    this.updateVirtual(true);
    //recalculation dimesions of list items
    this._setDimensions();
  }

  //life cicle methods
  componentDidLoad() {

    this._setDefParams();

    //get scroll element
    if (this.selector.length > 0) {
      this.parentScroll = this.el.closest('.' + this.selector);
    }
    else {
      this.parentScroll = this.el.querySelector('.vscroll');
    }

    //get scroll element height
    this.parentScrollHeight = this.parentScroll['offsetHeight'];

    //get scroll element offset top
    //this.contentOffsetTop = (this.parentScroll) ? this.parentScroll['offsetTop'] : 0;

    //get content element
    this.contentEl = this.el.querySelector('.vscroll-content');

    let vscroll = this.el.querySelector('.vscroll');
    this.vscrollOffsetTop = (vscroll) ? vscroll['offsetTop'] : 0;


    this.scrollEventDispatch = this.parentScroll.addEventListener('scroll', () => {

      //console.log(this.parentScroll['scrollTop'] - this.vscrollOffsetTop - this.elementOffsetTop + this.parentScrollHeight);
      if (this.parentScroll['scrollTop'] - this.vscrollOffsetTop - this.elementOffsetTop + this.parentScrollHeight < 0) {
        return;
      }

      this.position = this.parentScroll['scrollTop'] - this.vscrollOffsetTop - this.elementOffsetTop;
      // console.log(this.position);
      // console.log('-----');
      this.updateVirtual();
    }, false);

  }

  //dispatch listener of scroll on unload
  unwatch() {
    if (this.parentScroll) {
      this.parentScroll.removeEventListener('scroll', this._listener);
    }
  }
  private _listener() {
    this.position = this.parentScroll['scrollTop'] - this.vscrollOffsetTop;
    this.updateVirtual();
  }

  //life cicle methods
  disconnectedCallback() {
    this.unwatch();

    if (this.scrollEventDispatch) {
      this.scrollEventDispatch();
      this.scrollEventDispatch = null;
    }

    // this.el.remove();
    // this.contentEl.remove();
    // this.parentScroll.remove();
    // this.list = null;
    // this.listDimensions = null;

  }

  //life cicle methods
  componentWillLoad() {
  }


  private _setDefParams() {
    this.first = null;
    this.last = null;
    this.listDimensions = [];
    this.totalHeight = 0;
    this.position = 0;
    this.infinateOn = true;
    this.infinateFinally = false;
  }

  //update virtual list items
  updateVirtual(update: boolean = false) {

    let findex = (this.first) ? this.first.rindex : 0;
    let lindex = (this.last) ? this.last.rindex : 0;

    //get first and last viewed nodes by position
    this.first = this.listDimensions.filter(f => this.position >= f.start && this.position < f.end)[0];
    this.last = this.listDimensions.filter(f => this.position + this.parentScroll.clientHeight >= f.start && this.position + this.parentScroll.clientHeight < f.end)[0];
    //if last node by position is null, take last of list
    if (!this.last) {
      this.last = this.listDimensions[this.listDimensions.length - 1];
    }

    // console.log('this.first', this.first)
    // console.log('this.last', this.last)

    //if first/last exist, set topPadding(content transformY).
    //virtual list set ...
    if (this.first && this.last) {

      let lastOffsetIndex = (this.last.rindex + this.virtualRatio) >= this.list.length ? this.list.length : this.last.rindex + this.virtualRatio

      let firstOffsetIndex = (this.first.rindex - this.virtualRatio) < 0 ? 0 : this.first.rindex - this.virtualRatio;
      if (lastOffsetIndex == this.list.length && (this.totalHeight - this.position - this.parentScrollHeight) < 0) {
        firstOffsetIndex = (findex - this.virtualRatio) < 0 ? 0 : findex - this.virtualRatio;
        this.first = this.listDimensions.filter(f => f.rindex == findex)[0];
      }

      let v = [];
      if (this.list.length > 0) {
        v = this.list.slice(firstOffsetIndex, lastOffsetIndex);
      }

      if ((findex != this.first.rindex || lindex != this.last.rindex) || update) {

        requestAnimationFrame(() => {
          let d = this.listDimensions.filter(f => f.rindex == firstOffsetIndex)[0];
          if (d) {
            this.contentEl.style.transform = 'translateY(' + d.start + 'px)';
            this.contentEl.style.webkitTransform = 'translateY(' + d.start + 'px)';
          }
          //this.virtual = v;
          this.update.emit(v);

          if (update) {
            //change detection
            this.changed = [...this.changed, ''];
          }
        })

        //change detection
        this.changed = [...this.changed, ''];

      }
    }
    else {
      if (this.list.length > 0) {
        let v = this.list.slice(0, 20);
        //console.log('v2', v)
        //this.virtual = v;
        this.update.emit(v);

        //change detection
        this.changed = [...this.changed, ''];
      }
    }

    //bottom event
    if (this.last && this.last.rindex >= this.list.length - 1 - this.bottomOffset) {
      if (this.infinateOn && !this.infinateFinally && this.list.length > 0) {
        this.infinateOn = false;
        this.toBottom.emit(this.position);
      }
    }

  }

  //set infinate on status to send events
  @Method() async setInfinateOn() {
    this.infinateOn = true;
  }

  //set infinate off status to send events
  @Method() async setInfinateFinally() {
    this.infinateFinally = true;
  }

  //clear component data
  @Method() async clear() {

    this._setDefParams();
    requestAnimationFrame(() => {
      this.list = [];
      this.contentEl.style.transform = 'translateY(' + 0 + 'px)';
      this.contentEl.style.webkitTransform = 'translateY(' + 0 + 'px)';
      this.changed = [...this.changed, ''];
    })

  }


  //scroll to element method at index
  @Method() async scrollToNode(index: number, speed: number, offset: number = 0) {
    if (this.parentScroll) {
      if (index <= this.listDimensions.length - 1) {
        let dimension = this.listDimensions.filter(f => f.rindex == index)[0];
        this._scrollTo(dimension.start + offset, speed);
      }
      else {
        this._scrollToIndex(index);
      }
    }
  }

  // //scroll to element method
  // @Method()
  // refresh() {

  //   let missing = this.list.filter(item => this.list.indexOf(item) < 0);
  //   console.log(missing);

  //   let v = this.list.slice(this.first.rindex, this.last.rindex + this.bottomOffsetIndex);
  //   this.update.emit(v);
  //   //change detection
  //   this.changed = [...this.changed, ''];
  // }

  private _scrollToIndex(index) {
    let perTick = 100;
    setTimeout(() => {
      this.parentScroll['scrollTop'] = this.parentScroll['scrollTop'] + perTick;
      if (this.first && this.first.rindex === index) return;
      this._scrollToIndex(index);
    }, 10);
  }

  private _scrollTo(to, duration) {
    if (duration <= 0) return;
    let difference = to - this.parentScroll['scrollTop'];
    let perTick = difference / duration * 10;

    setTimeout(() => {
      this.parentScroll['scrollTop'] = this.parentScroll['scrollTop'] + perTick;
      if (this.parentScroll['scrollTop'] === to) return;
      this._scrollTo(to, duration - 10);
    }, 10);
  }

  //recalculation dimesions of list items
  private _setDimensions(): boolean {
    let oldTotal = this.totalHeight;

    if (this.toNextUpdateDimensions) {
      this.listDimensions = [];
    }
    this.toNextUpdateDimensions = false;

    let nodes = this.el.querySelectorAll('.virtual-slot .virtual-item');
    // console.log('_setDimensions', nodes)
    if (nodes.length > 0) {
      for (let vindex = 0; vindex <= nodes.length - 1; vindex++) {
        let node = nodes[vindex];
        let rindex = node['id'];
        let d = this.listDimensions.filter(f => f.rindex == rindex)[0];
        if (!d) {
          this._addNewDimensionToEnd(node['offsetHeight'], rindex);
          this.totalHeight = this.listDimensions[this.listDimensions.length - 1].end;
        }
      }
    }

    return (this.totalHeight != oldTotal);
  }

  //Append new dimensions of list item
  private _addNewDimensionToEnd(height: number, rindex) {
    let parentEnd = (this.listDimensions.length > 0) ? this.listDimensions[this.listDimensions.length - 1].end : 0;

    this.listDimensions.push({
      height: height,
      start: parentEnd,
      end: parentEnd + height,
      rindex: parseInt(rindex)
    });

  }

  private _deleteDimension(rindex) {
    //this index from list -> [index], if i get index from listDimensions -> filter()..
    let d = this.listDimensions.filter(f => f.rindex == rindex)[0];
    if (d) {
      d.start = 0;
      d.end = 0;
      for (let i = rindex + 1; i <= this.listDimensions.length - 1; i++) {
        this.listDimensions[i].start = this.listDimensions[i].start - d.height;
        this.listDimensions[i].end = this.listDimensions[i].end - d.height;
      }

      let notDeleted = this.listDimensions.filter(f => f.end > 0);
      if (notDeleted.length == 0) {
        this.totalHeight = 0;
      }
      else {
        this.totalHeight = notDeleted[notDeleted.length - 1].end;
      }
    }
  }

  @Method() async refresh() {
    this.toNextUpdateDimensions = true;
  }

  //this method may be called if something is wrong in framework logic. For example: in ionic 3, the page component not updated with new data on the inactive tab page.
  //The method re-checks all dimensions, add the missing ones and force update component.
  @Method() async forceUpdateComponent() {
    this.__didUpdate(true);
  }

  //Append new dimensions of list item
  private _testDimensions() {
    let nodes = this.el.querySelector('.virtual-slot').childNodes;
    if (nodes.length > 0) {
      for (let vindex = 0; vindex <= nodes.length - 1; vindex++) {
        let node = nodes[vindex];
        let rindex = node['id'];
        let d = this.listDimensions.filter(f => f.rindex == rindex)[0];
        if (d && (d.height != node['offsetHeight'])) {
          //console.warn("One or more nodes change height after calculation dimensions. Check scroll", rindex);
          //console.log('node', node);
          //console.log('this.listDimensions[index]', d);
        }
      }
    }
  }

  componentDidUpdate() {
    this.__didUpdate(false);
  }

  __didUpdate(upd) {

    //after component render, need to add new dimensions if virtual nodes, change height
    //if is init render need call update virtual,
    //if is not init check update height. If height change render again!

    let isNewHeight = this._setDimensions();
    // console.log('isNewHeight', isNewHeight)

    //if first render finished, recalculate virtual
    if (!this.initRender) {
      this.initRender = true;

      //if use external scroll, need take offset top scroll ellement
      if (this.selector.length > 0) {
        this.elementOffsetTop = this.el['offsetTop'];
      }

      this.updateVirtual();
    }
    else {
      if (isNewHeight || upd) {
        //change detection
        this.changed = [...this.changed, ''];
      }
      this._testDimensions();
    }
  }


  render() {
    return (
      <div class={"vscroll " + (this.selector.length > 0 ? 'external ' : 'inner ') + (this.infinateFinally ? 'infinate-finally ' : ' ') + (this.list.length == 0 ? 'cleared' : '')}>
        <div class="vscroll-back" style={{ height: this.totalHeight + 'px' }}>

        </div>
        <div class={"vscroll-content " + (this.selector.length > 0 ? 'external' : 'inner')}>
          <slot name="virtual" />
        </div>
        <slot name="loader" />
      </div>
    );
  }
}
