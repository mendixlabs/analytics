import { ReactElement, createElement, useEffect, Fragment, useRef } from "react";
import { nanoid } from "nanoid";
import PubSub from "pubsub-js";

import { AnalyticsFormContainerProps } from "../typings/AnalyticsFormProps";

const formListenerName = "FORM_MENDIX_LISTENER";

enum PayloadType {
    REGISTER,
    FOCUS_SWITCH,
    LEAVE
}

const stringifyMe = (payLoad: any) => {
    return JSON.stringify(payLoad);
};
export function AnalyticsForm({ sampleText }: AnalyticsFormContainerProps): ReactElement {
    const _id = useRef(nanoid());
    const registerForm = () => {
        const payLoad = {
            id: _id,
            type: PayloadType.REGISTER
        };
        PubSub.publish(formListenerName, stringifyMe(payLoad));
    };
    const registerFocusSwitch = (elementId: string) => {
        const payLoad = {
            id: _id,
            elementId,
            type: PayloadType.FOCUS_SWITCH
        };
        PubSub.publish(formListenerName, stringifyMe(payLoad));
    };
    const registerLeaveForm = () => {
        const payLoad = {
            id: _id,
            type: PayloadType.LEAVE
        };
        PubSub.publish(formListenerName, stringifyMe(payLoad));
    };

    const callBack = (e: FocusEvent) => {
        registerFocusSwitch((e.target as HTMLElement).id);
    };

    useEffect(() => {
        const foundClassName = document.getElementsByClassName("classFormToTrack")[0];
        foundClassName.addEventListener("focusin", callBack);
        registerForm();
        return () => {
            foundClassName?.removeEventListener("focusin", callBack);
            registerLeaveForm();
        };
    }, []);

    return <Fragment></Fragment>;
}
