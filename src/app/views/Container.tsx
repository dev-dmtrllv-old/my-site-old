import React from "react";
import { View } from "./View";
import { react } from "utils";

import "./styles/container.scss";

export const Container: React.FC<IContainerProps> = ({ maxWidth, children, className, noPadding, noMargin, style = {}, ...rest }) =>
{
	if (maxWidth)
		style.maxWidth = typeof maxWidth === "string" ? maxWidth : (maxWidth + "px");
	const cn = react.getClassFromProps("container", { className, noPadding, noMargin, fill: (noPadding && noMargin) });
	return (
		<View className={cn} style={style} {...rest}>
			{children}
		</View>
	);
}

interface IContainerProps extends ReactProps<HTMLDivElement>
{
	maxWidth?: number | string;
	noPadding?: boolean;
	noMargin?: boolean;
}
