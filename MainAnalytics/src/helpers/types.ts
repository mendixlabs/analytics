export interface INewPage {
    startDate: Date;
    leaveDate: Date | undefined;
    pathName: string;
    uuid: string;
    duration: number | undefined;
    loadTime: number;
    // modals?: IPopUp[];
}

export interface IPopUp extends INewPage {
    pageId: string;
}
export interface IAddPageDate {
    newPage: INewPage;
    prevPage: INewPage | undefined;
}
export interface IUserData {
    didUserReload: boolean;
    userAgent: string;
    platform: string;
    language: string;
    startedDate: Date;
    userIDMX: string;
    isGuestMX: string;
    browserName: string;
    browserVersion: string;
}
export interface ITimer {
    id: string;
    startDate?: Date;
    endDate?: Date;
    time?: number;
    status: EPayloadType;
    pageName: string;
    formName: string;
    pageId: string;
}

export interface ITimerPayload {
    type: EPayloadType;
    currentPage: number;
}
export interface IClassNamePayload {
    groupId: string;
    _id: string;
    type: EClassNamePayloadType;
    className: string;
    friendlyName: string;
    dateAdded: Date;
    dateLastClicked: Date | null;
    pageId: string | undefined;
    clicked: number;
}
export enum EPayloadType {
    START = "START",
    END = "END",
    ABANDONED = "ABANDONED"
}
export enum EClassNamePayloadType {
    CLICKED = "CLICKED",
    LISTENING = "LISTENING",
    UNLOAD = "UNLOAD"
}
export enum PayloadType {
    REGISTER,
    FOCUS_SWITCH,
    LEAVE
}
export interface IFormPayload {
    id: string;
    type: PayloadType;
    elementId: string;
}
