import { v4 as uuidv4 } from "uuid";
import { createElement, Fragment, useEffect, useRef } from "react";
import { AnalyticsEventContainerProps, ClassNameToTrackType } from "../typings/AnalyticsEventProps";
import PubSub from "pubsub-js";

const eventListenerName = "CLASSNAME_MENDIX_LISTENER";

const stringifyMe = (payLoad: any) => {
    return JSON.stringify(payLoad);
};

export const AnalyticsEvent = (props: AnalyticsEventContainerProps) => {
    const _id = useRef(uuidv4());
    const dispatchClickEvent = (className: ClassNameToTrackType, id: string) => {
        const payLoad = {
            ...className,
            groupId: _id.current,
            type: "CLICKED",
            _id: id
        };
        PubSub.publish(eventListenerName, stringifyMe(payLoad));
    };

    const addEventListeners = () => {
        const listeners = props.classNameToTrack.map(className => {
            if (className.isListView) {
                const query = document.querySelectorAll(`[class*="${className.className}"]`);
                query.forEach(q => {
                    const foundClassName = Array.from(q.classList).find(classItem =>
                        classItem.includes(className.className)
                    );
                    const _id = uuidv4();
                    const uu: ClassNameToTrackType = {
                        ...className,
                        friendlyName: foundClassName as string,
                        className: foundClassName as string
                    };
                    q.addEventListener("click", () => dispatchClickEvent(uu, _id)) as any;
                });
            } else {
                const classFound = document.getElementsByClassName(className.className)[0];
                if (classFound) {
                    const _id = uuidv4();
                    classFound.addEventListener("click", () => dispatchClickEvent(className, _id)) as any;
                    return classFound;
                }
            }
        });
        return listeners;
    };

    /**
     *  Widget waits for Main widget to let it know Dom is ready for listening
     */
    useEffect(() => {
        let listeners: (Element | undefined)[];
        const eventListenerToken = PubSub.subscribe("PAGE_CHANGE", () => {
            listeners = addEventListeners();
        });

        return () => {
            PubSub.unsubscribe(eventListenerToken);
            const payLoad = {
                groupId: _id.current,
                type: "UNLOAD"
            };
            PubSub.publish(eventListenerName, stringifyMe(payLoad));
            listeners.forEach(listener => {
                if (listener) {
                    listener && (listener as any).removeEventListener("click", null);
                }
            });
        };
    }, []);

    return <Fragment></Fragment>;
};
// const dispatchListeningEvent = (className: ClassNameToTrackType) => {
//     const payLoad = {
//         ...className,
//         groupId: _id.current,
//         type: "LISTENING"
//     };
//     PubSub.publish(eventListenerName, stringifyMe(payLoad));
// };
// friendlyName: string;
// className: string;
// isListView: boolean;
