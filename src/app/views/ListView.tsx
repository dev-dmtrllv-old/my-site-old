import React from "react";
import { react } from "utils";
import { View } from "./View";

export const ListView: React.FC<IListViewProps> = ({ items, component, className, children, ...rest }) =>
{
	const cn = react.getClassFromProps("list-view", { className });
	return (
		<View className={cn} {...rest}>
			{items.map((l, i) => React.createElement(component, { key: i, ...l }))}
		</View>
	);
}

interface IListViewProps extends ReactProps<HTMLDivElement>
{
	fill?: boolean
	items: any[];
	component: React.ComponentClass | React.FC;
}
