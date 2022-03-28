import { createElement, useRef, useEffect, Fragment } from "react";
import { AnalyticsContainerProps } from "../typings/AnalyticsProps";
import { ValueStatus } from "mendix";
import { AnalyticsSession, IMendixCommunicationPayload } from "./helpers/Analytics";
import { IClassNamePayload } from "./helpers/types";

const session = new AnalyticsSession();

const Analytics = (props: AnalyticsContainerProps) => {
    const ref = useRef(document.body);

    const sendClickEvent = (event: IClassNamePayload) => {
        if (props.eventListenerAction?.canExecute && !props.eventListenerAction?.isExecuting) {
            props.communicateOut.setValue(JSON.stringify(event));
            props.eventListenerAction?.execute();
        }
    };

    // Initialize PubSub for Click Listeners
    useEffect(() => {
        session.eventListenerSub(sendClickEvent);
        return () => {
            session.eventListenerUnSub();
        };
    }, [props.eventListenerAction]);

    useEffect(() => {
        if (props.jsonState.status === ValueStatus.Available && !session.sessionId) {
            const mxSession = JSON.parse(props?.jsonState?.displayValue);
            session.addLandingPage(mxSession.sessionId, addPageLand);
        }
    }, [props.jsonState.status]);

    /**
     * On Page Land
     */
    const addPageLand = (newPage: IMendixCommunicationPayload) => {
        props.communicateOut.setValue(JSON.stringify(newPage));
        props.sendInitialSession?.execute();
    };
    /**
     * On Page Leave
     */
    const addPageLeave = (newPage: IMendixCommunicationPayload) => {
        props.communicateOut.setValue(JSON.stringify(newPage));
        props.addPageLeave?.execute();
    };
    /**
     * On PAge Change
     */
    const addPageToServer = (newPage: IMendixCommunicationPayload) => {
        props.communicateOut.setValue(JSON.stringify(newPage));
        props.addPageViewed?.execute();
    };
    const addModalToServer = (newPage: IMendixCommunicationPayload) => {
        props.communicateOut.setValue(JSON.stringify(newPage));
        props.modalAction?.execute();
    };

    function mutationObsCallback() {
        session.addPage(addPageToServer);
        session.lookForModal(addModalToServer);
    }

    function pageOffLoad() {
        session.addLeavePage(addPageLeave);
    }

    useEffect(() => {
        if (props.jsonState.status === ValueStatus.Available) {
            window.history.pushState = new Proxy(window.history.pushState, {
                apply: (target, thisArg, argArray) => {
                    pageOffLoad();
                    return target.apply(thisArg, argArray);
                }
            });

            session.initializeMutant(ref, mutationObsCallback);
        }
        return () => {
            session.disconnectMutant();
        };
    }, [props.jsonState.status]);

    return <Fragment></Fragment>;
};

export default Analytics;
