import { ReactElement, createElement, useEffect, Fragment, useRef } from "react";
import { nanoid } from "nanoid";
import PubSub from "pubsub-js";

import { AnalyticsFormContainerProps } from "../typings/AnalyticsFormProps";

const formListenerName = "FORM_MENDIX_LISTENER";

export enum PayloadType {
    REGISTER = "REGISTER",
    FOCUS_SWITCH = "FOCUS_SWITCH",
    LEAVE = "LEAVE"
}

const stringifyMe = (payLoad: any) => {
    return JSON.stringify(payLoad);
};
export function AnalyticsForm({ classNameToTrack }: AnalyticsFormContainerProps): ReactElement {
    const _id = useRef(nanoid().toUpperCase());
    const browserPageName = window.history.state.pageInfo.formParams.path;
    const registerForm = () => {
        const payLoad = {
            browserPageName,
            id: _id.current,
            type: PayloadType.REGISTER
        };
        PubSub.publish(formListenerName, stringifyMe(payLoad));
    };
    const registerFocusSwitch = (elementId: string) => {
        const payLoad = {
            elementId,
            browserPageName,
            id: _id.current,
            type: PayloadType.FOCUS_SWITCH
        };
        PubSub.publish(formListenerName, stringifyMe(payLoad));
    };
    const registerLeaveForm = () => {
        const payLoad = {
            browserPageName,
            id: _id.current,
            type: PayloadType.LEAVE
        };
        PubSub.publish(formListenerName, stringifyMe(payLoad));
    };

    const callBack = (e: FocusEvent) => {
        let valueToPass = "";
        if ((e.target as HTMLElement).id) {
            const getInputsLabel = document.querySelector(`label[for='${(e.target as HTMLElement).id}']`);

            if (getInputsLabel) {
                valueToPass = getInputsLabel.innerHTML;
            } else {
                valueToPass = (e.target as HTMLElement).id;
            }
        } else {
            valueToPass = (e.target as HTMLElement).innerHTML;
        }
        registerFocusSwitch(valueToPass);
    };

    useEffect(() => {
        const foundClassName = document.getElementsByClassName(classNameToTrack)[0];
        foundClassName.addEventListener("focusin", callBack);
        registerForm();
        return () => {
            foundClassName?.removeEventListener("focusin", callBack);
            registerLeaveForm();
        };
    }, []);

    return <Fragment></Fragment>;
}
