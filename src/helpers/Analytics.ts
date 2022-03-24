import { v4 as uuidv4 } from "uuid";
import React from "react";
import PubSub from "pubsub-js";
import { debounce } from ".";
import { EClassNamePayloadType, IAddPageDate, IClassNamePayload, INewPage, IUserData } from "./types";

interface ISession {
    currentPageName: string | undefined;
    sessionId: string | undefined;
    didUserReload: boolean;
    eventListeners: IClassNamePayload[];
    eventListenerName: string;
    setUpSession: (id: string) => IUserData;
    addPage: (callBackFn: (n: IAddPageDate) => void) => void;
    initializeMutant: (ref: React.MutableRefObject<HTMLElement>, callback: Function) => MutationObserver;
    disconnectMutant: () => any;
    eventListenerSub: (callBackFn: (n: IClassNamePayload) => void) => void;
    eventListenerUnSub: () => void;
}
export interface IMendixCommunicationPayload {
    sessionId: string;
    userSession: IUserData;
    [key: string]: any;
}

export class AnalyticsSession implements ISession {
    eventListeners: IClassNamePayload[] = [];
    eventListenerName = "CLASSNAME_MENDIX_LISTENER";
    timerListenerName = "TIMER_MENDIX_LISTENER";
    currentPageName: string | undefined;
    sessionId: string | undefined;
    didUserReload = false;
    private startedDate: Date;
    private currentPage: INewPage | undefined;
    private prevPage: INewPage | undefined;
    private observer: MutationObserver | undefined;
    private localStorageString = "sessionId";
    private previousResources: PerformanceEntryList | undefined;
    private eventListenerToken: string | undefined;
    private timerToken: string | undefined;
    private userData: IUserData | undefined;

    constructor() {
        this.observer = undefined;
        this.startedDate = new Date();
    }

    /**
     * Initialize Event Listener Pubsub
     */
    eventListenerSub(callBackFn: (n: IClassNamePayload) => void) {
        this.eventListenerToken = PubSub.subscribe(this.eventListenerName, (msg: string, data: string) => {
            this.eventListenerCallBack(msg, data, callBackFn);
        });
    }
    /**
     * UnLoad Event Listener Pubsub
     */
    eventListenerUnSub() {
        if (this.eventListenerToken) {
            PubSub.unsubscribe(this.eventListenerToken);
        }
    }
    /**
     * UnLoad Timer Listener Pubsub
     */
    timerListenerUnSub() {
        if (this.timerToken) {
            PubSub.unsubscribe(this.timerToken);
        }
    }
    /**
     * addLandingPage
     */
    public addLandingPage(id: string, callBackFn: (n: IMendixCommunicationPayload) => void) {
        const browserPageName = window.history.state.pageInfo.formParams.path;
        // Set Up Initial User Settings
        this.setUpSession(id);
        // Add Initial Page
        this.currentPageName = browserPageName;
        const loadTime = this.getCurrentResources();
        const newPage: INewPage = {
            startDate: new Date(),
            leaveDate: undefined,
            duration: undefined,
            pathName: browserPageName,
            uuid: uuidv4(),
            loadTime
        };
        this.currentPage = newPage;
        this.prevPage = undefined;
        PubSub.publish("PAGE_CHANGE", true); // Let Widget Know The Page Changed
        const payLoad = this.buildPayloads({});
        callBackFn(payLoad);
        // Build Payload
    }
    private buildPayloads({ event }: any): IMendixCommunicationPayload {
        const pLoad: IMendixCommunicationPayload = {
            sessionId: this.sessionId as string,
            userSession: this.userData as IUserData,
            newPage: this.currentPage,
            prevPage: this.prevPage,
            event
        };
        return pLoad;
    }

    /**
     * Callback called by event Pubsub
     */
    private eventListenerCallBack(_msg: string, data: string, callBackFn: (n: any) => void) {
        const parsedData: IClassNamePayload = JSON.parse(data);
        switch (parsedData.type) {
            // case EClassNamePayloadType.LISTENING:
            //     setTimeout(() => {
            //         const newEvent = this.addEventListerFromPage(parsedData);
            //         callBackFn(newEvent);
            //     }, 2500);
            //     break;

            case EClassNamePayloadType.CLICKED:
                const clickAddedEvent = this.addClickedToEventListener(parsedData);
                const payLoad = this.buildPayloads({ event: clickAddedEvent });
                setTimeout(() => {
                    callBackFn(payLoad);
                }, 0);
                break;

            case EClassNamePayloadType.UNLOAD:
                const arrayUnTriggeredEvents = this.findUnTriggeredEvents(parsedData);
                arrayUnTriggeredEvents.forEach(event => {
                    setTimeout(() => {
                        callBackFn({ ...event, type: EClassNamePayloadType.UNLOAD });
                    });
                }, 1000);
                break;
            default:
                break;
        }
    }
    /**
     * Gets Current Session from Local Storage
     */
    private getSessionIdFromLocalStorage(): string | null {
        const localStorageId = localStorage.getItem(this.localStorageString);
        return localStorageId;
    }

