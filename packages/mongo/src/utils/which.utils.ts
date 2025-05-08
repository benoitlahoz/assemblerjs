import which from 'which';

export const whichMongo = async (): Promise<string | null> => {
  return await which('mongo', { nothrow: true });
};

export const whichMongoSync = (): string | null => {
  return which.sync('mongo', { nothrow: true });
};
