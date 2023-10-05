import { INotebookModel, Notebook, NotebookPanel } from '@jupyterlab/notebook';
import { PromiseDelegate } from '@lumino/coreutils';
import { Nullable } from '../utils/nullable';
import { UUID } from '../utils/uuid';
import {
  Category,
  CategoryRecord,
  Options,
  Option
} from '../interactions/categories';
import { localstored, LocalStored, StoreEngine } from '@hookstate/localstored';
import { State, hookstate, none, useHookstate } from '@hookstate/core';

const NOTEBOOK_UUID = '__persist_nb_uuid__';

const CATEGORY_META_KEY = '__CATEGORIES__';
const categoryMetaMap: Map<NotebookPanel, State<CategoryMetaType>> = new Map();

type CategoryMetaType = {
  categories: CategoryRecord;
  activeCategoryName: string;
};

export function getNotebookStoreEngine(model: INotebookModel): StoreEngine {
  return {
    getItem(key: string) {
      return model.getMetadata(key);
    },
    setItem(key: string, value: string) {
      return model.setMetadata(key, value);
    },
    removeItem(key: string) {
      model.deleteMetadata(key);
    }
  };
}

export class NotebookWrapper {
  private _nb: Nullable<Notebook>;

  private _setupFinishDelegate = new PromiseDelegate<void>();

  constructor(private _nbPanel: Nullable<NotebookPanel> = null) {
    this._nb = _nbPanel?.content;

    this._nbPanel?.context.ready
      .then(() => {
        return onContextReady(this);
      })
      .then(() => {
        this._setupFinishDelegate.resolve();
      });
  }

  get nb() {
    return this._nb;
  }

  get nbPanel() {
    return this._nbPanel;
  }

  get model() {
    return this._nbPanel?.model;
  }

  get setupFinish() {
    return this._setupFinishDelegate.promise;
  }

  get nbUid() {
    return this.model?.getMetadata(NOTEBOOK_UUID) as string;
  }

  save() {
    return this._nbPanel?.context.save();
  }
}

async function onContextReady(nb: NotebookWrapper) {
  await saveUUID(nb);

  return Promise.resolve();
}

async function saveUUID(nb: NotebookWrapper) {
  if (nb.model) {
    const hasUid = !!nb.nbUid;
    if (!hasUid) {
      nb.model.setMetadata(NOTEBOOK_UUID, UUID());
      await nb.save();
    }
  }
  return Promise.resolve();
}

export function createCategoriesMeta(nb: Nullable<NotebookPanel>) {
  const init: CategoryMetaType = {
    categories: {},
    activeCategoryName: ''
  };

  if (!nb) {
    return hookstate(init);
  }

  const existingCategoryMeta = categoryMetaMap.get(nb);

  if (existingCategoryMeta) {
    return existingCategoryMeta;
  }

  const model = nb.context.model;

  const categoryMeta = hookstate<CategoryMetaType, LocalStored>(
    init,
    localstored({
      key: CATEGORY_META_KEY,
      engine: getNotebookStoreEngine(model),
      initializer: () => Promise.resolve(init)
    })
  );

  categoryMetaMap.set(nb, categoryMeta);

  return categoryMeta;
}

function categoryManagerWrapper(
  categoryMeta: ReturnType<typeof createCategoriesMeta>
) {
  return {
    categories() {
      return categoryMeta.categories.value;
    },
    categoriesList() {
      const cats = categoryMeta.categories.value;

      return cats ? Object.values(cats) : [];
    },
    activeCategoryName() {
      return categoryMeta.activeCategoryName.value;
    },
    activeCategory() {
      const cats = categoryMeta.categories.value;
      const actCatName = categoryMeta.activeCategoryName.value;

      if (!cats || !actCatName) {
        return null;
      }

      const activeCategory = cats[actCatName];

      return activeCategory;
    },
    activeCategoryOptions() {
      const actCategory = this.activeCategory();
      return actCategory ? Object.values(actCategory.options) : [];
    },
    addCategory(name: string, options: Options = {}) {
      const catExists = Boolean(
        categoryMeta.categories.ornull?.nested(name).value
      );

      if (catExists) {
        throw new Error(`Category ${name} already exists`);
      }

      const category: Category = {
        name,
        options
      };

      categoryMeta.categories.set(c => {
        if (!c) {
          c = {};
        }

        c[category.name] = category;

        return c;
      });

      return category;
    },
    removeCategory(name: string) {
      const cats = categoryMeta.categories.ornull;
      const catExists = Boolean(cats?.nested(name).value);

      if (catExists) {
        cats?.nested(name).set(none);
      }

      if (categoryMeta.activeCategoryName.value === name) {
        categoryMeta.activeCategoryName.set('');
      }
    },
    changeActiveCategory(name: string) {
      categoryMeta.activeCategoryName.set(name);
    },
    addCategoryOption(name: string, option: Option) {
      const cats = categoryMeta.categories.ornull;
      const catExists = Boolean(cats?.nested(name).value);

      if (!catExists) {
        throw new Error(`Category ${name} does not exist`);
      }

      cats?.nested(name).options.merge({ [option.name]: option });
    },
    removeCategoryOption(name: string, optionName: string) {
      const cats = categoryMeta.categories.ornull;
      const catExists = Boolean(cats?.nested(name).value);

      if (!catExists) {
        throw new Error(`Category ${name} does not exist`);
      }

      cats?.nested(name).options.nested(optionName).set(none);
    }
  };
}

export function accessCategoryManager() {
  const activeNotebook = window.Persist.Notebook.nbPanel;

  return categoryManagerWrapper(createCategoriesMeta(activeNotebook));
}

export function useCategoryManager() {
  const activeNotebook = window.Persist.Notebook.nbPanel;

  return categoryManagerWrapper(
    useHookstate(createCategoriesMeta(activeNotebook))
  );
}
