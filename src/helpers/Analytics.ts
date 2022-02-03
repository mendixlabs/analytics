import { v4 as uuidv4 } from "uuid";
import React from "react";
import PubSub from "pubsub-js";
import { debounce } from ".";
import {
    EClassNamePayloadType,
    EPayloadType,
    IAddPageDate,
    IClassNamePayload,
    INewPage,
    ITimer,
    IUserData
} from "./types";

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
interface IMendixCommunicationPayload {
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
    private observer: MutationObserver | undefined;
    private localStorageString = "sessionId";
    private previousResources: PerformanceEntryList | undefined;
    private timer: ITimer | undefined;
    private sentInitialTimer: boolean;
    private _timerCheck: any;
    private eventListenerToken: string | undefined;
    private timerToken: string | undefined;
    private userData: IUserData | undefined;

    constructor() {
        this.observer = undefined;
        this.sentInitialTimer = false;
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
     * Initialize Timer Listener Pubsub
     */
    timerListenerSub(callBackFn: (n: ITimer) => void) {
        this.timerToken = PubSub.subscribe(this.timerListenerName, (msg: string, data: string) => {
            this.timerCallBack(msg, data, callBackFn);
        });
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
    public addLandingPage(id: string, callBackFn: (n: any) => void) {
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
        PubSub.publish("PAGE_CHANGE", true); // Let Widget Know The Page Changed
        const payLoad = this.buildPayload({ newPage, prevPage: undefined });
        callBackFn(payLoad);
        // Build Payload
    }
    private buildPayload(payLoad: any): IMendixCommunicationPayload {
        const pLoad: IMendixCommunicationPayload = {
            sessionId: this.sessionId as string,
            userSession: this.userData as IUserData,
            ...payLoad
        };
        return pLoad;
    }

    /**
     * Callback called by timer Pubsub
     */
    private timerCallBack(_msg: string, data: string, callBackFn: (n: ITimer) => void) {
        const parsedData = JSON.parse(data);
        switch (parsedData.type) {
            case EPayloadType.START:
                this.startATimer(parsedData.name, callBackFn);
                break;
            case EPayloadType.END:
                this.endCurrentTimer(parsedData.name, callBackFn);
                break;
            default:
                break;
        }
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
                const payLoad = this.buildPayload({ event: clickAddedEvent });
                console.log("payLoad", payLoad);
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

    // /**
    //  * Adds EventLister Payload on Page
    //  * @param IClassNamePayload
    //  * @depricated
    //  */
    // private addEventListerFromPage(parsedData: IClassNamePayload): IClassNamePayload {
    //     const payLoad = {
    //         ...parsedData,
    //         pageId: this.currentPage?.uuid,
    //         dateAdded: new Date(),
    //         dateLastClicked: null,
    //         clicked: 0,
    //         _id: uuidv4()
    //     };
    //     this.eventListeners.push({
    //         ...payLoad
    //     });

    //     return payLoad;
    // }

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

    private setTimerToLocalStorage(name: string) {
        if (this.timer) {
            localStorage.setItem(name, JSON.stringify(this.timer));
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
            const previousPage = this.currentPage;
            if (previousPage) {
                const timerInMS = new Date().valueOf() - (this.currentPage?.startDate as Date).valueOf();
                previousPage.leaveDate = new Date();
                previousPage.duration = timerInMS / 1000;
            }
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
            const payLoad = this.buildPayload({ newPage, prevPage: previousPage });
            return callBackFn(payLoad);
        }
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

    private getCurrentResources() {
        const resources = performance.getEntriesByType("resource");
        if (!this.previousResources?.length) {
            /**
             * Initial Page Load - Count All
             */
            const times = this.sumOfDuration(resources);
            this.previousResources = resources;
            return times ? times / 1000 : 0;
        } else {
            const found = resources.findIndex(x => x.name.includes(this.currentPageName as string));
            this.previousResources = resources;
            const newEntries = resources.slice(found);
            const times = this.sumOfDuration(newEntries);
            return times ? times / 1000 : 0;
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

    private getTimerFromLocalStorage(name: string): ITimer | undefined {
        const localStorageId = localStorage.getItem(name);
        return localStorageId ? JSON.parse(localStorageId) : undefined;
    }
    private removeTimerFromLocalStorage(name: string): void {
        localStorage.removeItem(name);
    }

    private startATimer(name: string, callBackFn: (n: ITimer) => void) {
        if (this.timer && this.timer?.formName !== name) {
            // Abandoned old form
            return this.abandonedCurrentForm(name, callBackFn, true);
        }
        if (!this.sentInitialTimer) {
            return this.setUpANewTimer(name, callBackFn);
        } else {
            this.timer = {
                ...this.timer,
                id: this.timer?.id as string,
                formName: name,
                pageId: this.currentPage?.uuid as string,
                pageName: window.history.state.pageInfo.formParams.path,
                status: EPayloadType.START
            };
            clearInterval(this._timerCheck);
            this.setTimerToLocalStorage(name);
            this.startInternalTimerCheck(name, callBackFn);
        }
    }

    private setUpANewTimer(name: string, callBackFn: (n: any) => void) {
        this.timer = {
            id: uuidv4(),
            formName: name,
            pageId: this.currentPage?.uuid as string,
            pageName: window.history.state.pageInfo.formParams.path,
            status: EPayloadType.START,
            startDate: new Date()
        };
        this.sentInitialTimer = true;
        this.setTimerToLocalStorage(name);
        clearInterval(this._timerCheck);
        this.startInternalTimerCheck(name, callBackFn);
        const payLoad = this.buildPayload({ timer: this.timer });
        // If this is called by abandoned form we give it some time
        setTimeout(() => {
            callBackFn(payLoad);
        }, 100);
    }
    private abandonedCurrentForm(name: string, callBackFn: (n: any) => void, restart = false) {
        const timerInMS = new Date().valueOf() - (this.timer?.startDate as Date).valueOf();
        this.timer = {
            ...this.timer,
            id: this.timer?.id as string,
            pageId: this.currentPage?.uuid as string,
            formName: this.timer?.formName as string,
            status: EPayloadType.ABANDONED,
            endDate: new Date(),
            time: timerInMS / 1000,
            pageName: this.currentPageName as string
        };
        const payLoad = this.buildPayload({ timer: this.timer });
        callBackFn(payLoad);
        this.removeTimerFromLocalStorage(this.timer?.formName as string);
        clearInterval(this._timerCheck);
        this.sentInitialTimer = false;
        this.timer = undefined;
        if (restart) {
            this.startATimer(name, callBackFn);
        }
    }

    private startInternalTimerCheck(name: string, callBackFn: (n: ITimer) => void) {
        this._timerCheck = setInterval(() => {
            const getTimerFromStorage = this.getTimerFromLocalStorage(name);
            if (getTimerFromStorage) {
                if (this.currentPageName === getTimerFromStorage.pageName) {
                    // Still on Same Page so Form is Still being filled in
                } else {
                    // Current Page does not match in
                    this.abandonedCurrentForm(name, callBackFn);
                }
            }
        }, 500);
    }

    private endCurrentTimer(name: string, callBackFn: (n: ITimer) => void) {
        if (this.timer) {
            const timerInMS = new Date().valueOf() - (this.timer.startDate as Date).valueOf();
            this.timer = {
                ...this.timer,
                formName: name,
                status: EPayloadType.END,
                endDate: new Date(),
                time: timerInMS / 1000
            };
            clearInterval(this._timerCheck);
            this.removeTimerFromLocalStorage(name);
            callBackFn(this.timer);
            this.sentInitialTimer = false;
            this.timer = undefined;
        }
    }
}
