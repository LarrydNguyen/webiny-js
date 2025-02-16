import React, { useEffect, useState } from "react";

const emptyFunction = (): undefined => {
    return undefined;
};

interface ApplyValueCb {
    (value: string, cb: (value: string) => void): void;
}
/**
 * This component is used to wrap Input and Textarea components to optimize form re-render.
 * These 2 are the only components that trigger form model change on each character input.
 * This means, whenever you type a letter an entire form re-renders.
 * On complex forms you will feel and see a significant delay if this component is not used.
 *
 * The logic behind this component is to serve as a middleware between Form and Input/Textarea, and only notify form of a change when
 * a user stops typing for given period of time (400ms by default).
 */
interface OnChangeCallable {
    (value: string, cb?: ApplyValueCb): void;
}
interface OnBlurCallable {
    (ev: React.SyntheticEvent): void;
}
interface OnKeyDownCallable {
    (ev: React.KeyboardEvent<HTMLInputElement>): void;
}
interface ChildrenCallableParams {
    value: string;
    onChange: OnChangeCallable;
}
interface ChildrenCallable {
    (params: ChildrenCallableParams): React.ReactElement;
}
export interface DelayedOnChangeProps {
    value?: string;
    delay?: number;
    onChange?: OnChangeCallable;
    onBlur?: OnBlurCallable;
    onKeyDown?: OnKeyDownCallable;
    children: React.ReactNode | ChildrenCallable;
}
export const DelayedOnChange: React.FC<DelayedOnChangeProps> = ({ children, ...other }) => {
    const { onChange, delay = 400, value: initialValue } = other;
    const [value, setValue] = useState<string | undefined>(initialValue);
    // Sync state and props
    useEffect(() => {
        if (initialValue !== value) {
            setValue(initialValue);
        }
    }, [initialValue]);

    const localTimeout = React.useRef<number | null>(null);

    const applyValue = (value: string, callback: ApplyValueCb = emptyFunction) => {
        localTimeout.current && clearTimeout(localTimeout.current);
        localTimeout.current = null;
        if (!onChange) {
            return;
        }
        onChange(value, callback);
    };

    const onChangeLocal = React.useCallback((value: string) => {
        setValue(value);
    }, []);

    // this is fired upon change value state
    const onValueStateChanged = (nextValue: string) => {
        localTimeout.current && clearTimeout(localTimeout.current);
        localTimeout.current = null;
        localTimeout.current = setTimeout(() => applyValue(nextValue), delay) as unknown as number;
    };

    // need to clear the timeout when unmounting the component
    useEffect(() => {
        return () => {
            if (!localTimeout.current) {
                return;
            }
            clearTimeout(localTimeout.current);
            localTimeout.current = null;
        };
    }, []);

    useEffect(() => {
        onValueStateChanged(value || "");
    }, [value]);

    const newProps = {
        ...other,
        value: value || "",
        onChange: onChangeLocal
    };

    const renderProp = typeof children === "function" ? (children as ChildrenCallable) : null;
    const child = renderProp
        ? renderProp(newProps)
        : React.cloneElement(children as unknown as React.ReactElement, newProps);

    const props = { ...child.props };
    const realOnKeyDown = props.onKeyDown || emptyFunction;
    const realOnBlur = props.onBlur || emptyFunction;

    // Need to apply value if input lost focus
    const onBlur: OnBlurCallable = ev => {
        ev.persist();
        applyValue((ev.target as HTMLInputElement).value, () => realOnBlur(ev));
    };

    // Need to listen for TAB key to apply new value immediately, without delay. Otherwise validation will be triggered with old value.
    const onKeyDown: OnKeyDownCallable = ev => {
        ev.persist();
        if (ev.key === "Tab") {
            applyValue((ev.target as HTMLInputElement).value, () => realOnKeyDown(ev));
        } else if (ev.key === "Enter" && props["data-on-enter"]) {
            applyValue((ev.target as HTMLInputElement).value, () => realOnKeyDown(ev));
        } else {
            realOnKeyDown(ev);
        }
    };

    return React.cloneElement(child, { ...props, onBlur, onKeyDown });
};

export default DelayedOnChange;
