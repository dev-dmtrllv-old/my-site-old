import React from "react";
import { getClassFromProps } from "utils/react";

export const Image: React.FC<IImageProps> = ({ className, src, alt, ...rest }) =>
{
	return (
		<img src={src} alt={alt || ""} className={getClassFromProps("img", { className })} {...rest} />
	);
}

interface IImageProps extends ReactProps<HTMLImageElement>
{
	src: string;
	alt?: string;
}
