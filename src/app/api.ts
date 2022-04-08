import { exec } from "utils";
import { serialize } from "utils/object";
import type { ClientApiType } from "../server/api";

export const api: ClientApiType = exec(() => 
{
	let api: any = {};

	const manifest = JSON.parse(window.__SERVER_DATA__.api);

	Object.keys(manifest).forEach(k => 
	{
		let target = api;

		const [, ...parts] = k.split("/");

		parts.forEach((p, i) => 
		{
			if (i === parts.length - 1)
			{
				target[p] = {
					path: k
				};

				manifest[k].forEach((m: string) => 
				{
					target[p][m] = m === "get" ? async (data: any = {}) => 
					{
						return await fetch(k + `?` + serialize(data), {
							method: m.toUpperCase(),
						}).then(res => res.text()).then(s => 
						{
							try
							{
								const r = JSON.parse(s);
								if (r.data)
									return r.data;
								else if (r.error)
									throw r.error;
							}
							catch (e)
							{
								return s;
							}
						});
					} : async (data: any = {}) => 
					{
						return await fetch(p, {
							body: data,
							method: m.toUpperCase(),
						}).then(res => res.text()).then(s => 
						{
							try
							{
								const r = JSON.parse(s);
								if (r.data)
									return r.data;
								else if (r.error)
									throw r.error;
							}
							catch (e)
							{
								return s;
							}
						});
					};
				});
			}
			else
			{
				if (!target[p])
					target[p] = {};
				target = target[p];
			}
		});
	})
	return api.api;
});

api.test.path
