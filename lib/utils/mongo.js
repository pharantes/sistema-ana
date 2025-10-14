/**
 * Checks if a value matches MongoDB ObjectId format (24 hex characters).
 */
export function isObjectIdLike(id) {
  return /^[0-9a-fA-F]{24}$/.test(String(id || ''));
}

function convertIdToString(document) {
  if (document._id != null) {
    document._id = String(document._id);
  }
}

function convertDatesToISO(document) {
  for (const key of Object.keys(document)) {
    const value = document[key];
    if (value instanceof Date) {
      document[key] = value.toISOString();
    }
  }
}

/**
 * Converts a Mongoose document to a plain JavaScript object.
 * Stringifies ObjectIds and converts Dates to ISO strings.
 */
export function toPlainDoc(document) {
  if (!document || typeof document !== 'object') {
    return document;
  }

  const plainObject = { ...document };
  convertIdToString(plainObject);
  convertDatesToISO(plainObject);

  return plainObject;
}

/**
 * Converts an array of Mongoose documents to plain JavaScript objects.
 */
export function toPlainDocs(documentList) {
  if (!Array.isArray(documentList)) {
    return [];
  }

  return documentList.map(toPlainDoc);
}
