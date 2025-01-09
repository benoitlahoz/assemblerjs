import { Concrete } from '@/types';
import { getDecoratedParametersIndexes } from './decorators';
import { getParamTypes } from '@/assemblage/reflection';
import { AssemblerContext } from '@/assembler/types';
import { AssemblageDefinition } from '@/assemblage/definition';

export const resolveParameters = <T>(
  target: Concrete<T>,
  context: AssemblerContext,
  definition: AssemblageDefinition,
  configuration: Record<string, any>
) => {
  const parameters: any[] = [];

  // Parameters passed in constructor.
  const paramTypes = getParamTypes(target);
  const indexes = getDecoratedParametersIndexes(target);

  // Build parameters to pass to instance.
  let i = 0;
  for (const dependency of paramTypes) {
    if (indexes.context.includes(i)) {
      parameters.push(context);
      i++;
      continue;
    }

    if (indexes.configuration.includes(i)) {
      parameters.push(configuration);
      i++;
      continue;
    }

    if (indexes.definition.includes(i)) {
      parameters.push(definition);
      i++;
      continue;
    }

    // Recursively require dependency to pass an instance to constructor.
    parameters.push(context.require(dependency));

    i++;
  }

  return parameters;
};

export const resolveDependencies = <T>(target: Concrete<T>) => {
  const parameters: any[] = [];

  // Parameters passed in constructor.
  const paramTypes = getParamTypes(target);
  const indexes = getDecoratedParametersIndexes(target);

  let i = 0;
  for (const dependency of paramTypes) {
    if (
      indexes.context.includes(i) ||
      indexes.configuration.includes(i) ||
      indexes.definition.includes(i)
    ) {
      i++;
      continue;
    }

    parameters.push(dependency);
    i++;
  }

  return parameters;
};
