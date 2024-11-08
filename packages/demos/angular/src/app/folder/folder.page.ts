import { Component, inject, OnInit, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonButtons,
  IonMenuButton,
  IonTitle,
  IonContent,
  IonItem,
  IonLabel,
  IonButton,
  IonCol,
  IonRow,
  IonFooter,
  IonInput,
  IonItemDivider,
  IonList,
} from '@ionic/angular/standalone';

import { IonicSelectableComponent, IonicSelectableModule } from '@ionic-selectable/angular/dist';

@Component({
  selector: 'app-folder',
  templateUrl: './folder.page.html',
  styleUrls: ['./folder.page.scss'],
  standalone: true,
  imports: [
    IonList,
    IonItemDivider,
    IonInput,
    IonFooter,
    IonRow,
    IonCol,
    IonItem,
    IonLabel,
    IonButton,
    IonHeader,
    IonToolbar,
    IonButtons,
    IonMenuButton,
    IonTitle,
    IonContent,
    IonicSelectableModule,
    IonList,
  ],
})
export class FolderPage {
  @ViewChild('ionicSelectable') ionicSelectable!: IonicSelectableComponent;

  items: Array<{id: number, port: string, country: any}> = [];
  /*     { id: 1, port: 'Salina Cruz', country: { country: 'Mexico' } },
  { id: 2, port: 'Valencia', country: { country: 'Spain' } },
  { id: 3, port: 'Veracruz', country: { country: 'Mexico' } }
]; */

  binding: any;

  constructor() {
    for (let index = 1; index < 20; index++) {
      this.items.push({
        id: index,
        port: 'Salina Cruz',
        country: { country: 'Mexico' },
      });
    }
  }

  onChanged(event: any) {
    console.log(event);
  }

  open() {
    this.ionicSelectable.open();
  }
}
