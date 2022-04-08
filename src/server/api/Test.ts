import { Api } from "./Api";

export class Test extends Api
{
	public get = (props: any) =>
	{
		console.log(props);
		return {
			"wop": ":D"
		}
	}
}
