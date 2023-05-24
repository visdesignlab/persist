//'https://spin.atomicobject.com/2018/01/15/typescript-flexible-nominal-typing/

/**
 * Type to add branding flavor
 */
type Flavoring<TFlavor> = {
  _type?: TFlavor;
};

export type FlavoredId<TBaseId, TFlavor> = TBaseId & Flavoring<TFlavor>;
