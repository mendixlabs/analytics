import { createElement, useRef, useEffect } from "react";
import { AnalyticsContainerProps } from "../typings/AnalyticsProps";
import { ValueStatus } from "mendix";
import { AnalyticsSession } from "./helpers/Analytics";
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
    // function pageOffLoad() {
    //     console.log("🧰", window.history.state.pageInfo.formParams.path); // Right before the user gets off
    //     // session.addPage(addPageToServer);
    //     session.setPageLeaveResources();
    // }

    useEffect(() => {
        if (props.jsonState.status === ValueStatus.Available) {
            // window.history.pushState = new Proxy(window.history.pushState, {
            //     apply: (target, thisArg, argArray) => {
            //         pageOffLoad();
            //         return target.apply(thisArg, argArray);
            //     }
            // });
            // window.onpopstate = function (event) {
            //     console.log("🧰", window.history.state.pageInfo.formParams.path); // Right before the user gets off
            // };
            session.initializeMutant(ref, mutationObsCallback);
        }
        return () => {
            session.disconnectMutant();
        };
    }, [props.jsonState.status]);

    return <div></div>;
};

export default Analytics;
// window.addEventListener("visibilitychange", function () {
// });
//     console.log(`object🔥`, document.visibilityState);
// });

// window.history.pushState = new Proxy(window.history.pushState, {
//     apply: (target, thisArg, argArray) => {
//         console.log("🔥", window.history.state.pageInfo.formParams.path); // Right before the user gets off
//         return target.apply(thisArg, argArray);
//     }
