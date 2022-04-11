import { Api } from "lib/Api";

export class Users extends Api
{
	async get()
	{	
		const data = await this.fetch("https://randomuser.me/api/");
		return JSON.parse(data);
	}
}
