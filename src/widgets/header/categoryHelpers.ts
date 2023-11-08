import { useEffect, useMemo, useRef } from 'react';
import { useListState, useSessionStorage } from '@mantine/hooks';
import { Categories, Option } from '../../interactions/categorize';

// Sync with Py
export const NONE_CATEGORY_OPTION = 'No Assignment';

function useCategories(categoriesColumnRecord: Categories) {
  return useMemo(() => {
    return Object.keys(categoriesColumnRecord);
  }, [categoriesColumnRecord]);
}

function useSelectedCategory(categoriesColumnRecord: Categories) {
  const categories = useCategories(categoriesColumnRecord);

  const [selectedCategory, setSelectedCategory] = useSessionStorage<
    string | null
  >({
    key: '__persist_edit_category_selected',
    defaultValue: null,
    getInitialValueInEffect: true
  });

  useEffect(() => {
    setSelectedCategory(p =>
      p && categories.includes(p)
        ? p
        : categories.length > 0
        ? categories[0]
        : null
    );
  }, [categories]);

  return { selectedCategory, setSelectedCategory, categories };
}

export function useCategoryOptions(
  categoriesColumnRecord: Categories,
  readonly = false
) {
  const { selectedCategory, setSelectedCategory, categories } =
    useSelectedCategory(categoriesColumnRecord);

  const skipOptionsSyncRef = useRef(false);

  const opts = useMemo(() => {
    return selectedCategory && categoriesColumnRecord[selectedCategory]
      ? categoriesColumnRecord[selectedCategory].options
      : [];
  }, [selectedCategory, categoriesColumnRecord]);

  const [options, optionsHandlers] = useListState<Option>(opts);

  useEffect(() => {
    if (readonly) {
      return;
    }

    if (skipOptionsSyncRef.current) {
      skipOptionsSyncRef.current = false;
      return;
    }
    if (opts !== options) {
      optionsHandlers.setState(opts);
    }
  }, [opts, options]);

  const ordered = useMemo(() => {
    if (!selectedCategory) {
      return null;
    }

    return categoriesColumnRecord[selectedCategory]?.ordered;
  }, [categoriesColumnRecord, selectedCategory]);

  return {
    options,
    opts,
    optionsHandlers,
    ordered,
    skipOptionsSyncRef,
    selectedCategory,
    setSelectedCategory,
    categories
  };
}
