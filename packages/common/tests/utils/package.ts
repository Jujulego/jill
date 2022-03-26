import { Package } from 'normalize-package-data';

// Utils
export function pkg(data: Pick<Package, 'name'> & Partial<Omit<Package, 'name'>>): Package {
  return {
    _id: data.name,
    version: '',
    readme: '',
    ...data
  };
}
