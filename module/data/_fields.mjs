const { NumberField, SchemaField } = foundry.data.fields;

/**
 * A required, non-nullable number field with an initial value.
 * @param {number} initial    The initial value of the field
 * @returns {NumberField}
 */
export function numberField(initial) {
  return new NumberField({ required: true, nullable: false, initial });
}

/**
 * Remove numeric values from source data which cannot be cast to a finite number, so that the field's initial value
 * is used in their place. Data saved by earlier versions of the system was not validated, and a document with an
 * invalid number would otherwise fail to load.
 * @param {object} source         The source data to clean, mutated in place
 * @param {SchemaField} schema    The schema describing the source data
 */
export function dropInvalidNumbers(source, schema) {
  if ( (typeof source !== "object") || (source === null) ) return;
  for ( const [key, field] of Object.entries(schema.fields) ) {
    if ( !(key in source) ) continue;
    const value = source[key];
    if ( field instanceof SchemaField ) dropInvalidNumbers(value, field);
    else if ( field instanceof NumberField ) {
      // Null is valid for nullable fields (e.g. an unknown page or Challenge Rating).
      if ( (value === null) && field.nullable ) continue;
      if ( (value === null) && !field.required ) continue;
      const number = ((value === null) || (value === "")) ? NaN : Number(value);
      if ( Number.isFinite(number) ) {
        if ( number !== value ) source[key] = number;
      }
      else if ( Object.isFrozen(source) ) continue;
      else delete source[key];
    }
  }
}
