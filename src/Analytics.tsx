import { createElement, useRef, useEffect } from "react";
import { AnalyticsContainerProps } from "../typings/AnalyticsProps";
import { ValueStatus } from "mendix";
import { AnalyticsSession } from "./helpers/Analytics";
import { IClassNamePayload } from "./helpers/types";
import { getCLS } from "web-vitals";

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
        console.log("🔥", props.jsonState.status);
        if (props.jsonState.status === ValueStatus.Available && !session.sessionId) {
            const mxSession = JSON.parse(props?.jsonState?.displayValue);
            session.addLandingPage(mxSession.sessionId, addPageLand);
        }
    }, [props.jsonState.status]);

    const addPageLand = (newPage: any) => {
        props.communicateOut.setValue(JSON.stringify(newPage));
        props.sendInitialSession?.execute();
    };

    const addPageToServer = (newPage: any) => {
        props.communicateOut.setValue(JSON.stringify(newPage));
        props.addPageViewed?.execute();
    };

    function mutationObsCallback() {
        session.addPage(addPageToServer);
    }

    useEffect(() => {
        getCLS(console.log);
        if (props.jsonState.status === ValueStatus.Available) {
            session.initializeMutant(ref, mutationObsCallback);
        }
        return () => {
            session.disconnectMutant();
        };
    }, [props.jsonState.status]);

    return <div>Helloss</div>;
};

export default Analytics;
