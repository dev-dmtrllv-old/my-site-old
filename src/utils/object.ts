export const isEmpty = (obj: Object) => (typeof obj === "object" && !Array.isArray(obj)) ? (Object.keys(obj).length === 0) : false;
