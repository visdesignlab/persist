import { Cell, CodeCell } from '@jupyterlab/cells';
import { IOutputAreaModel } from '@jupyterlab/outputarea';
import { VEGALITE5_MIME_TYPE } from '@jupyterlab/vega5-extension';
import { Signal } from '@lumino/signaling';
import { FlavoredId } from '@trrack/core';
import * as d3 from 'd3';
import {
  Categories,
  Category,
  Option,
  Options
} from '../interactions/categories';
import { TrrackManager } from '../trrack';
import { IDEGlobal, IDELogger, Nullable } from '../utils';
import { Spec } from '../vegaL/spec';
import { OutputCommandRegistry } from './output/commands';

export type TrrackableCellId = FlavoredId<string, 'TrrackableCodeCell'>;

export const VEGALITE_MIMETYPE = VEGALITE5_MIME_TYPE;
export const TRRACK_EXECUTION_SPEC = 'trrack_execution_spec';
export const CATEGORIES = 'defined_categories';
export const ACTIVE_CATEGORY = 'active_category_name';

export class TrrackableCell extends CodeCell {
  private _trrackManager: TrrackManager;
  warnings: string[] = [];
  commandRegistry: OutputCommandRegistry;

  constructor(options: CodeCell.IOptions) {
    super(options);
    this._trrackManager = new TrrackManager(this); // Setup trrack manager

    this.model.outputs.fromJSON(this.model.outputs.toJSON()); // Update outputs to trigger rerender
    this.model.outputs.changed.connect(this._outputChangeListener, this); // Add listener for when output changes

    this.commandRegistry = new OutputCommandRegistry(this);

    IDELogger.log(`Created TrrackableCell ${this.cellId}`);
  }

  dispose(): void {
    if (this.isDisposed) {
      return;
    }

    Signal.clearData(this);
    IDEGlobal.cells.delete(this.cellId);

    this._trrackManager.dispose();

    super.dispose();
  }

  get cellId(): TrrackableCellId {
    return this.model.id;
  }

  get trrackId() {
    return this._trrackManager.root;
  }

  get trrackManager() {
    return this._trrackManager;
  }

  get executionSpec() {
    return this._getFromMetadata<Spec>(TRRACK_EXECUTION_SPEC);
  }

  get activeCategory(): Nullable<Category> {
    const activeCategoryName = this._getFromMetadata<string>(ACTIVE_CATEGORY);

    if (!activeCategoryName) {
      return null;
    }

    return this.categories[activeCategoryName];
  }

  get categories(): Categories {
    let categories = this._getFromMetadata<Categories>(CATEGORIES);

    if (!categories) {
      categories = {};
      this._saveToMetadata(CATEGORIES, categories);
      this._saveToMetadata(ACTIVE_CATEGORY, null);
    }

    return categories;
  }

  changeActiveCategory(name: Nullable<string>) {
    if (!name || !this.categories[name]) {
      this._saveToMetadata(ACTIVE_CATEGORY, null);
      return null;
    }

    this._saveToMetadata(ACTIVE_CATEGORY, name);
    return name;
  }

  addCategory(
    name: string,
    description?: string,
    initialOptions: Options = {}
  ) {
    const categories = this.categories;

    if (categories[name]) {
      throw new Error(`${name} already exists`);
    }

    const newCategory: Category = {
      name,
      description,
      options: initialOptions
    };

    categories[name] = newCategory;

    this._saveToMetadata(CATEGORIES, categories);

    return newCategory;
  }

  addCategoryOption(category: string, option: Option) {
    const categories = this.categories;

    const doesCategoryExist = Boolean(categories[category]);
    if (!doesCategoryExist) {
      throw new Error(`${category} does not exist`);
    }

    const selectedCategory = categories[category];

    const doesOptionExist = Boolean(selectedCategory.options[option.name]);
    if (doesOptionExist) {
      throw new Error(`${option.name} already exists`);
    }

    selectedCategory.options[option.name] = option;

    categories[category] = selectedCategory;

    this._saveToMetadata(CATEGORIES, categories);
  }

  get categoryColorScale(): d3.ScaleOrdinal<string, string> {
    const scale = d3.scaleOrdinal(d3.schemeCategory10);

    if (this.activeCategory) {
      scale.domain(Object.values(this.activeCategory.options).map(o => o.name));
    }

    return scale;
  }

  // Add remove

  removeCategoryOption(category: string, option: string) {
    const categories = this.categories;

    const selectedCategory = categories[category];

    if (selectedCategory) {
      delete selectedCategory.options[option];
      this._saveToMetadata(CATEGORIES, categories);
    }
  }

  removeCategory(category: string) {
    const categories = this.categories;

    delete categories[category];

    const categoriesList = Object.values(categories);

    if (categoriesList.length > 0) {
      this._saveToMetadata(ACTIVE_CATEGORY, categoriesList[0].name);
    } else {
      console.log('Saving');
      this._saveToMetadata(ACTIVE_CATEGORY, null);
    }

    this._saveToMetadata(CATEGORIES, categories);
  }

  addSpecToMetadata(spec: Spec) {
    const isExecute = IDEGlobal.cellUpdateStatus.get(this) === 'execute';

    if (!isExecute) {
      return;
    }

    this.model.setMetadata(TRRACK_EXECUTION_SPEC, spec as any);
  }

  updateVegaSpec(spec: Spec) {
    const outputs = this.model.outputs.toJSON();
    const executeResultOutputIdx = outputs.findIndex(
      o => o.output_type === 'execute_result'
    );

    if (executeResultOutputIdx === -1) {
      return;
    }

    const output = this.model.outputs.get(executeResultOutputIdx);

    if (output.type !== 'execute_result') {
      return;
    }

    IDEGlobal.cellUpdateStatus.set(this, 'update');

    output.setData({
      data: {
        [VEGALITE_MIMETYPE]: spec as any
      }
    });
  }

  private _getFromMetadata<T>(key: string): Nullable<T> {
    return this.model.getMetadata(key);
  }

  private _saveToMetadata<T>(key: string, value: T): T {
    this.model.setMetadata(key, value);
    return value;
  }

  private _outputChangeListener(
    model: IOutputAreaModel,
    args: IOutputAreaModel.ChangedArgs
  ) {
    const { type, newIndex } = args;

    if (type !== 'add') {
      return;
    }
    const output = model.get(newIndex);

    const metadata = output.metadata;

    if (output.type !== 'execute_result' || metadata.cellId) {
      return;
    }

    IDEGlobal.cellUpdateStatus.set(this, 'execute');

    output.setData({
      metadata: {
        cellId: this.cellId
      }
    });
  }
}

export namespace TrrackableCell {
  export function create(options: CodeCell.IOptions): TrrackableCell {
    const cell = new TrrackableCell(options);

    IDEGlobal.cells.set(cell.cellId, cell);

    return cell;
  }

  export function isTrrackableCell(cell: Cell): cell is TrrackableCell {
    return cell instanceof TrrackableCell;
  }
}
