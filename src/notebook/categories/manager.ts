import { hookstate, none, useHookstate } from '@hookstate/core';
import { Subscribable, subscribable } from '@hookstate/subscribable';
import { NotebookPanel } from '@jupyterlab/notebook';
import {
  Categories,
  Category,
  Option,
  Options
} from '../../interactions/categories';
import { Nullable } from '../../utils';

export const CATEGORIES = '__CATEGORIES__';
export const ACTIVE_CATEGORY_NAME = '__ACTIVE_CATEGORY__';

const _categories = hookstate<Nullable<Categories>, Subscribable>(
  null,
  subscribable()
);
const _activeCategoryName = hookstate<Nullable<string>, Subscribable>(
  null,
  subscribable()
);

let cleanUpArr: Array<() => void> = [];

export function updateCategoryManager(nb: Nullable<NotebookPanel>) {
  if (!nb) {
    _categories.set(null);
    _activeCategoryName.set(null);
    return;
  }
  const model = nb.context.model;

  cleanUpArr.forEach(f => f());

  const subCategories = _categories.subscribe(c =>
    model.setMetadata(CATEGORIES, c)
  );
  const subActiveCatName = _activeCategoryName.subscribe(c =>
    model.setMetadata(ACTIVE_CATEGORY_NAME, c)
  );

  cleanUpArr = [subCategories, subActiveCatName];

  console.log(model.metadata);

  const categories = model.getMetadata(CATEGORIES) as Nullable<Categories>;
  console.log({ categories });

  const activeCategoryName = model.getMetadata(
    ACTIVE_CATEGORY_NAME
  ) as Nullable<string>;
  console.log({ activeCategoryName });

  if (!categories) {
    model.setMetadata(CATEGORIES, {});
  }

  _categories.set(model.getMetadata(CATEGORIES));

  if (!activeCategoryName) {
    const cats = Object.keys(_categories.value || {});

    if (cats.length > 0) {
      model.setMetadata(ACTIVE_CATEGORY_NAME, cats[0]);
    }
  }

  _activeCategoryName.set(model.getMetadata(ACTIVE_CATEGORY_NAME));
}

function categoryManagerWrapper(
  categories: typeof _categories,
  activeCategoryName: typeof _activeCategoryName
) {
  return {
    categories() {
      return categories.value;
    },
    categoriesList() {
      const cats = categories.value;

      return cats ? Object.values(cats) : [];
    },
    activeCategoryName() {
      return activeCategoryName.value;
    },
    activeCategory() {
      const cats = categories.value;
      const actCatName = activeCategoryName.value;

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
      const catExists = Boolean(categories.ornull?.nested(name).value);
      console.log({ catExists }, categories.ornull?.get({ noproxy: true }));

      if (catExists) {
        throw new Error(`Category ${name} already exists`);
      }

      const category: Category = {
        name,
        options
      };

      categories.set(c => {
        if (!c) {
          c = {};
        }

        c[category.name] = category;

        return c;
      });

      return category;
    },
    removeCategory(name: string) {
      const cats = categories.ornull;
      const catExists = Boolean(cats?.nested(name).value);

      if (catExists) {
        cats?.nested(name).set(none);
      }
    },
    changeActiveCategory(name: Nullable<string>) {
      _activeCategoryName.set(name);
    },
    addCategoryOption(name: string, option: Option) {
      const cats = categories.ornull;
      const catExists = Boolean(cats?.nested(name).value);

      if (!catExists) {
        throw new Error(`Category ${name} does not exist`);
      }

      cats?.nested(name).options.merge({ [option.name]: option });
    },
    removeCategoryOption(name: string, optionName: string) {
      const cats = categories.ornull;
      const catExists = Boolean(cats?.nested(name).value);

      if (!catExists) {
        throw new Error(`Category ${name} does not exist`);
      }

      cats?.nested(name).options.nested(optionName).set(none);
    }
  };
}

export function accessCategoryManager() {
  return categoryManagerWrapper(_categories, _activeCategoryName);
}

export function useCategoryManager() {
  return categoryManagerWrapper(
    useHookstate(_categories),
    useHookstate(_activeCategoryName)
  );
}
