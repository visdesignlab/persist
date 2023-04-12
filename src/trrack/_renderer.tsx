// import { PanelLayout, Widget } from '@lumino/widgets';
// import { TrrackableCellId } from '../cells';
// import { TrrackVisWidget } from './renderer';

// export class RenderedTrrackGraph extends Widget {
//   private _panelLayout: PanelLayout;
//   constructor() {
//     super();
//     this.layout = this._panelLayout = new PanelLayout();
//   }

//   render(id: TrrackableCellId): Promise<void> {
//     this.show(); // TODO: is this necessary?

//     // Check if trrack vis already rendered and exit early
//     if (id === this._id) return Promise.resolve();

//     this._id = id; // Set current id

//     // Create trrack vis widget
//     const widget = new TrrackVisWidget(id);

//     // Add widget to layout
//     this._panelLayout.addWidget(widget);

//     return Promise.resolve();
//   }
// }

export {};
