import which from 'which';

export const whichMongo = async (): Promise<string | null> => {
  return await which('mongod', { nothrow: true });
};

export const whichMongoSync = (): string | null => {
  return which.sync('mongo', { nothrow: true });
};
