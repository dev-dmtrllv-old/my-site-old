import React from "react";
import { react } from "utils";

import "./styles/view.scss";

export class View extends React.Component<IViewProps>
{
	private ref: React.RefObject<any> = React.createRef();

	componentDidMount()
	{
		if (this.props.onMount)
			this.props.onMount(this.ref.current);
	}

	render()
	{
		const { absolute, fixed, fill, centered = false, inline, className, type = "div", onMount, suppressHydrationWarning = false, ...rest } = this.props;

		const cn = react.getClassFromProps("view", { absolute, fixed, centered, fill, inline, className });
		return React.createElement(type, { ref: this.ref, className: cn, suppressHydrationWarning, ...rest });
	}
}

export interface IViewProps extends ReactProps<HTMLDivElement>
{
	type?: keyof React.ReactHTML;
	absolute?: boolean;
	fixed?: boolean;
	fill?: boolean;
	inline?: boolean;
	centered?: boolean | "horizontal" | "vertical";
	suppressHydrationWarning?: boolean;
	onMount?: (element: HTMLElement) => void;
}
