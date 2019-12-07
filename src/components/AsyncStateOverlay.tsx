import * as React from "react";
import classnames from "classnames";

import {CSSProperties} from "react";
import {AsyncState} from "../AsyncStateTypes";

type ReactComponent<P = any> = React.ComponentClass<P> | React.FunctionComponent<P>;

type PropsOf<C extends ReactComponent | keyof JSX.IntrinsicElements> = C extends ReactComponent<infer P> ? P : (C extends keyof JSX.IntrinsicElements ? JSX.IntrinsicElements[C] : never);

export type AsyncStateOverlayProps<T, C extends ReactComponent | keyof JSX.IntrinsicElements> = {
    [K in keyof PropsOf<C>]: (PropsOf<C>)[K];
} & {
    state: AsyncState<T>;
    component?: C;
    children?: (state: AsyncState<T>) => JSX.Element;
    debug?: boolean;
    className?: string;
    style?: CSSProperties;
};

const AsyncStateOverlay = function <T, C extends ReactComponent | keyof JSX.IntrinsicElements = "div">(props: AsyncStateOverlayProps<T, C>): JSX.Element {
    let {component, state, debug, children, className, style, ...otherProps} = props;

    return React.createElement(component || "div", {
        className: classnames(className, "ras-overlay"),
        style: {
            position: "relative",
            ...(style || {}),
        },
        ...otherProps
    } as any, [
        debug && <div className={"ras-debug-menu"} style={{
            position: "absolute",
            padding: "5px",
            top: 0,
            right: 0,
            background: "rgba(0,0,0,0.5)",
            color: "#fff",
            fontFamily: "monospace",
            fontSize: "14px",
            fontWeight: "normal",
            textShadow: "1px 1px #000",
        }}>
            <b>Debug Menu</b>
        </div>,
        children && children(state),
    ].filter(Boolean));
};

export default AsyncStateOverlay;