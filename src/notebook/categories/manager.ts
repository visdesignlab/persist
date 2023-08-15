import { State, hookstate, none, useHookstate } from '@hookstate/core';
import { LocalStored, StoreEngine, localstored } from '@hookstate/localstored';
import { INotebookModel, NotebookPanel } from '@jupyterlab/notebook';
import {
  Categories,
  Category,
  Option,
  Options
} from '../../interactions/categories';
import { IDEGlobal, Nullable } from '../../utils';

const CATEGORY_META_KEY = '__CATEGORIES_META__';

type CategoryMetaType = {
  categories: Categories;
  activeCategoryName: string;
};

const categoryMetaMap: Map<NotebookPanel, State<CategoryMetaType>> = new Map();

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
  const activeNotebook = IDEGlobal.currentNotebook;

  return categoryManagerWrapper(createCategoriesMeta(activeNotebook));
}

export function useCategoryManager() {
  const activeNotebook = IDEGlobal.currentNotebook;

  return categoryManagerWrapper(
    useHookstate(createCategoriesMeta(activeNotebook))
  );
}
