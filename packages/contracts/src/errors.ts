export type FieldError = {
  field: string;
  code: string;
};

export type ErrorBody = {
  code: string;
  requestId: string;
  fieldErrors: FieldError[];
};

export function errorBody(
  code: string,
  requestId: string,
  fieldErrors: readonly FieldError[] = [],
): ErrorBody {
  return {
    code,
    requestId,
    fieldErrors: fieldErrors.map((item) => ({ field: item.field, code: item.code })),
  };
}
