/**
 * This file was generated from NlyticsEvent.xml
 * WARNING: All changes made to this file will be overwritten
 * @author Mendix UI Content Team
 */
import { CSSProperties } from "react";

export interface ClassNameToTrackType {
    friendlyName: string;
    className: string;
    isListView: boolean;
}

export interface ClassNameToTrackPreviewType {
    friendlyName: string;
    className: string;
    isListView: boolean;
}

export interface NlyticsEventContainerProps {
    name: string;
    class: string;
    style?: CSSProperties;
    tabIndex?: number;
    classNameToTrack: ClassNameToTrackType[];
}

export interface NlyticsEventPreviewProps {
    className: string;
    style: string;
    styleObject?: CSSProperties;
    readOnly: boolean;
    classNameToTrack: ClassNameToTrackPreviewType[];
}
