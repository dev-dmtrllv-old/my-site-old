import React from "react";
import { react } from "utils";
import { View } from "./View";

export const FlexItem: React.FC<IFlexItemProps> = ({ className, children, style = {}, base, grow, shrink, ...rest }) =>
{
	base = typeof base === "number" ? base + "px" : base || 0;
	grow = grow || (base ? 0 : 1);
	shrink = shrink || (base ? 0 : 1);

	style.flex = `${shrink} ${grow} ${base}`;

	const cn = react.getClassFromProps("flex-item", { className });

	return (
		<View className={cn} style={style} {...rest}>
			{children}
		</View>
	);
}

interface IFlexItemProps extends ReactProps<HTMLDivElement>
{
	base?: number | string;
	grow?: number;
	shrink?: number;
}
