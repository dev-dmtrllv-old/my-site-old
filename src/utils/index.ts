import * as react from "./react";
import * as string from "./string";
import * as object from "./object";
import * as path from "./path";

export const wait = (time: number, target: "ms" | "s" | "min" = "ms") => new Promise<NodeJS.Timeout>((resolve) => 
{
	let ms = target === "ms" ? time : target === "s" ? time * 1000 : time * 60000;
	return setTimeout(resolve, ms);
});

export const isSubClass = (A: any, B: any, matchSameClass: boolean = false) =>
{
	if (matchSameClass)
		return A.prototype instanceof B || B === A;
	return A.prototype instanceof B;
}

export const exec = <T = any>(fn: () => T) => fn();

export
{
	react,
	string,
	object,
}
