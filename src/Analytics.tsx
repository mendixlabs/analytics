import { createElement, useRef, useEffect } from "react";
import { AnalyticsContainerProps } from "../typings/AnalyticsProps";
import { ValueStatus } from "mendix";
import { AnalyticsSession } from "./helpers/Analytics";
import { IAddPageDate, IClassNamePayload, ITimer } from "./helpers/types";

const session = new AnalyticsSession();

const Analytics = (props: AnalyticsContainerProps) => {
    const ref = useRef(document.body);

    const sendClickEvent = (event: IClassNamePayload) => {
        console.log("event", event);
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

    const sendTimerEvent = (timer: ITimer) => {
        if (props.timerAction?.canExecute && !props.timerAction?.isExecuting) {
            props.communicateOut.setValue(JSON.stringify(timer));
            props.timerAction?.execute();
        }
    };
    // // Initialize PubSub for Timers
    // useEffect(() => {
    //     session.timerListenerSub(sendTimerEvent);
    //     return () => {
    //         session.timerListenerUnSub();
    //     };
    // }, [props.timerAction]);

    useEffect(() => {
        console.log("🔥", props.jsonState.status);
        if (props.jsonState.status === ValueStatus.Available && !session.sessionId) {
            const mxSession = JSON.parse(props?.jsonState?.displayValue);
            session.addLandingPage(mxSession.sessionId, addPageLand);
        }
    }, [props.jsonState.status]);

    const addPageLand = (newPage: any) => {
        console.log("addPageLand", newPage, JSON.stringify(newPage));
        props.communicateOut.setValue(JSON.stringify(newPage));
        props.sendInitialSession?.execute();
    };

    const addPageToServer = (newPage: any) => {
        console.log("addPageToServer", newPage, JSON.stringify(newPage));
        props.communicateOut.setValue(JSON.stringify(newPage));
        props.addPageViewed?.execute();
    };

    function mutationObsCallback() {
        session.addPage(addPageToServer);
    }

    useEffect(() => {
        if (props.jsonState.status === ValueStatus.Available) {
            session.initializeMutant(ref, mutationObsCallback);
        }
        return () => {
            session.disconnectMutant();
        };
    }, [props.jsonState.status]);

    return <div></div>;
};

export default Analytics;

// User Changes Tab or New Window
// window.addEventListener("visibilitychange", function () {
//     console.log(`object🔥`, document.visibilityState);
// });

// window.history.pushState = new Proxy(window.history.pushState, {
//     apply: (target, thisArg, argArray) => {
//         console.log("🔥", window.history.state.pageInfo.formParams.path); // Right before the user gets off
//         return target.apply(thisArg, argArray);
//     }
// });

// window.onpopstate = function (event) {
//     console.log("🔥🔥🔥🔥", window.history.state.pageInfo.formParams.path); // Right before the user gets off
// };

// const initialState = props => {
//     console.log("propsAnalyticsContainerProps", props);

//     return {
//         isRunning: false,
//         time: 0
//     };
// };
// create a function to subscribe to topics
