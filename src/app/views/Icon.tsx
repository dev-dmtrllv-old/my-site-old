import React from "react";
import { View } from "./View";

export const Icon: React.FC<IIconProps> = ({ type = "solid", name, ...rest }) =>
{
	return (
		<View type="i" className={`fa${type[0]} fa-${name}`} {...rest}/>
	)
}

interface IIconProps
{
	type?: "solid" | "regular" | "brand";
	name: string;
}