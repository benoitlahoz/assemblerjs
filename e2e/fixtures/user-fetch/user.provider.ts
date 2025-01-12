import {
  AbstractAssemblage,
  Assemblage,
  Configuration,
  Use,
} from '../../../src';

export interface UserProviderConfiguration {
  api: string;
}

@Assemblage()
export class UserProvider implements AbstractAssemblage {
  constructor(
    @Configuration() private configuration: UserProviderConfiguration,
    @Use('fetcher') private fetcher: any
  ) {}
}
