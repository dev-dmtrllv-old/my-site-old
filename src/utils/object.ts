export const isEmpty = (obj: { [key: string]: any }) => (typeof obj === "object" && !Array.isArray(obj)) ? (Object.keys(obj).length === 0) : false;

export const serialize = (obj: { [key: string]: any }) =>
{
	let parts = [];
	for (const p in obj)
		if (obj.hasOwnProperty(p))
			parts.push(encodeURIComponent(p) + "=" + encodeURIComponent(obj[p]));
	return parts.join("&");
}
