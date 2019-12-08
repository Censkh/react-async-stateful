import * as React from "react";
import {CSSProperties, useCallback} from "react";
import classnames from "classnames";

import {AsyncState} from "../AsyncStateTypes";
import {getStatus} from "../AsyncStateMethods";

// eslint-disable-next-line
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
    const {component, state, debug, children, className, style, ...otherProps} = props;

    const sendToConsole = useCallback(() => {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        (window as any).__debug = state;
        console.warn("Updated window.__debug with value:");
        console.warn({
            state: state,
        });
    }, [state]);

    return React.createElement(component || "div", {
        className: classnames(className, "ras-overlay"),
        style: {
            position: "relative",
            ...(style || {}),
        },
        ...otherProps
    }, [
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
            <p>Current status: <span>{getStatus(state)}</span></p>
            <button onClick={sendToConsole}>Send to Console</button>
            <button onClick={sendToConsole}>Reset</button>
        </div>,
        children && children(state),
    ].filter(Boolean));
};

export default AsyncStateOverlay;