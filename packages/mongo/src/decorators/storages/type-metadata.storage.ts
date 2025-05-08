import { PropertyMetadata, SchemaMetadata } from '../metadata';
import { isTargetEqual } from '../../utils';

class TypeMetadataStorage {
  private schemas = new Array<SchemaMetadata>();
  private properties = new Array<PropertyMetadata>();

  addPropertyMetadata(metadata: PropertyMetadata) {
    this.properties.unshift(metadata);
  }

  addSchemaMetadata(metadata: SchemaMetadata) {
    this.compileClassMetadata(metadata);
    this.schemas.push(metadata);
  }

  getSchemaMetadataByTarget(target: Function): SchemaMetadata | undefined {
    return this.schemas.find((item) => item.target === target);
  }

  private compileClassMetadata(metadata: SchemaMetadata) {
    const belongsToClass = isTargetEqual.bind(undefined, metadata);

    if (!metadata.properties) {
      metadata.properties = this.getClassFieldsByPredicate(belongsToClass);
    }
  }

  private getClassFieldsByPredicate(
    belongsToClass: (item: PropertyMetadata) => boolean
  ) {
    return this.properties.filter(belongsToClass);
  }
}

const typeMetadataStorage = new TypeMetadataStorage();
export { typeMetadataStorage as TypeMetadataStorage };