    /**
     * Initializes Session on Load on Widget
     *  @param id - MX Session Id
     *  @returns User Data (IUserData)
     */
    setUpSession(id: string): IUserData {
        const localSession = this.getSessionIdFromLocalStorage();
        /**
         * Same Mendix session as in localStorage so user must have refreshed
         */
        if (localSession === id) {
            // Session Continued
            this.setSessionId(id);
            this.didUserReload = true;
            const userData = this.userDeviceSettings();
            this.userData = userData;
            this.getCurrentResources();
            return userData;
        } else {
            // Session Started
            this.setSessionId(id);
            this.setSessionToLocalStorage();
            this.didUserReload = false;
            const userData = this.userDeviceSettings();
            this.userData = userData;
            return userData;
        }
    }

    private addClickedToEventListener(parsedData: IClassNamePayload) {
        const foundClickIndex = this.eventListeners.findIndex(listener => listener.className === parsedData.className); // Nice

        if (foundClickIndex) {
            const payLoad = {
                ...parsedData,
                pageId: this.currentPage?.uuid,
                dateAdded: new Date(),
                dateLastClicked: new Date(),
                clicked: 1
            };
            this.eventListeners.push({
                ...payLoad
            });
            return payLoad;
        }

        this.eventListeners[foundClickIndex].type = EClassNamePayloadType.CLICKED;
        this.eventListeners[foundClickIndex].clicked = this.eventListeners[foundClickIndex].clicked + 1;
        this.eventListeners[foundClickIndex].dateLastClicked = new Date();

        return this.eventListeners[foundClickIndex];
    }

    private findUnTriggeredEvents(parsedData: IClassNamePayload): IClassNamePayload[] {
        const beingUnLoaded = this.eventListeners.filter(event => {
            return event.groupId === parsedData.groupId;
        });

        const newActiveEventListeners = this.eventListeners.filter(v => {
            return beingUnLoaded.find(c => {
                return c.groupId !== v.groupId;
            });
        });
        this.eventListeners = newActiveEventListeners;

        const unClickedEvents = beingUnLoaded.filter(items => {
            return items.type === EClassNamePayloadType.LISTENING;
        });
        return unClickedEvents;
    }

    private setSessionId(id: string) {
        this.sessionId = id;
    }

    private setSessionToLocalStorage() {
        if (this.sessionId) {
            localStorage.setItem(this.localStorageString, this.sessionId);
        }
    }
    addPage(callBackFn: (n: any) => void) {
        const browserPageName = window.history.state.pageInfo.formParams.path;
        // Check if page is new
        if (this.currentPageName === browserPageName) {
            // Page did not change
        } else {
            // Page did change
            PubSub.publish("PAGE_CHANGE", true); // Let Widget Know The Page Changed
            this.currentPageName = browserPageName;
            const loadTime = this.getCurrentResources();
            const newPage: INewPage = {
                startDate: new Date(),
                leaveDate: undefined,
                duration: undefined,
                pathName: browserPageName,
                uuid: uuidv4(),
                loadTime
            };
            this.currentPage = newPage;
            const payLoad = this.buildPayloads({});
            return callBackFn(payLoad);
        }
    }
    addLeavePage(callBackFn: (n: any) => void) {
        // Check if page is new
        // Page did not change
        if (!this.currentPage) {
        }
        this.getCurrentResources();
        const previousPage = { ...this.currentPage };
        if (previousPage) {
            const timerInMS = new Date().valueOf() - (this.currentPage?.startDate as Date).valueOf();
            previousPage.leaveDate = new Date();
            previousPage.duration = timerInMS;
        }
        this.prevPage = previousPage as INewPage;
        const payLoad = this.buildPayloads({});
        return callBackFn(payLoad);
    }

    private userDeviceSettings() {
        const userData: IUserData = {
            didUserReload: this.didUserReload,
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            startedDate: this.startedDate,
            userIDMX: (window as any).mx?.session?.getUserId(),
            isGuestMX: (window as any).mx?.session?.isGuest()
        };
        return userData;
    }

    /**
     * initialize Mutant observer
     */
    initializeMutant(ref: React.MutableRefObject<HTMLElement>, callback: Function) {
        const observerOptions = {
            childList: true,
            attributes: false,
            subtree: true
        };
        this.observer = new MutationObserver(debounce(callback, 1000));
        this.observer.observe(ref.current, observerOptions);
        return this.observer;
    }
    /**
     * disconnect Mutant observer
     */
    disconnectMutant() {
        if (this.observer) {
            return this.observer.disconnect;
        }
    }

    logDelta({ name, id, delta }: any) {
        console.log(`🔥${name} matching ID ${id} changed by ${delta}`);
    }

    public setPageLeaveResources() {
        const resources = performance.getEntriesByType("resource");
        this.previousResources = resources;
    }

    private getCurrentResources() {
        const resources = performance.getEntriesByType("resource");
        if (!this.previousResources?.length) {
            /**
             * Initial Page Load - Count All
             */
            const times = this.sumOfDuration(resources);
            this.previousResources = resources;
            return times ? times : 0;
        } else {
            const intersection = resources.filter(x => !(this.previousResources as PerformanceEntryList).includes(x));
            this.previousResources = resources;
            if (intersection.length) {
                const times = this.sumOfDuration(intersection);
                return times;
            } else {
                const times = this.sumOfDuration(resources);
                return times;
            }
        }
    }
    private sumOfDuration(resources: PerformanceEntryList) {
        const times = resources.reduce((a, c) => {
            if (c.duration) {
                return a + c.duration;
            }
            return a;
        }, 0);

        return times;
    }
}
